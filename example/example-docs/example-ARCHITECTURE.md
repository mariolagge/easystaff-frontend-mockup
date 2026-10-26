# docs\ARCHITECTURE.md

Governed by `SPEC.md` §0 (document hierarchy, anti-duplication, change protocol). This document owns structure, modules, messaging, persistence, ports and technical boundaries — and nothing else. Product rules live in `SPEC.md`, names in `GLOSSARY.md`.

---

## 1. High-Level Overview

The technical structure implementing the product defined in `SPEC.md` §1:

```
Simulator ──▶ RabbitMQ queue ──▶ TelemetryProcessor ──▶ PostgreSQL ◀── OperatorApi ──▶ nginx ──▶ browser
```

Telemetry flows one way only. No module calls another over HTTP, and nothing flows back towards the Simulator — the API is read-only (`SPEC.md` §6), so no command path exists.

Infrastructure (PostgreSQL, RabbitMQ, nginx/frontend) is started via `docker compose up` from `docker/`. The three Spring Boot modules are **not** containerized; each is built and run independently (Maven/IDE) against that infra.

Every run starts from the same known state, because `TelemetryProcessor` clears both tables at startup (§4). Reproducibility therefore does not depend on whether the Postgres volume survives a `docker compose down`.

---

## 2. Modules

Three independent Spring Boot Maven modules under the root aggregator `pom.xml` (artifactId `agri-fleet-analytics`), each with its own `pom.xml` and `application.properties`. There is no shared library module — the telemetry message (`SPEC.md` §3.1) is defined as its own DTO in both `Simulator` and `TelemetryProcessor`, and that duplication is accepted.

| Module | Port | Consumes | Writes | Role |
|--------|------|----------|--------|------|
| `Simulator` | — | — | queue `telemetry` | Generates telemetry per `SPEC.md` §3 and publishes it. Holds its state in memory. |
| `TelemetryProcessor` | — | queue `telemetry` | tables `asset_state`, `hourly_aggregate` | The only consumer. Accumulates the counters and hourly buckets (`SPEC.md` §4), evaluates flags, status, live condition and ranking (`SPEC.md` §5), persists completed hours and upserts the live view. |
| `OperatorApi` | 8083 | — | — | Serves the read-only REST API (`SPEC.md` §6) by querying `asset_state` and `hourly_aggregate`. Consumes no queue, writes no table, and derives no product rule — it maps stored rows onto the §6 response shapes. |

**One accumulator.** `SPEC.md` §4.3 derives the rolling 24-hour window from the same hourly buckets that the historical record is built from, so counter accumulation is a single concern and lives in a single module. `TelemetryProcessor` holds the buckets in memory, flushes each hour to `hourly_aggregate` once it completes, and sums the most recent 24 for the rolling scope. The `SPEC.md` §4.2 accumulation rule therefore exists in exactly one place and the two tables cannot disagree about the same hour.

**One HTTP port.** `Simulator` and `TelemetryProcessor` expose no endpoints and run with no web server (`spring.main.web-application-type=none`); their AMQP listener and scheduler threads keep the process alive. `OperatorApi` on 8083 is the only port in the system.

---

## 3. Messaging

One durable RabbitMQ queue named `telemetry`, published to through the default exchange. `Simulator` and `TelemetryProcessor` each declare the queue bean; idempotent re-declaration by both modules is expected, not a bug.

There is exactly one consumer, so no exchange or binding is required. Should a second, independent consumer of the same stream ever be introduced, this must become a fanout exchange with one queue per consumer — two consumers on one queue would compete and each receive roughly half, silently halving all counters.

There is no command or control queue. Nothing publishes towards the `Simulator`.

---

## 4. Persistence

PostgreSQL database `agri-fleet-analytics-db` (user/password `admin`/`admin`). Schema is hand-written SQL in `docker/database-script.sql`, mounted into the container's `/docker-entrypoint-initdb.d` and applied when the database is first created; `spring.jpa.hibernate.ddl-auto=none`, no Hibernate auto-DDL.

| Table | Written by | Read by | Contents |
|-------|------------|---------|----------|
| `asset_state` | `TelemetryProcessor` | `OperatorApi` | One row per asset: the eight counters in both scopes, the four flags each with the severity, triggering counter, scope, value and threshold behind it, the derived figures of `SPEC.md` §4.5, status, recommendation, live condition, priority rank, and the most recent telemetry message. |
| `hourly_aggregate` | `TelemetryProcessor` | `OperatorApi` | One row per asset per completed hour: the eight counters' per-hour deltas, keyed by asset and hour start. |

Raw telemetry is not persisted; only the latest message per asset survives, inside `asset_state`.

`asset_state` carries every value the `SPEC.md` §6.1 response needs, including the reason behind each active flag. This is what keeps `OperatorApi` free of product rules: it never re-derives a threshold, a percentage or a recommendation, it only reads them.

**Write cadence.** `asset_state` is upserted on every processed message that is roughly current, and refreshed on a fixed interval as well. The interval is required because three groups of values move with wall-clock time rather than with message arrival — the rolling window edge (`SPEC.md` §4.3), window coverage and the utilization percentages (§4.5), and staleness of the live condition (§5.3) — and an asset that stops reporting would otherwise stay frozen at its last message forever.

**Catch-up.** A message whose timestamp is well behind wall-clock is accumulated into the in-memory buckets but triggers no write; the fixed-interval refresh then publishes the result. The rule is general, not a special case for the `SPEC.md` §3.2 startup burst, and it is what keeps that burst from turning thousands of messages into thousands of four-row transactions before the API can answer at all. Nothing is lost by skipping the write, because the refresh publishes whatever the accumulators hold.

Priority rank is a cross-asset value, so all four `asset_state` rows are written by a single `saveAll`, which is atomic on its own; upserting a single asset's rank would transiently leave two rows claiming the same rank. The sealed hours reach `hourly_aggregate` in a second, separate write — `asset_state` and `hourly_aggregate` are two transactions, never one spanning both tables — and an hour is marked flushed only after its write returns, so a failed write leaves the hour unsealed for the next cycle to retry.

**Startup reset.** `TelemetryProcessor` clears `asset_state` and `hourly_aggregate` before consuming anything, then writes the `SPEC.md` §4.4 baselines. Lifetime counters and history are therefore never carried across a restart, and a stale Postgres volume cannot leak state into a new run. The clear and the first write are separate transactions, so `asset_state` is briefly empty and the API answers `SPEC.md` §6.1's `503` until that write returns.

Counter columns store hours as `numeric`. The hourly buckets themselves live in `TelemetryProcessor`'s memory while their hour is still open — they are derived state, rebuilt from the stream — and reach the database once **that asset's own stream** has moved past the hour, not once wall-clock has: a bucket is written when a message for a later hour has been processed, which `SPEC.md` §4.2 makes final. An asset that stops reporting therefore leaves its last hour open rather than sealing it on the clock.

---

## 5. Networking

`docker/nginx-conf/nginx.conf` serves the frontend and proxies `/api/` to `OperatorApi` on port 8083. `OperatorApi` is the only module the browser ever reaches; RabbitMQ and PostgreSQL are reachable from the host only for local development and management.

The `/api/` prefix is passed through unchanged, so `OperatorApi` maps the full `SPEC.md` §6 paths and sets no servlet context path.

---

## 6. REST API

`OperatorApi` (port 8083) is the only module exposing REST endpoints. The full contract — paths, parameters, response bodies and status codes — is in `SPEC.md` §6.

---

## 7. Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Java 25 |
| Application framework | Spring Boot 4.0.5 (root `pom.xml` is the authoritative version) |
| Messaging | RabbitMQ |
| Database | PostgreSQL |
| Frontend | HTML + CSS + vanilla JavaScript |
| Orchestration | Docker Compose (infrastructure only) |

No AI runtime is part of the system; see `SPEC.md` §8.

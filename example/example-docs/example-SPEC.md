# docs\SPEC.md

## 0. Document Hierarchy & Single Source of Truth

Apply on every decision and every edit. This section is the only copy of these rules; `CLAUDE.md`, `ARCHITECTURE.md` and `GLOSSARY.md` reference it instead of restating it. `CLAUDE.md` outranks this document but delegates the ranking itself to this section, so §0 stays the one place the hierarchy is written down.

**Hierarchy (highest → lowest)**
0. `CLAUDE.md` (repo root) — entry point; working conventions: coding style, build and run commands, repo status
1. `SPEC.md` — product rules, domain logic, API contracts, acceptance criteria, scope
2. `ARCHITECTURE.md` — system structure, modules, messaging, persistence, ports, technical boundaries
3. `GLOSSARY.md` — all naming (types, fields, flags, statuses, endpoints)

**Conflict Resolution**
- Higher document always prevails. Align or ignore lower documents.
- Requests that conflict with `SPEC.md` (out-of-scope or constraints) → do not implement. Record under §8 Future work. Stay strictly in scope.
- Never invent rules, names, modules, or steps that contradict any document.
- When uncertain: re-read the highest relevant document and quote the exact rule before acting.

**Anti-Duplication**
- Coding style / build and run commands / repo status → ONLY `CLAUDE.md`
- Product / domain / API / acceptance / scope → ONLY `SPEC.md`
- Structure / modules / messaging / persistence / ports → ONLY `ARCHITECTURE.md`
- Naming → ONLY `GLOSSARY.md`

**Forbidden**
- Copy any rule, threshold, flag, status logic, naming, architecture decision, or coding-style rule into another file.
- Lower documents may only reference higher documents (e.g. "see SPEC.md §4"). Never restate content.
- The three `docs/` files may not restate coding style, commands or repo status from `CLAUDE.md`.

**Document Change Protocol**
1. Edit only the authoritative file.
2. Immediately scan the other three files for stale or duplicated content.
3. Remove or update so the four files remain non-overlapping and consistent.
4. A change to a higher file that invalidates a lower file must be fixed in the same response.

**Pre-Completion Check**
- No rule or name is defined in more than one file.
- All four files are mutually consistent.

---

## 1. Goal

A distributed system that monitors utilization of one tractor and three typical Austrian hay/dairy-farm implements and provides transparent decision support for maintenance prioritisation and short-term operational risk.

Every number the system shows must be traceable to a counter, and every counter must be traceable to telemetry. No hidden scoring, no machine learning, no opaque weighting.

---

## 2. Assets

The fleet is fixed at four assets. There is no asset registration or discovery.

| Asset | Role |
|-------|------|
| `TRACTOR` | Primary power unit; pulls or drives the three implements. |
| `MOWER` | Rotary/disc mower. |
| `BALER` | Round baler. |
| `MIXER` | Feed mixer wagon. |

---

## 3. Telemetry

### 3.1 Message

Each asset publishes one telemetry message every 5–10 seconds, independently of the other assets. That is the steady cadence; a run opens with a denser startup burst instead, described in §3.2.

```json
{
  "assetId": "BALER",
  "timestamp": "2026-07-31T01:15:00Z",
  "ptoEngaged": true,
  "groundSpeedKmh": 8.4,
  "loadFactor": 0.78,
  "temperatureC": 87.2,
  "vibrationLevel": "ELEVATED",
  "workingStatus": "WORKING"
}
```

| Field | Type | Constraint |
|-------|------|------------|
| `assetId` | string | One of the four §2 assets. |
| `timestamp` | string | ISO-8601 instant in UTC. |
| `ptoEngaged` | boolean | — |
| `groundSpeedKmh` | number | ≥ 0 |
| `loadFactor` | number | 0.0–1.0 |
| `temperatureC` | number | — |
| `vibrationLevel` | string | `NORMAL`, `ELEVATED` or `HIGH` |
| `workingStatus` | string | `WORKING`, `TRANSPORT` or `IDLE` |

`workingStatus` is emitted by the simulator as `WORKING` exactly when `ptoEngaged` is true and `groundSpeedKmh > 2`. Consumers do **not** rely on that guarantee: they derive productive work from the condition itself and use `workingStatus` only to separate `TRANSPORT` from `IDLE` (see §4.1). This keeps the §4.1 invariant true even if the simulator is changed or misbehaves.

### 3.2 Simulator behaviour

The simulator is the only source of telemetry and must produce enough variation for the §5 flags to be reachable within a demo session. It is not a physics model; the ranges below are the contract.

Each asset independently walks a three-state cycle with random dwell times:

| State | Dwell | Next state |
|-------|-------|------------|
| `WORKING` | 20–60 min | `TRANSPORT` (60 %) or `IDLE` (40 %) |
| `TRANSPORT` | 3–10 min | `WORKING` (70 %) or `IDLE` (30 %) |
| `IDLE` | 5–30 min | `WORKING` (80 %) or `TRANSPORT` (20 %) |

Field values per state:

| State | `ptoEngaged` | `groundSpeedKmh` | `loadFactor` |
|-------|--------------|------------------|--------------|
| `WORKING` | `true` | `TRACTOR` 6–14, `MOWER` 8–13, `BALER` 6–10, `MIXER` 3–5 | per asset, see below |
| `TRANSPORT` | `false` | 12–30 (`MIXER` 8–18) | 0.15–0.35 |
| `IDLE` | `false` | 0 | 0.05–0.15 |

The four machines do not wear alike, so the working `loadFactor` band and the two excursion rates are **per asset**. These are the only per-asset differences that any §4.1 counter reads — `groundSpeedKmh` above differs too, but no counter or threshold uses it — so this table is what makes the §5.4 ranking separate one machine from another rather than rank four identical ones by noise:

| Asset | working `loadFactor` | thermal excursion chance | vibration excursion chance |
|-------|----------------------|--------------------------|----------------------------|
| `TRACTOR` | 0.30–0.90 | 1.5 % | 1.0 % |
| `BALER` | 0.25–0.81 | 0.15 % | 0.15 % |
| `MOWER` | 0.25–0.78 | 0.15 % | 0.8 % |
| `MIXER` | 0.25–0.72 | 0.15 % | 0.15 % |

Over a full window these values are intended to give three stable anchors and one machine that moves: `TRACTOR` `CRITICAL` on the rolling flags, `BALER` `WATCH` on `HEAVY_RECENT_USE` alone, `MIXER` `GOOD`, and `MOWER` drifting between `GOOD`, `WATCH` and `CRITICAL` as its `MECHANICAL_ATTENTION` flag comes and goes.

`MOWER` moves because its only flag driver is the vibration excursion, and a window holds fewer than ten excursions of 2–15 minutes each — too few to average out. This is a property of the design, not a value that can be tuned away: the `ELEVATED` path is the only low-variance route to `vibrationAlertHours`, and it cannot be reached without also pushing `highLoadHours` past its own `SEVERE` bar, because both read the same `loadFactor` and 0.85 > 0.75. The three anchors are what make the §5.4 ranking meaningful; `MOWER` is what makes it visibly live.

`temperatureC` drifts smoothly: 70–85 °C while `WORKING`, 55–70 °C while `TRANSPORT`, cooling towards 45–60 °C while `IDLE`. Independently of the state cycle, each asset enters a **thermal excursion** (temperature 91–98 °C) at its rate above per minute of working time, lasting 2–15 minutes.

`vibrationLevel` is `NORMAL` by default, `ELEVATED` while `loadFactor ≥ 0.85`, and enters a **vibration excursion** (`HIGH`) at its rate above per minute of working time, lasting 2–15 minutes.

Both rates are **per minute of working time**, not per emitted message: the message cadence differs between the startup burst and the live phase, and a per-message rate would make the same machine wear at two different speeds. Only `TRACTOR`'s band reaches 0.85, so it is the only asset that reports `ELEVATED` from load alone; the other three reach `vibrationAlertHours` through excursions only.

**Startup burst.** Counters accrue wall-clock time at 1:1, so a run that began at zero would need hours of real time before any §5.1 rolling flag could appear — which the "reachable within a demo session" requirement above forbids. Each asset therefore opens its run by publishing one message per simulated minute across a configurable window of the immediately preceding hours, ending at the present moment, and only then switches to the §3.1 cadence. The step is exactly 60 seconds, which §4.2 credits rather than discards, so the burst fills the rolling window and the hourly history in the time it takes to publish. Message timestamps stay true wall-clock instants throughout; nothing is backdated beyond the window itself.

The window defaults to the full 24 hours. It is a calibration knob, not a threshold: shortening it only moves a run's starting point along the same ramp, and at 24 hours the rates above put each machine at its intended status.

Simulator state is in-memory only and starts fresh on every run, burst included.

---

## 4. Counters

### 4.1 Counter set

Eight counters are maintained per asset. Each counter accumulates time, expressed in hours.

| Counter | Accumulates on a message when |
|---------|-------------------------------|
| `engineHours` | always (the asset is switched on and reporting) |
| `totalWorkingHours` | `ptoEngaged` **and** `groundSpeedKmh > 2` |
| `transportHours` | not productive work **and** `workingStatus` = `TRANSPORT` |
| `idleHours` | not productive work **and** `workingStatus` ≠ `TRANSPORT` |
| `loadedHours` | productive work **and** `loadFactor ≥ 0.55` |
| `highLoadHours` | productive work **and** `loadFactor ≥ 0.75` |
| `tempExcursionHours` | `temperatureC > 90` (regardless of working state) |
| `vibrationAlertHours` | `vibrationLevel` is `ELEVATED` or `HIGH` (regardless of working state) |

"Productive work" means the `totalWorkingHours` condition.

Temperature and vibration are **not** gated on productive work: a machine overheating while idling is still overheating. Load counters are gated, because load only has meaning under power.

**Invariant** — `engineHours` = `totalWorkingHours` + `transportHours` + `idleHours`, exactly. The three branches partition every message. `totalWorkingHours` ≥ `loadedHours` ≥ `highLoadHours` also holds, because 0.75 ≥ 0.55.

### 4.2 Accumulation rule

On each telemetry message for an asset:

1. If the message `timestamp` is less than or equal to the last processed timestamp for that asset, discard the message entirely (out-of-order or duplicate delivery). It updates nothing.
2. Compute Δt = `timestamp` − last processed timestamp, in seconds. For the first message of an asset, Δt is undefined.
3. If Δt is undefined or Δt > 60 s, **discard Δt**: add nothing to any counter, including `engineHours`. Store the timestamp as the new last-processed value and continue. A Δt above 60 s is roughly six times the maximum cadence and therefore means the simulator or a consumer was down; crediting that time would invent hours the machine never ran.
4. Otherwise add Δt / 3600 to every counter whose §4.1 condition is true for **this** message, and store the timestamp as the new last-processed value.

Conditions are evaluated only on the current message; the elapsed interval is attributed to the state reported at its end. With Δt ≤ 60 s the resulting error is bounded by one minute per state change.

### 4.3 Hourly buckets and the rolling 24-hour window

Counter contributions are accumulated into **hourly buckets**, aligned to whole hours in the `Europe/Vienna` time zone. A bucket holds the amount each of the eight counters accrued within that hour. A message's whole Δt is credited to the bucket containing its own timestamp; because Δt ≤ 60 s, at most one minute can land in the neighbouring hour.

Two scopes are derived from the buckets:

- **Rolling 24 h** — the current, still-open bucket plus the 23 completed buckets before it. Actual coverage is therefore between 23 and 24 hours depending on the position within the current hour. This is deliberate: the window reacts to load within seconds instead of lagging up to an hour behind.
- **Lifetime** — the seeded baseline (§4.4) plus everything accrued since the process started.

Bucket contents are exact seconds, so threshold comparisons are exact; only the *edge* of the window is quantised to the hour.

DST transitions (23- and 25-hour local days) are not handled specially — out of scope (§8).

### 4.4 Seeded lifetime baselines

Real machines arrive with a service history, and `loadedHours` thresholds in the 850–1200 h range are unreachable in a demo starting from zero. Each asset therefore starts with a fixed lifetime baseline, loaded at startup:

| Asset | `engineHours` | `totalWorkingHours` | `transportHours` | `idleHours` | `loadedHours` | `highLoadHours` | `tempExcursionHours` | `vibrationAlertHours` |
|-------|---------------|---------------------|------------------|-------------|---------------|-----------------|----------------------|------------------------|
| `TRACTOR` | 6200 | 3400 | 1500 | 1300 | 980 | 410 | 26 | 58 |
| `MOWER` | 950 | 640 | 210 | 100 | 310 | 95 | 4 | 12 |
| `BALER` | 1480 | 1010 | 300 | 170 | 620 | 240 | 11 | 46 |
| `MIXER` | 1120 | 860 | 60 | 200 | 415 | 130 | 7 | 19 |

Every row satisfies the §4.1 invariant. On the baselines alone — before any telemetry — `TRACTOR` sits at `WATCH` on its single lifetime flag and the other three at `GOOD`, so the fleet is already ranked and readable the moment the system starts, with no asset pinned to `CRITICAL` by its history.

The §3.2 startup burst then fills the rolling window within seconds of that, and the statuses it produces are the ones §3.2 describes. The baselines above are what make the *lifetime* flag reachable at all; they are not the whole of what the first screen shows.

Baselines apply to the **lifetime** scope only. The rolling 24-hour window always starts empty.

Lifetime counters are not carried across restarts: every run starts from these baselines. This keeps demo runs reproducible.

### 4.5 Utilization

Two percentages are published, both over the rolling 24-hour window:

- `utilizationPercent` = `totalWorkingHours` (24 h) / `windowCoverageHours` × 100 — how much of the recent day the machine spent working.
- `productiveSharePercent` = `totalWorkingHours` (24 h) / `engineHours` (24 h) × 100 — of the time it was actually running, how much was productive.

Both are `null` when their denominator is 0, which is the case for any asset that has not reported in this run.

`windowCoverageHours` = the time from the later of (start of the oldest included bucket) and (the asset's first message in this run) up to now.

No lifetime utilization percentage is published: the §4.4 baselines carry no wall-clock time, so a lifetime percentage would divide seeded hours by a run-length denominator and be meaningless.

---

## 5. Flags, status and ranking

### 5.1 Flag definitions

Four named flags exist. Each is a single flag that is either inactive, `MODERATE` or `SEVERE`; the severity is the highest threshold currently met. Eight threshold rows below therefore produce at most four active flags.

Evaluated on the rolling 24-hour window:

| Flag | Condition | Severity |
|------|-----------|----------|
| `HEAVY_RECENT_USE` | `highLoadHours` (24 h) ≥ 1.5 h | `MODERATE` |
| `HEAVY_RECENT_USE` | `highLoadHours` (24 h) ≥ 2.5 h | `SEVERE` |
| `THERMAL_LOAD` | `tempExcursionHours` (24 h) ≥ 0.8 h | `MODERATE` |
| `THERMAL_LOAD` | `tempExcursionHours` (24 h) ≥ 1.5 h | `SEVERE` |
| `MECHANICAL_ATTENTION` | `vibrationAlertHours` (24 h) ≥ 1.0 h | `MODERATE` |
| `MECHANICAL_ATTENTION` | `vibrationAlertHours` (24 h) ≥ 2.0 h | `SEVERE` |

Evaluated on the lifetime scope:

| Flag | Condition | Severity |
|------|-----------|----------|
| `HIGH_CUMULATIVE_LOAD` | `loadedHours` (lifetime) ≥ 850 h | `MODERATE` |
| `HIGH_CUMULATIVE_LOAD` | `loadedHours` (lifetime) ≥ 1200 h | `SEVERE` |

Every active flag is published together with the counter value and the threshold that triggered it, so the farmer can always see the underlying reason.

### 5.2 Status

Counting each active flag once, at its current severity:

- `CRITICAL` — at least one `SEVERE` flag **or** two or more `MODERATE` flags
- `WATCH` — exactly one `MODERATE` flag and no `SEVERE` flag
- `GOOD` — no active flag

The three cases are exhaustive and mutually exclusive.

### 5.3 Live condition

The status above is an integral over 24 hours and therefore cannot answer "is this machine in trouble *right now*". A separate, clearly-separated indicator is derived from the most recent message only:

| Value | Condition |
|-------|-----------|
| `STALE` | the most recent message for this asset is more than 60 s old, or the asset has not reported at all in this run |
| `ALERT` | `vibrationLevel` = `HIGH` **or** `temperatureC > 95` |
| `CAUTION` | `vibrationLevel` = `ELEVATED` **or** `temperatureC > 90` **or** `loadFactor ≥ 0.9` |
| `NORMAL` | otherwise |

Evaluated top to bottom; the first matching row wins.

`liveCondition` never influences flags, status, ranking or recommendations. It is displayed next to them, not merged into them.

### 5.4 Priority ranking

All four assets are ranked on every request; an asset with no flags simply sorts to the bottom. Sort by, in order:

1. number of `SEVERE` flags, descending
2. number of `MODERATE` flags, descending
3. `highLoadHours` (24 h) + `tempExcursionHours` (24 h) + `vibrationAlertHours` (24 h), descending
4. `assetId`, ascending

Criterion 3 is a deliberate heuristic: the three counters can overlap on the same message, so the sum is a tie-breaking magnitude, not a physical quantity. Criterion 4 guarantees a fully deterministic order.

`priorityRank` is 1-based and assigned by this order.

### 5.5 Service recommendation

"Engine hours" below means the `engineHours` counter (§4.1) of that machine.

| Status | Recommendation |
|--------|----------------|
| `CRITICAL` | Priority check recommended within the next 5 engine hours. |
| `WATCH` | Plan inspection within the next 15–20 engine hours. |
| `GOOD` | No inspection recommended at this time. |

---

## 6. REST API

Exposed by OperatorApi (see `ARCHITECTURE.md` §2 for the module and port). No authentication — demo system. The API is **read-only**; no endpoint changes system state.

All timestamps in requests and responses are ISO-8601 instants in UTC. Errors use Spring's default error body with the status code and message given below; there is no custom error DTO.

| Method & Path | Description |
|---------------|-------------|
| `GET /api/assets` | Current counters, flags, status and priority ranking for all four assets. |
| `GET /api/assets/{assetId}` | The same view for a single asset. |
| `GET /api/history` | Hourly aggregates for a requested period. |
| `GET /api/telemetry/latest` | The most recent telemetry message per asset. |

### 6.1 `GET /api/assets`

`200 OK` — `assets` is ordered by `priorityRank`.

```json
{
  "generatedAt": "2026-08-13T09:41:12Z",
  "assets": [
    {
      "assetId": "TRACTOR",
      "priorityRank": 1,
      "status": "WATCH",
      "liveCondition": "NORMAL",
      "recommendation": "Plan inspection within the next 15–20 engine hours.",
      "flags": [
        {
          "flag": "HIGH_CUMULATIVE_LOAD",
          "severity": "MODERATE",
          "counter": "loadedHours",
          "scope": "LIFETIME",
          "value": 981.4,
          "threshold": 850.0
        }
      ],
      "lifetimeCounters": {
        "engineHours": 6203.1,
        "totalWorkingHours": 3401.8,
        "transportHours": 1500.6,
        "idleHours": 1300.7,
        "loadedHours": 981.4,
        "highLoadHours": 411.2,
        "tempExcursionHours": 26.0,
        "vibrationAlertHours": 58.3
      },
      "rolling24hCounters": {
        "engineHours": 3.1,
        "totalWorkingHours": 1.8,
        "transportHours": 0.6,
        "idleHours": 0.7,
        "loadedHours": 1.4,
        "highLoadHours": 1.2,
        "tempExcursionHours": 0.0,
        "vibrationAlertHours": 0.3
      },
      "windowCoverageHours": 3.1,
      "utilizationPercent": 58.1,
      "productiveSharePercent": 58.1
    }
  ]
}
```

Assets that have never reported in this run are still listed, with their §4.4 baselines as `lifetimeCounters`, zeroed `rolling24hCounters`, `liveCondition` `STALE`, and both percentages `null`.

`503 Service Unavailable` — no state has been published yet, so there is nothing to list. This is a startup condition, not an empty fleet: the fleet is fixed at four assets (§2).

### 6.2 `GET /api/assets/{assetId}`

`200 OK` — a single asset object, identical in shape to one element of `assets` above.

`404 Not Found` — `assetId` is not one of the four §2 assets. `404` is reserved for that case alone; a known asset whose state is merely missing is `503`, not `404`.

`503 Service Unavailable` — `assetId` is one of the four §2 assets but no state has been published for it yet.

### 6.3 `GET /api/history`

| Parameter | Required | Format |
|-----------|----------|--------|
| `from` | yes | ISO-8601 instant |
| `to` | yes | ISO-8601 instant |
| `assetId` | no | one of the four §2 assets; omitted means all |

Returns one row per asset per hour that overlaps the requested period, ordered by `hourStart` ascending then `assetId` ascending. Counter values are the amount accrued **within that hour**, not running totals. Hours are aligned to `Europe/Vienna` local hours (§4.3) and reported as the UTC instant at which the local hour began.

`200 OK`

```json
{
  "from": "2026-08-13T06:00:00Z",
  "to": "2026-08-13T09:00:00Z",
  "rows": [
    {
      "assetId": "BALER",
      "hourStart": "2026-08-13T06:00:00Z",
      "engineHours": 1.0,
      "totalWorkingHours": 0.82,
      "transportHours": 0.11,
      "idleHours": 0.07,
      "loadedHours": 0.74,
      "highLoadHours": 0.51,
      "tempExcursionHours": 0.0,
      "vibrationAlertHours": 0.19
    }
  ]
}
```

`400 Bad Request` — `from` or `to` missing or unparseable, `from` not before `to`, or the range exceeds 7 days.

`404 Not Found` — `assetId` given but not one of the four §2 assets.

An empty `rows` array is a valid `200` response, not an error.

### 6.4 `GET /api/telemetry/latest`

The lightweight endpoint behind the live telemetry strip; intended to be polled every few seconds.

`200 OK`

```json
{
  "generatedAt": "2026-08-13T09:41:12Z",
  "assets": [
    {
      "assetId": "BALER",
      "liveCondition": "CAUTION",
      "telemetry": {
        "assetId": "BALER",
        "timestamp": "2026-07-31T01:15:00Z",
        "ptoEngaged": true,
        "groundSpeedKmh": 8.4,
        "loadFactor": 0.78,
        "temperatureC": 87.2,
        "vibrationLevel": "ELEVATED",
        "workingStatus": "WORKING"
      }
    }
  ]
}
```

`telemetry` is `null` only for an asset that has **never** reported in this run; that asset's `liveCondition` is `STALE`. An asset that reported and then fell silent is `STALE` too, but keeps its last reading, so the operator can see what it was doing when the signal stopped. All four assets are always present, ordered by `assetId` ascending.

This endpoint has no `503`: before any state is published it answers `200` with all four assets `STALE` and `telemetry` `null`, which is the honest live picture rather than an error.

---

## 7. Decision support provided to the farmer

The system supports exactly three decisions, each backed by named counters:

1. **Maintenance prioritisation** — what should be looked at first, and how urgent is it?
   Backed by: priority ranking (§5.4), status (§5.2), the flags and their reasons (§5.1), and the recommendation (§5.5).

2. **Short-term operational risk** — is it advisable to keep working this machine hard?
   Backed by: `liveCondition` (§5.3) for the current instant, and the rolling 24-hour flags (§5.1) for sustained recent load.

3. **Basic utilization awareness** — which machines are doing productive work versus mostly idling or only transporting?
   Backed by: `utilizationPercent` and `productiveSharePercent` (§4.5), and the `totalWorkingHours` / `transportHours` / `idleHours` split (§4.1).

All recommendations are derived from visible counters. The farmer can always see the underlying reason for every flag and every status.

---

## 8. Future work

Recorded, deliberately not in scope. Do not implement any of this without a SPEC change.

- **AI layer** — a local model (Ollama or equivalent) grounded in the live counters, driving a chat endpoint, a strategy card, insight cards, and a plain-language explanation of the live telemetry strip. Removed from scope entirely; no endpoint, no module dependency, no hard-constraint rules exist yet.
- **Scenario triggering** — an operator-triggered high-load scenario (`POST /api/scenario`) that forces an asset towards `CRITICAL` on demand. Removed; the §3.2 simulator must produce flag-worthy variation on its own.
- **Asset-specific productive-work definitions** — `groundSpeedKmh > 2` does not describe stationary PTO work such as a feed mixer mixing in the yard. §3.2 sidesteps this by driving `MIXER` at feed-alley speed. A per-asset definition of productive work would be more honest.
- **Separate `HIGH` vibration counter** — `vibrationAlertHours` weights `ELEVATED` and `HIGH` identically; only §5.3 distinguishes them, and only for the current instant.
- **Persistence across restarts** — lifetime counters and hourly history currently reset to §4.4 baselines on every start.
- **DST handling** — 23- and 25-hour local days are not treated specially in §4.3.
- **Weather and work-window integration** — urgency is currently expressed in engine hours, not against the next weather window.
- **Authentication and multi-farm support** — the API is unauthenticated and the fleet is fixed at four assets.

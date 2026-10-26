# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Document hierarchy — read this first

The ranking of this file, `docs/SPEC.md`, `docs/ARCHITECTURE.md` and `docs/GLOSSARY.md`, and the rules for resolving conflicts between them, are defined in `docs/SPEC.md` §0. Read it before acting; it is not restated here.

This file sits at rank 0 and owns working conventions only: coding style, build and run commands, repo status. `docs/SPEC.md` remains the source of truth for product rules, domain logic, API contracts and scope.

## Project context

Informatics student portfolio project for agriculture-tech job applications. The student must be able to explain every part of the codebase in an interview. Optimize for clarity and teachability, not cleverness — see `.cursorrules` for the full rule set. In short:

- Prefer simple, readable, whiteboard-explainable code over clever abstractions.
- Match existing package style (`com.mariolagger.*`, cased per `GLOSSARY.md` §1) and constructor injection.
- Don't add layers for "enterprise best practice" (extra interfaces, factories, event buses, DI beyond Spring's defaults).
- Don't add new languages, frameworks, brokers, or databases beyond what's already in use
- Make the smallest change that completes the requested task; don't implement anything listed under SPEC.md §8 Future work.
- If any requirement, edge case, or naming choice isn't fully pinned down by SPEC/ARCHITECTURE/GLOSSARY, ask multiple-choice clarifying questions before writing code — prefer more questions over assumptions.

## Repo status: backend and frontend both rewritten

The rewrite from the earlier "farm energy optimizer" portfolio project into the AgriFleet Analytics system is done on the backend. All three modules implement their `docs/SPEC.md` behaviour end to end: the simulator generates telemetry, `TelemetryProcessor` accumulates the counters and hourly buckets and evaluates flags, status, live condition and ranking, the SQL schema exists and is applied by docker, and all four REST endpoints are implemented. The system runs: start the infra, then the three modules, and the API answers with a ranked fleet.

`frontend/` is the rewrite of the old solar GUI against `/api/*`, built around the component names in `GLOSSARY.md` §8. The old `energy-flow-gui.*` and `/energy/*` files are deleted; only the design system survived, and it survived deliberately — see **Frontend design system** below before touching CSS or markup.

What is *not* done:

- **Per-service unit tests.** The coding-style section below mandates JUnit 5 + Mockito classes per service and consumer, and four of them exist: `CounterAccumulationServiceTest`, `AssetAssessmentServiceTest` and `AssetStatePublisherTest` in `TelemetryProcessor`, and `AssetViewServiceTest` in `OperatorApi`. Still uncovered: `FlagEvaluationService`, `FleetRankingService` and `TelemetryConsumer` in `TelemetryProcessor`, `HistoryService` in `OperatorApi`, and every `Simulator` service. Keep the existing tests and the three `contextLoads()` smoke tests green.

The system is three modules, not four. `FleetDataService` and `FleetRuleEngine` were merged into a single consumer, `TelemetryProcessor`, because `SPEC.md` §4.3 derives the rolling window from the same hourly buckets as the historical record — see `ARCHITECTURE.md` §2. Both old names are gone; don't reintroduce them.

## Coding style (established, follow it)

Derived from the surviving scaffolding — match it for any new code:

- **Plain Java, no Lombok, no SLF4J.** DTOs and JPA entities are hand-written POJOs with explicit getters/setters and a no-arg constructor; logging is `System.out.println` / `System.err.println`, not a logging framework.
- **Constructor injection only** — no field injection, no `@Autowired` on fields.
- **Package-by-layer within each module**: `controller/`, `dto/`, `entity/`, `repository/`, `service/business/` (domain logic), `service/messaging/` (RabbitMQ producers/consumers), `scheduler/` (`@Scheduled` jobs). Keep new code in the matching package.
- **JPA entities**: explicit `@Entity`/`@Table(name = ...)`/`@Column(name = ...)` mappings, written to match a schema the application never generates (`ARCHITECTURE.md` §4 owns where that schema comes from). A new column means editing the SQL by hand as well as the entity.
- **REST error handling**: throw `ResponseStatusException` with an `HttpStatus` and message directly from the service layer; no `@ControllerAdvice`.
- **Verbose, self-explanatory names** over abbreviations, even for locals (e.g. `totalWorkingHours`, not `workHrs`) — the point is a reviewer/interviewer can read the code without extra context. Field and counter names come from `docs/GLOSSARY.md`; don't invent variants.
- **RabbitMQ wiring**: each module declares the beans its own role needs (see `ARCHITECTURE.md` §3) in its `*Application.java`. Idempotent re-declaration by both modules is expected, not a bug to fix.
- **Timezone**: farm-local logic is pinned to `Europe/Vienna` via a `private static final ZoneId FARM_ZONE = ZoneId.of("Europe/Vienna");` on the class that needs it. Keep new time-based logic consistent with that.
- **Tests**: JUnit 5 + Mockito (`@ExtendWith(MockitoExtension.class)`, `@Mock`, `ArgumentCaptor`), one test class per service/consumer, plain `assertEquals`/`assertTrue`. Every module also keeps a trivial `@SpringBootTest` `contextLoads()` smoke test.
- **Comments are rare**; when present they cite the SPEC section they encode (e.g. `// SPEC §4.2`) rather than explaining what the code does.

## Frontend design system (carried over deliberately — do not restyle)

The visual language in `frontend/css/app.css` was carried over from the previous portfolio project's GUI and is a hard constraint: the domain changed, the aesthetic did not. New markup composes the existing tokens and classes; it does not introduce colours, fonts, radii or shadows of its own. If something needs a colour that isn't already a variable, that is a sign the component is wrong, not that the palette is short.

**The feel.** Quiet, dense, editorial — closer to a well-set instrument panel than to a consumer dashboard. Everything is small, tightly spaced and low-contrast until it needs attention; colour is a signal, not decoration. Nothing pulses, bounces or gradients for its own sake.

**Fonts.** `--font` is `"Inter"` with an `-apple-system` / `Segoe UI` / `system-ui` fallback chain, and `--mono` is `"SF Mono"` / `"Fira Code"` / `ui-monospace`. Neither is fetched: there is no webfont `<link>` and no font file in the repo, so the browser uses a locally installed Inter or falls through to the system UI face. Keep it that way — a CDN font would be the only network dependency on the page. Mono is reserved for numerals inside the diagram; everywhere else numerals use `font-variant-numeric: tabular-nums` on the sans face so columns of hours line up.

**Icon pack.** Tabler Icons 3.31.0, outline set only — 24×24 viewBox, `stroke-width: 2`, round caps and joins, `fill: none`. The icons are inlined as raw path-data arrays in `frontend/js/icons.js`; there is no icon font, no sprite sheet, no CDN and no build step. Markup requests one with `data-tabler-icon="name"` (plus optional `data-tabler-size` / `-stroke`) and `initTablerIcons()` mounts it, in the SVG namespace when the host element is inside an `<svg>`. To add an icon, copy the `d` values out of the official outline SVG, skipping its transparent `M0 0h24v24H0z` background path — never hand-draw or trace path data.

**Palette.** A warm stone base (`--bg` off-white, `--surface` near-white) under a warm near-black three-step text ramp, with a restrained indigo `--accent` used only for primary actions and focus rings. Status is a muted trio: deep teal, warm ochre, controlled deep red, each with a `-soft` translucent companion for backgrounds, plus a neutral grey for "no signal". Per-asset identity colours exist for icon chips only and must never be used to convey status — status colour and identity colour are two different channels and mixing them makes the screen unreadable.

**Type scale.** Small and dense: body text 11.5–13.5px, section labels 10–11px uppercase with `0.05–0.07em` letter-spacing, headline numerals 15–17px with *negative* letter-spacing. Weights sit on the variable-font axis (480, 530, 560, 580, 620) rather than the usual 400/700 — the in-between weights are what stop the dense layout looking heavy.

**Depth and shape.** Shadows are warm-tinted, multi-layered and barely there (`--shadow-sm` / `--shadow` / `--shadow-lg`); radii are 14 / 10 / 6px (`--radius` / `-sm` / `-xs`). A fixed, almost imperceptible radial-gradient wash sits behind everything via `body::before`.

**Layout.** A max-width `.app` column, a `.card` > `.card-header` > `.card-title` pattern for every panel, and a primary breakpoint at 960px where the main row becomes a 3fr/2fr grid and the detail row a three-column grid. Below that everything stacks. Three narrower steps exist for components that need them — 640px and 480px for the metric and history forms, 1100px for a wide-screen refinement — but 960px is the default: reach for another one only when a component genuinely breaks at it. Transitions are 0.15–0.2s ease on colour, shadow and border only.

**Frontend code conventions.** Plain HTML, CSS and vanilla JS with no framework, no bundler, no package manager and no dependencies — scripts are ordinary `<script>` tags loaded in dependency order, communicating through globals, exactly as `icons.js` already does. One file per screen component, named after it. Values from the API are escaped before being interpolated into markup, and a missing or `null` value renders as an em dash, never as `0`.

## Architecture

Module layout, ports, messaging, and persistence are documented in `docs/ARCHITECTURE.md` §2–§5 — that is the single source of truth for structure; don't restate it here.

Notes not covered there:

- The old `energy_amount`/`battery_state`/`battery_command`/`controller_command` queues from the previous domain are gone — no battery concept exists in the new SPEC.
- **Queue wiring.** Each module declares the beans its own role needs, in its `*Application.java`. What those beans are is `ARCHITECTURE.md` §3.
- **Mind the `/api` prefix.** Controllers map the full `/api/...` paths from `SPEC.md` §6 verbatim, and no module sets a servlet context path — adding one would turn `@RequestMapping("/api/assets")` into `/api/api/assets`. Why the prefix arrives unstripped is `ARCHITECTURE.md` §5.

## Common commands

Infra (Postgres + RabbitMQ + nginx/frontend), from `docker/`:
```
docker compose up -d
docker compose down
docker compose down -v      # also drops the database-data volume
```

**The schema only loads into an empty volume.** Postgres applies the init script (`ARCHITECTURE.md` §4) only when it initialises a fresh data directory, and the `database-data` volume outlives a plain `docker compose down`. So any change to the schema file — and the first run on a machine whose volume predates it — needs `docker compose down -v` before `up -d`, or the old schema silently stays in place.

Each Java module is built/run independently. From a module directory (e.g. `OperatorApi/`):
```
./mvnw spring-boot:run                    # run
./mvnw spring-boot:run -Pdev               # run with low-RAM dev JVM args + "dev" profile
./mvnw test                                # run this module's tests
./mvnw test -Dtest=ClassName               # run a single test class
./mvnw test -Dtest=ClassName#methodName    # run a single test method
```
On Windows use `mvnw.cmd` instead of `./mvnw`. From the repo root, `mvn compile`/`mvn test` builds the whole reactor (all three modules).

Modules with a datasource (`TelemetryProcessor`, `OperatorApi`) need Postgres reachable at `localhost:5432` for their `@SpringBootTest` context-load tests to pass — start the Docker infra first, or that test will fail with a Hibernate dialect error (this is expected, not a bug). `TelemetryProcessor` additionally needs RabbitMQ up, since its listener container starts with the context.

The length of the simulator's startup burst (`SPEC.md` §3.2) is `simulator.backfill.hours` in `Simulator`'s `application.properties`; `0` disables the burst entirely, which is what the module's own smoke test does. Shortening it is the quickest way to watch flags appear during a session rather than arriving already set.

`application-dev.properties` (used by the `-Pdev` Maven profile) sets lazy init for low-RAM local runs. Only `OperatorApi` also caps the Tomcat thread pool — `Simulator` and `TelemetryProcessor` run with `spring.main.web-application-type=none` and have no web server to tune.

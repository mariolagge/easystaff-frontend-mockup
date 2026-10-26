# docs\GLOSSARY.md

Governed by `SPEC.md` §0 (document hierarchy, anti-duplication, change protocol). This document owns **naming only**: which identifiers exist and what they are called. Conditions, thresholds and behaviour live in `SPEC.md`; structure lives in `ARCHITECTURE.md`. The one-line meanings below are non-normative glosses — where a gloss and a rule appear to disagree, the rule wins.

---

## 1. Naming conventions

| Kind | Convention | Example |
|------|------------|---------|
| Enum values (JSON and Java) | `UPPER_SNAKE_CASE` | `HIGH_CUMULATIVE_LOAD` |
| JSON fields and Java fields | `camelCase` | `vibrationAlertHours` |
| Java types | `PascalCase` | `TelemetryProcessorApplication` |
| Database columns | `snake_case` | `vibration_alert_hours` |
| Java packages | all lowercase, words concatenated, no underscores | `com.mariolagger.telemetryprocessor` |

Enum values are never localised or prettified in the API; display text is the frontend's job, using the display names below. Table names are in `ARCHITECTURE.md` §4.

A module's name is `PascalCase` and is carried by its Maven `artifactId` and `<name>`; the modules are listed in `ARCHITECTURE.md` §2. Its package and its directory are that name lowercased, words concatenated, so `TelemetryProcessor` lives in the `telemetryprocessor/` directory under the package `com.mariolagger.telemetryprocessor`. The package segment is lowercased because a package name that looks like a type name runs into the JLS §6.4.2 obscuring rules; the directory follows it so that one lowercase spelling works on a case-sensitive filesystem. `frontend/` is a static asset directory rather than a module and is lowercase for the same reason.

---

## 2. Assets

Rules: `SPEC.md` §2.

**Asset** — one of the four monitored machines. `assetId` carries the value.

| Value | Display name |
|-------|--------------|
| `TRACTOR` | Tractor |
| `MOWER` | Mower |
| `BALER` | Baler |
| `MIXER` | Feed mixer |

---

## 3. Telemetry

Rules: `SPEC.md` §3.

| Field | Gloss |
|-------|-------|
| `assetId` | Which machine the reading came from. |
| `timestamp` | When the reading was taken. |
| `ptoEngaged` | Whether the power take-off is engaged. |
| `groundSpeedKmh` | Ground speed in kilometres per hour. |
| `loadFactor` | Current load as a fraction of capacity. |
| `temperatureC` | Operating temperature in degrees Celsius. |
| `vibrationLevel` | Vibration state of the machine. |
| `workingStatus` | Operating mode the simulator reports. |

### `workingStatus`

| Value | Display name | Gloss |
|-------|--------------|-------|
| `WORKING` | Working | Doing productive field work. |
| `TRANSPORT` | Transport | Moving between locations. |
| `IDLE` | Idle | Powered on but neither working nor travelling. |

### `vibrationLevel`

| Value | Display name |
|-------|--------------|
| `NORMAL` | Normal |
| `ELEVATED` | Elevated |
| `HIGH` | High |

---

## 4. Counters

Rules: `SPEC.md` §4.

All counters are named `…Hours` and hold hours as a decimal number.

| Counter | Gloss |
|---------|-------|
| `engineHours` | Time the machine was switched on and reporting. |
| `totalWorkingHours` | Time spent in productive work. |
| `transportHours` | Time spent travelling rather than working. |
| `idleHours` | Time powered on without working or travelling. |
| `loadedHours` | Working time under meaningful load. |
| `highLoadHours` | Working time under heavy load. |
| `tempExcursionHours` | Time above the temperature limit. |
| `vibrationAlertHours` | Time at elevated **or** high vibration. The name says "alert", not "elevated", because both levels count. |

### Counter scopes

| Scope | JSON container | Gloss |
|-------|----------------|-------|
| Lifetime | `lifetimeCounters` | Seeded service history plus everything since startup. |
| Rolling 24 h | `rolling24hCounters` | The recent window. |

Counter names are identical in both scopes; the container distinguishes them. In prose, write `highLoadHours` (24 h) or `loadedHours` (lifetime).

### Derived figures

| Name | Gloss |
|------|-------|
| `windowCoverageHours` | How much time the rolling window actually covers. |
| `utilizationPercent` | Share of the recent window spent working. |
| `productiveSharePercent` | Share of running time that was productive. |

---

## 5. Flags

Rules: `SPEC.md` §5.1.

| Flag | Display name | Gloss |
|------|--------------|-------|
| `HEAVY_RECENT_USE` | Heavy recent use | Sustained heavy load in the recent window. |
| `THERMAL_LOAD` | Thermal load | Repeated or prolonged overheating. |
| `MECHANICAL_ATTENTION` | Mechanical attention | Sustained abnormal vibration. |
| `HIGH_CUMULATIVE_LOAD` | High cumulative load | A long working life under load. |

### Severity

| Value | Display name |
|-------|--------------|
| `MODERATE` | Moderate |
| `SEVERE` | Severe |

A flag that is not active is absent from the response; there is no `INACTIVE` value.

### Flag reason fields

| Field | Gloss |
|-------|-------|
| `flag` | Which flag. |
| `severity` | How severe it currently is. |
| `counter` | The counter that triggered it. |
| `scope` | `LIFETIME` or `ROLLING_24H`. |
| `value` | The counter's value at evaluation time. |
| `threshold` | The threshold that value crossed. |

---

## 6. Status, live condition and ranking

Rules: `SPEC.md` §5.2–§5.5.

### `status`

| Value | Display name | Gloss |
|-------|--------------|-------|
| `GOOD` | Good | No active flag. |
| `WATCH` | Watch | Worth planning an inspection. |
| `CRITICAL` | Critical | Should be looked at first. |

### `liveCondition`

Derived from the latest message only, and deliberately kept separate from `status`.

| Value | Display name | Gloss |
|-------|--------------|-------|
| `NORMAL` | Normal | Nothing unusual in the latest reading. |
| `CAUTION` | Caution | The latest reading is outside comfortable operating range. |
| `ALERT` | Alert | The latest reading indicates immediate strain. |
| `STALE` | No signal | Nothing received recently from this asset. |

### Other fields

| Field | Gloss |
|-------|-------|
| `priorityRank` | 1-based position in the maintenance ranking; 1 is most urgent. |
| `recommendation` | The service sentence shown to the farmer. |

---

## 7. API

Rules: `SPEC.md` §6. Structure: `ARCHITECTURE.md` §6.

| Endpoint | Gloss |
|----------|-------|
| `GET /api/assets` | The whole fleet, ranked. |
| `GET /api/assets/{assetId}` | One machine in detail. |
| `GET /api/history` | Hourly aggregates over a period. |
| `GET /api/telemetry/latest` | The newest reading per machine. |

| Response field | Gloss |
|----------------|-------|
| `generatedAt` | When the response was assembled. |
| `assets` | The per-asset array. |
| `rows` | The per-asset, per-hour array returned by `GET /api/history`. |
| `hourStart` | The instant an aggregated hour began. |
| `telemetry` | An embedded telemetry message (§3). |

---

## 8. Frontend components

| Name | Gloss |
|------|-------|
| **Fleet ranking** | The ordered list of all four assets with status and flags. |
| **Asset detail** | The single-machine view with counters and flag reasons. |
| **Live telemetry strip** | The polled row of current readings per asset. |
| **Hourly history** | The hourly-aggregate table over a chosen period. |

Names retired with the AI layer (`SPEC.md` §8): *AI Strategy card*, *AI Insights cards*, *Native chat*, *Telemetry-strip explanation*. Do not reintroduce them without a SPEC change.

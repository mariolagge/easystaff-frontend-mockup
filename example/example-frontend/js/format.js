// Display text and value formatting. The API returns raw enum values; every display
// name below comes from GLOSSARY.md (§2 assets, §3 telemetry, §5 flags, §6 status and
// live condition). Nothing here derives a product rule — it only renames and formats.

const ASSET_DISPLAY_NAMES = {
  TRACTOR: 'Tractor',
  MOWER: 'Mower',
  BALER: 'Baler',
  MIXER: 'Feed mixer',
};

const ASSET_ICONS = {
  TRACTOR: 'tractor',
  MOWER: 'blade',
  BALER: 'barrel',
  MIXER: 'blender',
};

const STATUS_DISPLAY_NAMES = {
  GOOD: 'Good',
  WATCH: 'Watch',
  CRITICAL: 'Critical',
};

const STATUS_ICONS = {
  GOOD: 'circle-check',
  WATCH: 'alert-triangle',
  CRITICAL: 'alert-octagon',
};

const LIVE_CONDITION_DISPLAY_NAMES = {
  NORMAL: 'Normal',
  CAUTION: 'Caution',
  ALERT: 'Alert',
  STALE: 'No signal',
};

const FLAG_DISPLAY_NAMES = {
  HEAVY_RECENT_USE: 'Heavy recent use',
  THERMAL_LOAD: 'Thermal load',
  MECHANICAL_ATTENTION: 'Mechanical attention',
  HIGH_CUMULATIVE_LOAD: 'High cumulative load',
};

const FLAG_ICONS = {
  HEAVY_RECENT_USE: 'weight',
  THERMAL_LOAD: 'flame',
  MECHANICAL_ATTENTION: 'activity',
  HIGH_CUMULATIVE_LOAD: 'hourglass',
};

const SEVERITY_DISPLAY_NAMES = {
  MODERATE: 'Moderate',
  SEVERE: 'Severe',
};

const SCOPE_DISPLAY_NAMES = {
  LIFETIME: 'lifetime',
  ROLLING_24H: '24 h',
};

const COUNTER_DISPLAY_NAMES = {
  engineHours: 'Engine',
  totalWorkingHours: 'Working',
  transportHours: 'Transport',
  idleHours: 'Idle',
  loadedHours: 'Loaded',
  highLoadHours: 'High load',
  tempExcursionHours: 'Temp excursion',
  vibrationAlertHours: 'Vibration alert',
};

// Fixed order for the counter panels, matching SPEC.md §4.1.
const COUNTER_ORDER = [
  'engineHours',
  'totalWorkingHours',
  'transportHours',
  'idleHours',
  'loadedHours',
  'highLoadHours',
  'tempExcursionHours',
  'vibrationAlertHours',
];

const WORKING_STATUS_DISPLAY_NAMES = {
  WORKING: 'Working',
  TRANSPORT: 'Transport',
  IDLE: 'Idle',
};

const VIBRATION_LEVEL_DISPLAY_NAMES = {
  NORMAL: 'Normal',
  ELEVATED: 'Elevated',
  HIGH: 'High',
};

const EM_DASH = '—';

function assetDisplayName(assetId) {
  return ASSET_DISPLAY_NAMES[assetId] || assetId || EM_DASH;
}

function assetIcon(assetId) {
  return ASSET_ICONS[assetId] || 'tool';
}

function statusDisplayName(status) {
  return STATUS_DISPLAY_NAMES[status] || EM_DASH;
}

function statusIcon(status) {
  return STATUS_ICONS[status] || 'circle-check';
}

// Maps a status onto the CSS modifier that carries its colour.
function statusClass(status) {
  if (status === 'GOOD' || status === 'WATCH' || status === 'CRITICAL') {
    return `status-${status.toLowerCase()}`;
  }
  return '';
}

function liveConditionDisplayName(liveCondition) {
  return LIVE_CONDITION_DISPLAY_NAMES[liveCondition] || EM_DASH;
}

function liveConditionClass(liveCondition) {
  if (!liveCondition) {
    return 'live-stale';
  }
  return `live-${liveCondition.toLowerCase()}`;
}

function flagDisplayName(flag) {
  return FLAG_DISPLAY_NAMES[flag] || flag || EM_DASH;
}

function flagIcon(flag) {
  return FLAG_ICONS[flag] || 'alert-triangle';
}

function severityDisplayName(severity) {
  return SEVERITY_DISPLAY_NAMES[severity] || EM_DASH;
}

function severityClass(severity) {
  if (severity === 'MODERATE' || severity === 'SEVERE') {
    return `severity-${severity.toLowerCase()}`;
  }
  return '';
}

function scopeDisplayName(scope) {
  return SCOPE_DISPLAY_NAMES[scope] || scope || EM_DASH;
}

function counterDisplayName(counter) {
  return COUNTER_DISPLAY_NAMES[counter] || counter || EM_DASH;
}

function workingStatusDisplayName(workingStatus) {
  return WORKING_STATUS_DISPLAY_NAMES[workingStatus] || EM_DASH;
}

function vibrationLevelDisplayName(vibrationLevel) {
  return VIBRATION_LEVEL_DISPLAY_NAMES[vibrationLevel] || EM_DASH;
}

// A missing value is an em dash, never a zero: SPEC.md §4.5 publishes null percentages
// for assets that have not reported, and rendering those as 0 would be a lie.
function formatNumber(value, fractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return EM_DASH;
  }
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatHours(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return EM_DASH;
  }
  return `${formatNumber(value, 2)} h`;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return EM_DASH;
  }
  return `${formatNumber(value, 1)} %`;
}

// The API speaks UTC instants (SPEC.md §6); the farmer reads farm-local time. That is the
// farm's zone, not the browser's — SPEC.md §4.3 aligns the hourly buckets to Europe/Vienna,
// so on a machine set to any other zone the hourStart column would stop landing on :00.
const FARM_ZONE = 'Europe/Vienna';

function formatInstant(value) {
  if (!value) {
    return EM_DASH;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EM_DASH;
  }
  return date.toLocaleString(undefined, {
    timeZone: FARM_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeOfDay(value) {
  if (!value) {
    return EM_DASH;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EM_DASH;
  }
  return date.toLocaleTimeString(undefined, {
    timeZone: FARM_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatBoolean(value) {
  if (value === null || value === undefined) {
    return EM_DASH;
  }
  return value ? 'Yes' : 'No';
}

function escapeHtml(text) {
  const element = document.createElement('div');
  element.textContent = text ?? '';
  return element.innerHTML;
}

// Small display fragments shared by the fleet ranking, the asset detail and the
// telemetry strip. Status and live condition stay in separate elements on purpose —
// SPEC.md §5.3 keeps them apart.

function statusPillHtml(status) {
  return `<span class="status-pill ${statusClass(status)}">`
    + `${tablerIcon(statusIcon(status), { size: 11 })}${escapeHtml(statusDisplayName(status))}</span>`;
}

function liveConditionHtml(liveCondition) {
  return `<span class="live-condition"><span class="live-dot ${liveConditionClass(liveCondition)}"></span>`
    + `${escapeHtml(liveConditionDisplayName(liveCondition))}</span>`;
}

function assetChipHtml(assetId) {
  const tone = String(assetId || '').toLowerCase();
  return `<span class="asset-chip asset-chip-${escapeHtml(tone)}">`
    + `${tablerIcon(assetIcon(assetId), { size: 24, stroke: 'var(--on-color)' })}</span>`;
}

function flagChipsHtml(flags) {
  if (!Array.isArray(flags) || flags.length === 0) {
    return '<span class="flag-chips-empty">No active flags</span>';
  }
  const chips = flags.map((flag) => `<span class="flag-chip ${severityClass(flag.severity)}">`
    + `${tablerIcon(flagIcon(flag.flag), { size: 11 })}${escapeHtml(flagDisplayName(flag.flag))}</span>`);
  return `<span class="flag-chips">${chips.join('')}</span>`;
}

// How far the farm's wall clock runs ahead of UTC at this instant. Reading both zones
// through the same formatter keeps this to two lines and no offset table.
function farmZoneOffsetMs(instant) {
  const farmWallClock = new Date(instant.toLocaleString('en-US', { timeZone: FARM_ZONE }));
  const utcWallClock = new Date(instant.toLocaleString('en-US', { timeZone: 'UTC' }));
  return farmWallClock.getTime() - utcWallClock.getTime();
}

// The value a <input type="datetime-local"> wants, as the farm's wall clock rather than
// the browser's — the period the farmer picks must mean the same thing as the hours the
// table shows back.
function toDatetimeLocalValue(date) {
  const parts = {};
  new Intl.DateTimeFormat('en-CA', {
    timeZone: FARM_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).forEach((part) => {
    parts[part.type] = part.value;
  });
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

// The UTC ISO-8601 instant the API wants, from a farm-local datetime-local value. The
// offset is read once, at the naive instant: a period that straddles a DST transition is
// off by an hour, which SPEC.md §8 puts out of scope.
function toUtcInstant(localValue) {
  if (!localValue) {
    return '';
  }
  const asIfUtc = new Date(`${localValue}:00Z`);
  if (Number.isNaN(asIfUtc.getTime())) {
    return '';
  }
  return new Date(asIfUtc.getTime() - farmZoneOffsetMs(asIfUtc)).toISOString();
}

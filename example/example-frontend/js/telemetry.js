// Live telemetry strip: the newest reading per machine, from GET /api/telemetry/latest.
// All four machines are always listed; one that has not reported carries a null
// telemetry object and the STALE live condition (SPEC.md §6.4).

function telemetryReadingHtml(label, value) {
  return `<span><span class="telemetry-reading-label">${escapeHtml(label)}</span> ${escapeHtml(value)}</span>`;
}

function telemetryReadingsHtml(telemetry) {
  if (!telemetry) {
    return `<div class="telemetry-readings">${telemetryReadingHtml('No reading in this run', '')}</div>`;
  }

  return `
    <div class="telemetry-readings">
      ${telemetryReadingHtml('Mode', workingStatusDisplayName(telemetry.workingStatus))}
      ${telemetryReadingHtml('PTO', formatBoolean(telemetry.ptoEngaged))}
      ${telemetryReadingHtml('Speed', `${formatNumber(telemetry.groundSpeedKmh, 1)} km/h`)}
      ${telemetryReadingHtml('Load', formatNumber(telemetry.loadFactor, 2))}
      ${telemetryReadingHtml('Temp', `${formatNumber(telemetry.temperatureC, 1)} °C`)}
      ${telemetryReadingHtml('Vibration', vibrationLevelDisplayName(telemetry.vibrationLevel))}
      ${telemetryReadingHtml('At', formatTimeOfDay(telemetry.timestamp))}
    </div>`;
}

function telemetryRowHtml(entry) {
  return `
    <div class="telemetry-row">
      ${assetChipHtml(entry.assetId)}
      <div class="telemetry-info">
        <div class="telemetry-name-row">
          <span class="telemetry-name">${escapeHtml(assetDisplayName(entry.assetId))}</span>
          ${liveConditionHtml(entry.liveCondition)}
        </div>
        ${telemetryReadingsHtml(entry.telemetry)}
      </div>
    </div>`;
}

function renderTelemetryStrip(entries) {
  document.getElementById('telemetry-strip').innerHTML = entries.map(telemetryRowHtml).join('');
}

function showTelemetryStripError(message) {
  document.getElementById('telemetry-strip').innerHTML =
    `<div class="section-loading">${escapeHtml(message)}</div>`;
}

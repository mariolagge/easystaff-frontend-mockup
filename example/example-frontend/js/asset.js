// Asset detail for the selected machine, plus the two counter cards below it.
// Every flag is shown with the counter, scope, value and threshold behind it, because
// the farmer must always be able to see why a machine is flagged (SPEC.md §7).

function flagReasonHtml(flag) {
  return `
    <div class="flag-reason">
      <div class="flag-reason-head">
        <span class="flag-reason-name">${escapeHtml(flagDisplayName(flag.flag))}</span>
        <span class="flag-chip ${severityClass(flag.severity)}">${escapeHtml(severityDisplayName(flag.severity))}</span>
      </div>
      <div class="flag-reason-evidence">
        ${escapeHtml(counterDisplayName(flag.counter))}
        <span class="flag-reason-scope">(${escapeHtml(scopeDisplayName(flag.scope))})</span>
        ${escapeHtml(formatHours(flag.value))} of ${escapeHtml(formatHours(flag.threshold))}
      </div>
    </div>`;
}

function flagReasonsHtml(flags) {
  if (!Array.isArray(flags) || flags.length === 0) {
    return '<div class="detail-empty">No active flags.</div>';
  }
  return `<div class="flag-reason-list">${flags.map(flagReasonHtml).join('')}</div>`;
}

function renderAssetDetail(asset) {
  const container = document.getElementById('asset-detail');

  if (!asset) {
    container.innerHTML = '<div class="detail-empty">Select a machine in the fleet ranking.</div>';
    return;
  }

  container.innerHTML = `
    <div class="detail-head">
      ${assetChipHtml(asset.assetId)}
      <span class="detail-name">${escapeHtml(assetDisplayName(asset.assetId))}</span>
      ${statusPillHtml(asset.status)}
    </div>

    <div class="detail-recommendation">${escapeHtml(asset.recommendation || EM_DASH)}</div>

    <dl class="data-list">
      <div class="data-row">
        <dt>Priority rank</dt>
        <dd>${escapeHtml(String(asset.priorityRank ?? EM_DASH))}</dd>
      </div>
      <div class="data-row">
        <dt>Live condition</dt>
        <dd>${liveConditionHtml(asset.liveCondition)}</dd>
      </div>
      <div class="data-row">
        <dt>Utilization</dt>
        <dd>${escapeHtml(formatPercent(asset.utilizationPercent))}</dd>
      </div>
      <div class="data-row">
        <dt>Productive share</dt>
        <dd>${escapeHtml(formatPercent(asset.productiveSharePercent))}</dd>
      </div>
      <div class="data-row">
        <dt>Window coverage</dt>
        <dd>${escapeHtml(formatHours(asset.windowCoverageHours))}</dd>
      </div>
    </dl>

    <div class="section-label section-label-spaced">Why it is flagged</div>
    ${flagReasonsHtml(asset.flags)}`;
}

function counterListHtml(counters) {
  return COUNTER_ORDER.map((counter) => `
    <div class="data-row">
      <dt>${escapeHtml(counterDisplayName(counter))}</dt>
      <dd>${escapeHtml(formatHours(counters ? counters[counter] : null))}</dd>
    </div>`).join('');
}

function renderCounterCards(asset) {
  const rolling = document.getElementById('rolling-counters');
  const lifetime = document.getElementById('lifetime-counters');
  const rollingAsset = document.getElementById('rolling-counters-asset');
  const lifetimeAsset = document.getElementById('lifetime-counters-asset');

  if (!asset) {
    rolling.innerHTML = '<div class="section-loading">No machine selected.</div>';
    lifetime.innerHTML = '<div class="section-loading">No machine selected.</div>';
    rollingAsset.textContent = EM_DASH;
    lifetimeAsset.textContent = EM_DASH;
    return;
  }

  rollingAsset.textContent = assetDisplayName(asset.assetId);
  lifetimeAsset.textContent = assetDisplayName(asset.assetId);
  rolling.innerHTML = counterListHtml(asset.rolling24hCounters);
  lifetime.innerHTML = counterListHtml(asset.lifetimeCounters);
}

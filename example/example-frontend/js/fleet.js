// Fleet ranking: the SVG diagram, the ranked list under it, and the fleet metric strip.
// The assets array is rendered in the order the API returned it — that order IS the
// priority ranking (SPEC.md §5.4), so it is never re-sorted here.

const NODE_STATUS_CLASSES = ['status-good', 'status-watch', 'status-critical'];
const NODE_LIVE_CLASSES = ['live-normal', 'live-caution', 'live-alert', 'live-stale'];

// The diagram loop runs over the four static node groups, not over the response, so a
// machine the response does not mention is reset instead of keeping its previous values.
function renderFleetDiagram(assets, selectedAssetId) {
  document.querySelectorAll('#fleet-svg .node-group').forEach((node) => {
    const asset = assets.find((candidate) => candidate.assetId === node.dataset.assetId);

    NODE_STATUS_CLASSES.forEach((cls) => node.classList.remove(cls));
    NODE_LIVE_CLASSES.forEach((cls) => node.classList.remove(cls));
    node.classList.toggle('is-selected', Boolean(asset) && asset.assetId === selectedAssetId);

    if (!asset) {
      node.querySelector('.node-status').textContent = EM_DASH;
      node.querySelector('.node-value').textContent = EM_DASH;
      node.querySelector('.node-rank').textContent = EM_DASH;
      return;
    }

    // statusClass() returns '' for an unknown status, and classList.add('') throws.
    const nodeStatusClass = statusClass(asset.status);
    if (nodeStatusClass) {
      node.classList.add(nodeStatusClass);
    }
    const nodeLiveClass = liveConditionClass(asset.liveCondition);
    if (nodeLiveClass) {
      node.classList.add(nodeLiveClass);
    }

    node.querySelector('.node-status').textContent = statusDisplayName(asset.status).toUpperCase();
    node.querySelector('.node-value').textContent = asset.utilizationPercent === null
      || asset.utilizationPercent === undefined
      ? `${EM_DASH} util`
      : `${formatNumber(asset.utilizationPercent, 0)}% util`;
    node.querySelector('.node-rank').textContent = asset.priorityRank ?? EM_DASH;
  });
}

function rankRowHtml(asset, selectedAssetId) {
  const selected = asset.assetId === selectedAssetId ? ' is-selected' : '';
  return `
    <button type="button" class="rank-row${selected}" data-asset-id="${escapeHtml(asset.assetId)}">
      <span class="rank-badge ${statusClass(asset.status)}">${escapeHtml(String(asset.priorityRank ?? EM_DASH))}</span>
      ${assetChipHtml(asset.assetId)}
      <span class="rank-info">
        <span class="rank-name-row">
          <span class="rank-name">${escapeHtml(assetDisplayName(asset.assetId))}</span>
          ${statusPillHtml(asset.status)}
          ${liveConditionHtml(asset.liveCondition)}
        </span>
        ${flagChipsHtml(asset.flags)}
      </span>
      <span class="rank-chevron">${tablerIcon('chevron-right', { size: 14 })}</span>
    </button>`;
}

function renderFleetRanking(assets, selectedAssetId, onSelect) {
  const container = document.getElementById('fleet-ranking');
  container.innerHTML = assets.map((asset) => rankRowHtml(asset, selectedAssetId)).join('');
  container.querySelectorAll('.rank-row').forEach((row) => {
    row.addEventListener('click', () => onSelect(row.dataset.assetId));
  });
}

function setMetricValue(elementId, text) {
  const element = document.getElementById(elementId);
  const unit = element.querySelector('.metric-unit');
  element.textContent = text;
  if (unit) {
    element.appendChild(unit);
  }
}

function averageOf(values) {
  const known = values.filter((value) => value !== null && value !== undefined);
  if (known.length === 0) {
    return null;
  }
  const sum = known.reduce((total, value) => total + Number(value), 0);
  return sum / known.length;
}

function renderFleetMetrics(assets) {
  const mostUrgent = assets[0];
  setMetricValue('metric-urgent-name', mostUrgent ? assetDisplayName(mostUrgent.assetId) : EM_DASH);
  document.getElementById('metric-urgent-status').innerHTML = mostUrgent
    ? statusPillHtml(mostUrgent.status)
    : EM_DASH;
  setMetricValue('metric-urgent-flags', mostUrgent ? String((mostUrgent.flags || []).length) : EM_DASH);

  // An unknown fleet is not a fleet of zero criticals, so an empty response reads as em dash.
  const countOf = (status) => (assets.length === 0
    ? EM_DASH
    : String(assets.filter((asset) => asset.status === status).length));
  setMetricValue('metric-count-critical', countOf('CRITICAL'));
  setMetricValue('metric-count-watch', countOf('WATCH'));
  setMetricValue('metric-count-good', countOf('GOOD'));

  const averageUtilization = averageOf(assets.map((asset) => asset.utilizationPercent));
  const averageProductiveShare = averageOf(assets.map((asset) => asset.productiveSharePercent));
  setMetricValue('metric-avg-utilization', formatNumber(averageUtilization, 1));
  setMetricValue('metric-avg-productive', formatNumber(averageProductiveShare, 1));

  const reporting = assets.filter((asset) => asset.liveCondition !== 'STALE').length;
  setMetricValue('metric-reporting', assets.length === 0 ? EM_DASH : `${reporting}/${assets.length}`);
}

function renderFleet(assets, selectedAssetId, onSelect) {
  renderFleetMetrics(assets);
  renderFleetDiagram(assets, selectedAssetId);
  renderFleetRanking(assets, selectedAssetId, onSelect);
}

function showFleetRankingError(message) {
  document.getElementById('fleet-ranking').innerHTML =
    `<div class="section-loading">${escapeHtml(message)}</div>`;
}

// Clicking a machine in the diagram selects it, exactly like clicking its ranking row.
// The four node groups are static markup, so these handlers are attached once.
function initFleetDiagram(onSelect, describeAsset) {
  const tooltip = document.getElementById('tooltip');

  document.querySelectorAll('#fleet-svg .node-group').forEach((node) => {
    const assetId = node.dataset.assetId;
    node.addEventListener('click', () => onSelect(assetId));
    node.addEventListener('mouseenter', () => {
      tooltip.textContent = describeAsset(assetId);
      tooltip.classList.add('visible');
    });
    node.addEventListener('mousemove', (event) => {
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
    });
    node.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
  });
}

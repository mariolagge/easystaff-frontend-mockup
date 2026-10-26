// Entry point: holds the selected machine, polls the two live endpoints on one timer,
// and hands the responses to the components.

const REFRESH_INTERVAL_MS = 10_000;

let fleetAssets = [];
let selectedAssetId = null;

function selectedAsset() {
  return fleetAssets.find((asset) => asset.assetId === selectedAssetId) || null;
}

function renderSelection() {
  const asset = selectedAsset();
  renderAssetDetail(asset);
  renderCounterCards(asset);
}

function selectAsset(assetId) {
  selectedAssetId = assetId;
  renderFleet(fleetAssets, selectedAssetId, selectAsset);
  renderSelection();
}

// Tooltip text for a machine in the diagram.
function describeAsset(assetId) {
  const asset = fleetAssets.find((candidate) => candidate.assetId === assetId);
  if (!asset) {
    return assetDisplayName(assetId);
  }
  return `${assetDisplayName(assetId)} · ${statusDisplayName(asset.status)}`
    + ` · ${liveConditionDisplayName(asset.liveCondition)}`;
}

async function refreshFleet() {
  try {
    const response = await fetchFleet();
    fleetAssets = Array.isArray(response.assets) ? response.assets : [];

    // The first load selects the most urgent machine, so the detail panel is never empty.
    if (!selectedAsset()) {
      selectedAssetId = fleetAssets.length > 0 ? fleetAssets[0].assetId : null;
    }

    document.getElementById('generated-at').textContent = formatTimeOfDay(response.generatedAt);
    renderFleet(fleetAssets, selectedAssetId, selectAsset);
    renderSelection();
    return true;
  } catch (error) {
    fleetAssets = [];
    renderFleet([], null, selectAsset);
    showFleetRankingError('Could not load the fleet.');
    renderSelection();
    showAlert(`Could not load the fleet. ${error.message}. Check that OperatorApi is running behind the /api proxy.`);
    return false;
  }
}

async function refreshTelemetry() {
  try {
    const response = await fetchLatestTelemetry();
    renderTelemetryStrip(Array.isArray(response.assets) ? response.assets : []);
    return true;
  } catch (error) {
    showTelemetryStripError('Could not load live telemetry.');
    return false;
  }
}

async function refreshAll() {
  const [fleetLoaded, telemetryLoaded] = await Promise.all([refreshFleet(), refreshTelemetry()]);
  if (fleetLoaded && telemetryLoaded) {
    clearAlerts();
  }
}

initTablerIcons();
initFleetDiagram(selectAsset, describeAsset);
initHistory();
document.getElementById('refresh-btn').addEventListener('click', refreshAll);

refreshAll();
setInterval(refreshAll, REFRESH_INTERVAL_MS);

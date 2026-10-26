// Every call goes to a relative /api/* path. nginx serves this page and proxies /api/
// to OperatorApi on the same origin, so there is no base URL and no CORS to configure.

const API_BASE = '';

// Spring's default error body carries the useful text in "message" (SPEC.md §6).
async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (response.ok) {
    return response.json();
  }

  let message = `HTTP ${response.status}`;
  try {
    const body = await response.json();
    if (body && body.message) {
      message = body.message;
    }
  } catch (ignored) {
    // Not a JSON body — keep the status line.
  }
  throw new Error(message);
}

function fetchFleet() {
  return fetchJson('/api/assets');
}

function fetchLatestTelemetry() {
  return fetchJson('/api/telemetry/latest');
}

function fetchHistory(fromInstant, toInstant, assetId) {
  const params = new URLSearchParams({ from: fromInstant, to: toInstant });
  if (assetId) {
    params.set('assetId', assetId);
  }
  return fetchJson(`/api/history?${params}`);
}

// GET /api/assets/{assetId} (SPEC.md §6.2) is not called from this screen: it returns an
// object identical to one element of the fleet response, which the poll already holds.

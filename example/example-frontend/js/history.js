// Hourly history table. The period is validated by the API (SPEC.md §6.3) — a bad or
// too-long range comes back as 400 and its message is shown in the table itself.

const HISTORY_COLUMN_COUNT = 10;

function historyRowHtml(row) {
  const counterCells = COUNTER_ORDER
    .map((counter) => `<td>${escapeHtml(formatNumber(row[counter], 2))}</td>`)
    .join('');
  return `
    <tr>
      <td>${escapeHtml(assetDisplayName(row.assetId))}</td>
      <td>${escapeHtml(formatInstant(row.hourStart))}</td>
      ${counterCells}
    </tr>`;
}

function showHistoryMessage(message, className) {
  document.getElementById('history-body').innerHTML =
    `<tr><td colspan="${HISTORY_COLUMN_COUNT}" class="${className}">${escapeHtml(message)}</td></tr>`;
}

async function loadHistory() {
  const fromValue = document.getElementById('history-from').value;
  const toValue = document.getElementById('history-to').value;
  const assetId = document.getElementById('history-asset').value;

  showHistoryMessage('Loading hourly history…', 'history-empty');

  try {
    const response = await fetchHistory(toUtcInstant(fromValue), toUtcInstant(toValue), assetId);
    const rows = Array.isArray(response.rows) ? response.rows : [];

    if (rows.length === 0) {
      showHistoryMessage('No hourly data for this period.', 'history-empty');
      return;
    }

    document.getElementById('history-body').innerHTML = rows.map(historyRowHtml).join('');
  } catch (error) {
    showHistoryMessage(error.message, 'history-error');
  }
}

function initHistory() {
  const now = new Date();
  const dayEarlier = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  document.getElementById('history-from').value = toDatetimeLocalValue(dayEarlier);
  document.getElementById('history-to').value = toDatetimeLocalValue(now);

  document.getElementById('history-form').addEventListener('submit', (event) => {
    event.preventDefault();
    loadHistory();
  });
}

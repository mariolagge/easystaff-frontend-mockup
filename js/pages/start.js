// Screen 0: start page — disclaimer, the KPI line, Start / Reset, and the order status flow.

import { getState, subscribe, reset } from '../state.js';
import { initLayout } from '../layout.js';
import { escapeHtml, statusLabel } from '../format.js';
import { buildFlow, renderFlow } from '../flow.js';
import { KPI_TEXT, REPO_URL } from '../seed.js';

function renderProgress() {
  const state = getState();
  renderFlow(state);
  document.getElementById('progress-meta').textContent = state.status === 'briefed'
    ? 'Complete — briefings sent'
    : statusLabel(state.status);
}

initLayout('start');

document.getElementById('kpi-line').innerHTML = `
  <span>Calculated cycle time per order</span>
  <strong>${escapeHtml(KPI_TEXT.cycleTimeAsIs)} → ${escapeHtml(KPI_TEXT.cycleTimeToBe)}</strong>
  <span>(${escapeHtml(KPI_TEXT.cycleTimeChange)})</span>`;
document.getElementById('readme-link').href = REPO_URL;

document.getElementById('reset-btn').addEventListener('click', () => {
  reset();
  document.getElementById('reset-status').textContent = 'Demo reset. All screens are back to the start.';
});

buildFlow();
renderProgress();
subscribe(renderProgress);

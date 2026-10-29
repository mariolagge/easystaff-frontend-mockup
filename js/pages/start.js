// Screen 0: start page — disclaimer, the KPI line, Start / Reset, and the order status flow.

import { getState, subscribe, reset } from '../state.js';
import { initLayout } from '../layout.js';
import { escapeHtml, statusLabel } from '../format.js';
import { buildFlow, renderFlow } from '../flow.js';
import { REPO_URL } from '../seed.js';
import { t, onLangChange } from '../i18n.js';

function renderProgress() {
  const state = getState();
  renderFlow(state);
  document.getElementById('progress-meta').textContent = state.status === 'briefed'
    ? t('start.complete')
    : statusLabel(state.status);
}

// KPI text is copied from docs/data/kpis.json → rendered.<lang> (SPEC C7).
function renderKpi() {
  document.getElementById('kpi-line').innerHTML = `
    <span>${escapeHtml(t('start.kpiLabel'))}</span>
    <strong>${escapeHtml(t('kpi.cycleTimeAsIs'))} → ${escapeHtml(t('kpi.cycleTimeToBe'))}</strong>
    <span>(${escapeHtml(t('kpi.cycleTimeChange'))})</span>`;
}

initLayout('start');

renderKpi();
document.getElementById('readme-link').href = REPO_URL;

document.getElementById('reset-btn').addEventListener('click', () => {
  reset();
  document.getElementById('reset-status').textContent = t('start.resetDone');
});

buildFlow();
renderProgress();
subscribe(renderProgress);
onLangChange(() => {
  renderKpi();
  renderProgress();
});

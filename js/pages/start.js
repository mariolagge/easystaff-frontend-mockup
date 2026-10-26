// Screen 0: start page — disclaimer, the KPI line, Start / Reset, and the 4-step overview.

import { getState, subscribe, reset } from '../state.js';
import { initLayout } from '../layout.js';
import { escapeHtml, statusLabel } from '../format.js';
import { KPI_TEXT, REPO_URL } from '../seed.js';

// The four steps a viewer cares about, each "done" from a set of statuses on.
const STEPS = [
  {
    label: 'Request',
    doneIn: ['submitted', 'validated', 'availability_requested', 'responses_complete',
      'approval_requested', 'approved', 'booked', 'briefed', 'changes_requested'],
  },
  {
    label: 'Availability',
    doneIn: ['responses_complete', 'approval_requested', 'approved', 'booked', 'briefed', 'changes_requested'],
  },
  { label: 'Approval', doneIn: ['approved', 'booked', 'briefed'] },
  { label: 'Booked', doneIn: ['booked', 'briefed'] },
];

function renderProgress() {
  const { status } = getState();
  const currentIndex = STEPS.findIndex((step) => !step.doneIn.includes(status));

  document.getElementById('progress-steps').innerHTML = STEPS.map((step, index) => {
    const isDone = step.doneIn.includes(status);
    const isCurrent = index === currentIndex;
    let stateText = 'Open';
    if (isDone) {
      stateText = 'Done';
    } else if (isCurrent) {
      stateText = status ? `Now: ${statusLabel(status)}` : 'Next';
    }
    const cls = isDone ? ' is-done' : (isCurrent ? ' is-current' : '');
    return `
      <li class="progress-step${cls}"${isCurrent ? ' aria-current="step"' : ''}>
        <span class="progress-step-dot" aria-hidden="true">${isDone ? '✓' : index + 1}</span>
        <span class="progress-step-label">${escapeHtml(step.label)}</span>
        <span class="progress-step-state">${escapeHtml(stateText)}</span>
      </li>`;
  }).join('');

  document.getElementById('progress-meta').textContent = status === 'briefed'
    ? 'Complete — briefings sent'
    : statusLabel(status);
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

renderProgress();
subscribe(renderProgress);

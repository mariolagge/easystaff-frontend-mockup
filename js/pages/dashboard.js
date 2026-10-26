// Screen 4: case dashboard (HR). Order metrics, the process flow, the talent table and the
// one next-action button per status (SPEC §5.4). Re-renders on every state change, so a
// talent's answer from another tab shows up without a reload.

import {
  STATUSES, getState, subscribe, countTalents, matchesRequest, allDeclined,
  validateRequest, setSelected, requestAvailability, simulateAnswers,
  createShortlistAndRequestApproval, bookTalents, sendBriefings, searchAgain,
} from '../state.js';
import { initLayout, renderInfoBox, waitingStateHtml } from '../layout.js';
import { tablerIcon } from '../icons.js';
import {
  escapeHtml, formatDate, formatTimeOfDay,
  statusPillHtml, availabilityPillHtml, pillHtml, qualificationChipsHtml, statusLabel,
} from '../format.js';
import { buildFlow, renderFlow } from '../flow.js';

const BRANCH_STATUS = 'changes_requested';

function el(id) {
  return document.getElementById(id);
}

function announce(message) {
  el('dashboard-status').textContent = message;
}

// ---------- metrics ----------

function renderMetrics(state) {
  const { request, status } = state;
  const counts = countTalents(state);
  el('metric-client').textContent = request.company;
  el('metric-role').textContent = `${request.role} · ${request.serviceArea}`;
  el('metric-where').textContent = `${request.location} · ${formatDate(request.startDate)}`;
  el('metric-needed').textContent = String(counts.needed);
  el('metric-selected').textContent = String(counts.selected);
  el('metric-accepted').textContent = counts.asked ? `${counts.accepted} / ${counts.asked}` : '—';
  el('metric-status').innerHTML = statusPillHtml(status);
  el('metric-step').textContent = status === BRANCH_STATUS
    ? 'Rework'
    : `${STATUSES.indexOf(status) + 1} of ${STATUSES.length}`;
  el('metric-rework').textContent = String(state.reworkCount);
}

// ---------- talent table ----------

function renderTalents(state) {
  const { request, status } = state;
  const canSelect = status === 'validated';
  el('talent-rows').innerHTML = state.talents.map((talent) => {
    const matches = matchesRequest(talent, request);
    const reason = talent.declineReason
      ? `<span class="talent-sub">${escapeHtml(talent.declineReason)}</span>` : '';
    const shortlisted = talent.shortlisted ? ` ${pillHtml('Shortlisted', 'accent')}` : '';
    return `
      <tr class="${talent.selected ? 'is-selected' : ''}">
        <td><span class="talent-name">${escapeHtml(talent.name)}</span>
          <span class="talent-sub">${escapeHtml(talent.role)}</span></td>
        <td>${qualificationChipsHtml(talent.qualifications, request.qualifications)}</td>
        <td>${matches ? pillHtml('Yes', 'good') : pillHtml('No', 'stale')}</td>
        <td>${availabilityPillHtml(talent.availability)}${shortlisted}${reason}</td>
        <td class="col-center">
          <input type="checkbox" class="table-check" id="select-${escapeHtml(talent.id)}"
            data-talent-id="${escapeHtml(talent.id)}" aria-label="Select ${escapeHtml(talent.name)}"
            ${talent.selected ? 'checked' : ''} ${canSelect ? '' : 'disabled'} />
        </td>
      </tr>`;
  }).join('');

  el('talents-meta').textContent = canSelect
    ? 'Tick the talents to ask for availability'
    : `${countTalents(state).selected} selected · requested: ${request.qualifications.join(', ')}`;
}

// ---------- next action ----------

function nextActionContent(state) {
  const counts = countTalents(state);
  const { status } = state;
  const reworkComment = state.reworkCount > 0 && state.approval.comment && status === 'validated'
    ? `<p class="quote"><span class="quote-label">Client feedback</span>${escapeHtml(state.approval.comment)}</p>`
    : '';

  switch (status) {
    case 'submitted':
      return {
        title: 'New request received',
        text: 'The client entered the requirements in a structured form. Check that they are complete.',
        action: 'validate', label: 'Validate request', icon: 'clipboard-check',
      };
    case 'validated':
      return {
        title: state.reworkCount > 0 ? 'Search again' : 'Select talents',
        text: 'Matching talents are pre-ticked in the table. Adjust the selection, then ask them all at once.',
        extra: reworkComment,
        action: 'request-availability',
        label: `Request availability (${counts.selected} selected)`,
        icon: 'send',
        disabled: counts.selected === 0,
      };
    case 'availability_requested':
      if (allDeclined(state)) {
        return {
          title: 'Nobody accepted',
          text: 'Every asked talent declined. Select other talents and ask again.',
          action: 'search-again', label: 'Search again', icon: 'refresh',
        };
      }
      return {
        title: 'Waiting for answers',
        text: `${counts.asked - counts.pending} of ${counts.asked} answered · ${counts.accepted} of ${counts.needed} needed accepted. Answers appear here live.`,
        action: 'create-shortlist', label: 'Create shortlist', icon: 'users', disabled: true,
        helper: true,
      };
    case 'responses_complete': {
      const short = counts.accepted < counts.needed
        ? `<p class="alert alert-watch">${tablerIcon('alert-triangle', { size: 16 })}<span>Only ${counts.accepted} of ${counts.needed} accepted — the shortlist will be incomplete.</span></p>`
        : '';
      return {
        title: 'Responses complete',
        text: `${counts.accepted} talents accepted. The shortlist is built from them and sent to the client.`,
        extra: short,
        action: 'create-shortlist', label: 'Create shortlist & request approval', icon: 'send',
      };
    }
    case 'approval_requested':
      return {
        title: 'Waiting for client approval',
        text: 'The client decides on the platform, within 1 working day.',
        link: { href: 'approval.html', label: 'Open the client approval screen' },
      };
    case 'approved':
      return {
        title: 'Client approved the team',
        text: 'Book the shortlisted talents.',
        action: 'book', label: 'Book talents', icon: 'circle-check',
      };
    case 'booked':
      return {
        title: 'Talents booked',
        text: 'Send the job briefings to the talents and the final confirmation to the client.',
        action: 'brief', label: 'Send briefings', icon: 'send',
      };
    case 'briefed':
      return {
        title: 'Order complete',
        text: 'Talents are booked and briefed, the client has the final confirmation. Nothing left to do.',
        link: { href: 'index.html', label: 'Back to the start page' },
      };
    case 'changes_requested':
      return {
        title: 'Client requested changes',
        text: 'The case goes back to the talent search (rework loop).',
        extra: `<p class="quote"><span class="quote-label">Client comment</span>${escapeHtml(state.approval.comment)}</p>`,
        action: 'search-again', label: 'Search again', icon: 'refresh',
      };
    default:
      return { title: '', text: '' };
  }
}

function renderNextAction(state) {
  const next = nextActionContent(state);
  const button = next.action
    ? `<button type="button" class="btn btn-primary btn-lg btn-block" data-action="${next.action}"${next.disabled ? ' disabled' : ''}>
        ${tablerIcon(next.icon, { size: 16 })} ${escapeHtml(next.label)}</button>`
    : '';
  const link = next.link
    ? `<a class="btn btn-block" href="${next.link.href}">${escapeHtml(next.link.label)} ${tablerIcon('arrow-right', { size: 15 })}</a>`
    : '';
  const helper = next.helper
    ? `<div class="demo-helper">
        <span class="demo-helper-label">Demo helper</span>
        <button type="button" class="btn" data-action="simulate">${tablerIcon('device-mobile', { size: 15 })} Simulate answers (demo)</button>
        <a href="availability.html">or answer as a talent yourself</a>
      </div>`
    : '';
  el('next-action').innerHTML = `
    <h3 class="next-action-title" id="next-action-title" tabindex="-1">${escapeHtml(next.title)}</h3>
    <p class="next-action-text">${escapeHtml(next.text)}</p>
    ${next.extra || ''}
    ${button}
    ${link}
    ${helper}`;
}

// ---------- activity ----------

function renderActivity(state) {
  const statusEntries = state.history.map((entry) => ({
    at: entry.at, text: `Status → ${statusLabel(entry.status)}`,
  }));
  const answerEntries = state.talents
    .filter((talent) => talent.answeredAt)
    .map((talent) => ({ at: talent.answeredAt, text: `${talent.name} ${talent.availability}` }));
  const entries = [...statusEntries, ...answerEntries]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  el('activity-list').innerHTML = entries.map((entry) => `
    <li class="activity-item">
      <span class="activity-time">${escapeHtml(formatTimeOfDay(entry.at))}</span>
      <span>${escapeHtml(entry.text)}</span>
    </li>`).join('');
}

// ---------- page ----------

function render() {
  const state = getState();
  const hasOrder = state.status !== null && state.request;
  el('dashboard-empty').hidden = Boolean(hasOrder);
  el('dashboard-content').hidden = !hasOrder;
  if (!hasOrder) {
    el('dashboard-empty').innerHTML = waitingStateHtml({
      icon: 'layout-dashboard',
      title: 'No open orders',
      text: 'No open orders. Start the demo as client.',
      linkPage: 'request',
      linkLabel: 'Open the request form',
    });
    return;
  }

  // Re-rendering replaces the table and buttons; keep keyboard focus where it was.
  const focusedId = document.activeElement ? document.activeElement.id : '';
  renderMetrics(state);
  renderFlow(state);
  renderTalents(state);
  renderNextAction(state);
  renderActivity(state);
  if (focusedId && document.activeElement === document.body) {
    const again = el(focusedId);
    if (again) {
      again.focus();
    }
  }
}

const ACTIONS = {
  validate: validateRequest,
  'request-availability': requestAvailability,
  simulate: simulateAnswers,
  'create-shortlist': createShortlistAndRequestApproval,
  book: bookTalents,
  brief: sendBriefings,
  'search-again': searchAgain,
};

el('next-action').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) {
    return;
  }
  ACTIONS[button.dataset.action]();
  announce(`Status: ${statusLabel(getState().status)}.`);
  const title = el('next-action-title');
  if (title) {
    title.focus();
  }
});

el('talent-rows').addEventListener('change', (event) => {
  const box = event.target.closest('[data-talent-id]');
  if (box) {
    setSelected(box.dataset.talentId, box.checked);
  }
});

initLayout('dashboard');
renderInfoBox(el('info-box'), {
  replaces: 'Talent list, availability list and final talent list in Excel.',
  solves: 'Manual lists and no transparency on the order status.',
  tasks: 'All HR tasks, from “Validate requirements list” to “Send briefings”.',
});
buildFlow();
render();
subscribe(render);

// Screen 3: shortlist approval (client). Approve → approved; request changes (comment
// required) → changes_requested, the rework loop "Approval received? = NO" (SPEC §5.3).

import { getState, subscribe, decideApproval, countTalents } from '../state.js';
import { initLayout, renderInfoBox, waitingStateHtml } from '../layout.js';
import { tablerIcon } from '../icons.js';
import { escapeHtml, formatDateRange, formatShift, qualificationChipsHtml, statusPillHtml } from '../format.js';

const content = document.getElementById('approval-content');

let changesOpen = false;
let commentDraft = '';
let commentError = '';

function announce(message) {
  document.getElementById('approval-status').textContent = message;
}

function initials(name) {
  return name.replace(/\(demo\)/, '').trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2);
}

function shortlistHtml(state) {
  const requested = state.request.qualifications;
  return `<ul class="shortlist">${state.talents.filter((talent) => talent.shortlisted).map((talent) => `
    <li class="shortlist-item">
      <span class="avatar" aria-hidden="true">${escapeHtml(initials(talent.name))}</span>
      <div class="shortlist-text">
        <span class="shortlist-name">${escapeHtml(talent.name)}</span>
        <span class="shortlist-role">${escapeHtml(talent.role)} · availability confirmed</span>
        ${qualificationChipsHtml(talent.qualifications, requested)}
        <span class="shortlist-profile">${escapeHtml(talent.profile)}</span>
      </div>
    </li>`).join('')}</ul>`;
}

function incompleteWarningHtml(state) {
  const { shortlisted, needed } = countTalents(state);
  if (shortlisted >= needed) {
    return '';
  }
  return `
    <div class="alert alert-watch" role="note">
      ${tablerIcon('alert-triangle', { size: 16 })}
      <span><strong>Incomplete team: ${shortlisted} of ${needed} positions.</strong>
      Not enough talents were available. You can approve this team or ask HR to search again.</span>
    </div>`;
}

function orderRecapHtml(request) {
  const rows = [
    ['Role', request.role],
    ['Location', request.location],
    ['Date', formatDateRange(request.startDate, request.endDate)],
    ['Shift', formatShift(request.shiftStart, request.shiftEnd)],
  ];
  return `<dl class="data-list">${rows.map(([label, value]) => `
    <div class="data-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>`;
}

function decisionPanelHtml() {
  if (!changesOpen) {
    return `
      <div class="btn-row">
        <button type="button" class="btn btn-good btn-lg btn-block" data-action="approve">
          ${tablerIcon('check', { size: 18 })} Approve team
        </button>
        <button type="button" class="btn btn-lg btn-block" data-action="open-changes">Request changes</button>
      </div>`;
  }
  const invalid = commentError ? ' aria-invalid="true"' : '';
  return `
    <div class="field">
      <label class="form-label" for="change-comment">What should HR change?</label>
      <textarea class="form-input" id="change-comment" required aria-describedby="change-comment-error"${invalid}>${escapeHtml(commentDraft)}</textarea>
      <p class="field-error" id="change-comment-error" aria-live="assertive">${commentError
        ? `${tablerIcon('alert-triangle', { size: 14 })}<span>${escapeHtml(commentError)}</span>` : ''}</p>
    </div>
    <div class="btn-row">
      <button type="button" class="btn" data-action="cancel-changes">Back</button>
      <button type="button" class="btn btn-primary" data-action="send-changes">
        ${tablerIcon('send', { size: 15 })} Send change request
      </button>
    </div>`;
}

function approvalViewHtml(state) {
  return `
    <div class="approval-grid">
      <section class="card" aria-labelledby="shortlist-title">
        <div class="card-header">
          <h2 class="card-title" id="shortlist-title">${tablerIcon('users', { size: 14 })} Proposed team</h2>
          <span class="card-meta">${countTalents(state).shortlisted} of ${state.request.staff} positions</span>
        </div>
        <div class="card-body stack">
          ${incompleteWarningHtml(state)}
          ${shortlistHtml(state)}
        </div>
      </section>
      <section class="card" aria-labelledby="decision-title">
        <div class="card-header">
          <h2 class="card-title" id="decision-title">${tablerIcon('clipboard-check', { size: 14 })} Your decision</h2>
        </div>
        <div class="card-body decision-panel">
          <p class="deadline">${tablerIcon('clock', { size: 16 })}<span>Please decide within 1 working day</span></p>
          ${orderRecapHtml(state.request)}
          ${decisionPanelHtml()}
        </div>
      </section>
    </div>`;
}

function decidedViewHtml(state) {
  if (state.status === 'changes_requested') {
    return `
      <section class="card">
        ${waitingStateHtml({
          icon: 'refresh',
          title: 'Changes requested',
          text: 'HR has your feedback and is searching for talents again. You will get a new proposal here.',
          linkPage: 'dashboard',
          linkLabel: 'Switch to the HR view',
        })}
        <div class="card-body"><p class="quote"><span class="quote-label">Your comment</span>${escapeHtml(state.approval.comment)}</p></div>
      </section>`;
  }
  const texts = {
    approved: 'HR now books the talents. No e-mail needed.',
    booked: 'The talents are booked. Briefings follow shortly.',
    briefed: 'All talents are booked and briefed. Your final confirmation is here on the platform.',
  };
  return `
    <section class="card" aria-labelledby="approved-title">
      <div class="card-header">
        <h2 class="card-title" id="approved-title" tabindex="-1">${tablerIcon('circle-check', { size: 14 })} Team approved</h2>
        ${statusPillHtml(state.status)}
      </div>
      <div class="card-body stack">
        <p class="alert alert-good">${tablerIcon('circle-check', { size: 16 })}<span>${escapeHtml(texts[state.status])}</span></p>
        ${shortlistHtml(state)}
      </div>
    </section>`;
}

function render() {
  const state = getState();

  if (state.status === 'approval_requested') {
    content.innerHTML = approvalViewHtml(state);
    return;
  }
  changesOpen = false;
  commentError = '';

  if (['changes_requested', 'approved', 'booked', 'briefed'].includes(state.status)) {
    content.innerHTML = decidedViewHtml(state);
    return;
  }

  const noOrder = state.status === null;
  content.innerHTML = `<div class="card">${waitingStateHtml({
    icon: 'clipboard-check',
    title: noOrder ? 'No order yet' : 'No shortlist to approve yet',
    text: noOrder
      ? 'Start the demo by submitting a staffing request.'
      : (state.reworkCount > 0
        ? 'HR is preparing a new proposal based on your feedback.'
        : 'HR is still collecting the talents\' availability. You will be asked to approve here.'),
    linkPage: noOrder ? 'request' : 'dashboard',
    linkLabel: noOrder ? 'Open the request form' : 'Switch to the HR view',
  })}</div>`;
}

function focusIn(selector) {
  const element = content.querySelector(selector);
  if (element) {
    element.focus();
  }
}

content.addEventListener('input', (event) => {
  if (event.target.id === 'change-comment') {
    commentDraft = event.target.value;
  }
});

content.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) {
    return;
  }
  const { action } = button.dataset;
  if (action === 'approve') {
    decideApproval('approved');
    announce('Team approved.');
    focusIn('#approved-title');
  } else if (action === 'open-changes') {
    changesOpen = true;
    render();
    focusIn('#change-comment');
  } else if (action === 'cancel-changes') {
    changesOpen = false;
    commentError = '';
    render();
    focusIn('[data-action="open-changes"]');
  } else if (action === 'send-changes') {
    if (!commentDraft.trim()) {
      commentError = 'Please describe what HR should change.';
      render();
      focusIn('#change-comment');
      return;
    }
    decideApproval('changes_requested', commentDraft);
    commentDraft = '';
    announce('Change request sent to HR.');
  }
});

initLayout('approval');
renderInfoBox(document.getElementById('info-box'), {
  replaces: '“Request customer approval” and waiting for the approval e-mail.',
  solves: 'Slow confirmation — the client decides on the platform within 1 working day.',
  tasks: 'HR “Request customer approval” → “Check approval decision”.',
});
render();
subscribe(render);

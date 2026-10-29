// Screen 3: shortlist approval (client). Approve → approved; request changes (comment
// required) → changes_requested, the rework loop "Approval received? = NO" (SPEC §5.3).

import { getState, subscribe, decideApproval, countTalents } from '../state.js';
import { initLayout, renderInfoBox, waitingStateHtml } from '../layout.js';
import { tablerIcon } from '../icons.js';
import {
  escapeHtml, formatDateRange, formatShift, qualificationChipsHtml, statusPillHtml,
  talentName, talentRole, talentProfile,
} from '../format.js';
import { t, onLangChange } from '../i18n.js';

const content = document.getElementById('approval-content');

let changesOpen = false;
let commentDraft = '';
let commentErrorKey = '';

function announce(message) {
  document.getElementById('approval-status').textContent = message;
}

// "Talent A (demo)" / "Talent A (Demo)" → "TA".
function initials(name) {
  return name.replace(/\(demo\)/i, '').trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2);
}

function shortlistHtml(state) {
  const requested = state.request.qualifications;
  return `<ul class="shortlist">${state.talents.filter((talent) => talent.shortlisted).map((talent) => `
    <li class="shortlist-item">
      <span class="avatar" aria-hidden="true">${escapeHtml(initials(talentName(talent)))}</span>
      <div class="shortlist-text">
        <span class="shortlist-name">${escapeHtml(talentName(talent))}</span>
        <span class="shortlist-role">${escapeHtml(t('approval.availabilityConfirmed', { role: talentRole(talent) }))}</span>
        ${qualificationChipsHtml(talent.qualifications, requested)}
        <span class="shortlist-profile">${escapeHtml(talentProfile(talent))}</span>
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
      <span><strong>${escapeHtml(t('approval.incompleteTitle', { shortlisted, needed }))}</strong>
      ${escapeHtml(t('approval.incompleteText'))}</span>
    </div>`;
}

function orderRecapHtml(request) {
  const rows = [
    [t('field.role'), request.role],
    [t('field.location'), request.location],
    [t('field.date'), formatDateRange(request.startDate, request.endDate)],
    [t('field.shift'), formatShift(request.shiftStart, request.shiftEnd)],
  ];
  return `<dl class="data-list">${rows.map(([label, value]) => `
    <div class="data-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>`;
}

function decisionPanelHtml() {
  if (!changesOpen) {
    return `
      <div class="btn-row">
        <button type="button" class="btn btn-good btn-lg btn-block" data-action="approve">
          ${tablerIcon('check', { size: 18 })} ${escapeHtml(t('approval.approve'))}
        </button>
        <button type="button" class="btn btn-lg btn-block" data-action="open-changes">${escapeHtml(t('approval.requestChanges'))}</button>
      </div>`;
  }
  const invalid = commentErrorKey ? ' aria-invalid="true"' : '';
  return `
    <div class="field">
      <label class="form-label" for="change-comment">${escapeHtml(t('approval.commentLabel'))}</label>
      <textarea class="form-input" id="change-comment" required aria-describedby="change-comment-error"${invalid}>${escapeHtml(commentDraft)}</textarea>
      <p class="field-error" id="change-comment-error" aria-live="assertive">${commentErrorKey
        ? `${tablerIcon('alert-triangle', { size: 14 })}<span>${escapeHtml(t(commentErrorKey))}</span>` : ''}</p>
    </div>
    <div class="btn-row">
      <button type="button" class="btn" data-action="cancel-changes">${escapeHtml(t('common.back'))}</button>
      <button type="button" class="btn btn-primary" data-action="send-changes">
        ${tablerIcon('send', { size: 15 })} ${escapeHtml(t('approval.sendChanges'))}
      </button>
    </div>`;
}

function approvalViewHtml(state) {
  const positions = t('approval.positions', { count: countTalents(state).shortlisted, total: state.request.staff });
  return `
    <div class="approval-grid">
      <section class="card" aria-labelledby="shortlist-title">
        <div class="card-header">
          <h2 class="card-title" id="shortlist-title">${tablerIcon('users', { size: 14 })} ${escapeHtml(t('approval.proposedTeam'))}</h2>
          <span class="card-meta">${escapeHtml(positions)}</span>
        </div>
        <div class="card-body stack">
          ${incompleteWarningHtml(state)}
          ${shortlistHtml(state)}
        </div>
      </section>
      <section class="card" aria-labelledby="decision-title">
        <div class="card-header">
          <h2 class="card-title" id="decision-title">${tablerIcon('clipboard-check', { size: 14 })} ${escapeHtml(t('approval.decisionTitle'))}</h2>
        </div>
        <div class="card-body decision-panel">
          <p class="deadline">${tablerIcon('clock', { size: 16 })}<span>${escapeHtml(t('approval.deadline'))}</span></p>
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
          title: t('approval.changesTitle'),
          text: t('approval.changesText'),
          linkPage: 'dashboard',
          linkLabel: t('common.switchToHr'),
        })}
        <div class="card-body"><p class="quote"><span class="quote-label">${escapeHtml(t('approval.yourComment'))}</span>${escapeHtml(state.approval.comment)}</p></div>
      </section>`;
  }
  const textKeys = {
    approved: 'approval.approvedText',
    booked: 'approval.bookedText',
    briefed: 'approval.briefedText',
  };
  return `
    <section class="card" aria-labelledby="approved-title">
      <div class="card-header">
        <h2 class="card-title" id="approved-title" tabindex="-1">${tablerIcon('circle-check', { size: 14 })} ${escapeHtml(t('approval.approvedTitle'))}</h2>
        ${statusPillHtml(state.status)}
      </div>
      <div class="card-body stack">
        <p class="alert alert-good">${tablerIcon('circle-check', { size: 16 })}<span>${escapeHtml(t(textKeys[state.status]))}</span></p>
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
  commentErrorKey = '';

  if (['changes_requested', 'approved', 'booked', 'briefed'].includes(state.status)) {
    content.innerHTML = decidedViewHtml(state);
    return;
  }

  const noOrder = state.status === null;
  let text = t('approval.collectingText');
  if (noOrder) {
    text = t('approval.noOrderText');
  } else if (state.reworkCount > 0) {
    text = t('approval.reworkText');
  }
  content.innerHTML = `<div class="card">${waitingStateHtml({
    icon: 'clipboard-check',
    title: noOrder ? t('approval.noOrderTitle') : t('approval.noShortlistTitle'),
    text,
    linkPage: noOrder ? 'request' : 'dashboard',
    linkLabel: noOrder ? t('common.openRequestForm') : t('common.switchToHr'),
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
    announce(t('approval.announceApproved'));
    focusIn('#approved-title');
  } else if (action === 'open-changes') {
    changesOpen = true;
    render();
    focusIn('#change-comment');
  } else if (action === 'cancel-changes') {
    changesOpen = false;
    commentErrorKey = '';
    render();
    focusIn('[data-action="open-changes"]');
  } else if (action === 'send-changes') {
    if (!commentDraft.trim()) {
      commentErrorKey = 'approval.commentError';
      render();
      focusIn('#change-comment');
      return;
    }
    decideApproval('changes_requested', commentDraft);
    commentDraft = '';
    announce(t('approval.announceChanges'));
  }
});

initLayout('approval');
renderInfoBox(document.getElementById('info-box'), 'approval');
render();
subscribe(render);
onLangChange(render);

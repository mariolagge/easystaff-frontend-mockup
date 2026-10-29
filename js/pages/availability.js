// Screen 2: availability check (talent, mobile first). One job card per asked talent; the
// "View as" picker lets one viewer answer for several demo talents (SPEC §5.2).

import { getState, subscribe, answerAvailability } from '../state.js';
import { initLayout, renderInfoBox, waitingStateHtml } from '../layout.js';
import { tablerIcon } from '../icons.js';
import {
  escapeHtml, formatDateRange, formatShift, hoursLeft, talentName, declineReasonLabel,
} from '../format.js';
import { DECLINE_REASONS } from '../seed.js';
import { t, onLangChange } from '../i18n.js';

const RESPONSE_DEADLINE_HOURS = 24;

const content = document.getElementById('talent-content');
const viewAsCard = document.getElementById('view-as-card');
const viewAs = document.getElementById('view-as');

let viewedTalentId = null;
let declineOpen = false;

function askedTalents(state) {
  return state.talents.filter((talent) => talent.availability !== 'not_requested');
}

function announce(message) {
  document.getElementById('talent-status').textContent = message;
}

function renderViewAs(talents) {
  viewAs.innerHTML = talents.map((talent) => {
    const marker = talent.availability === 'pending' ? t('avail.viewAsOpen') : t('avail.viewAsAnswered');
    const selected = talent.id === viewedTalentId ? ' selected' : '';
    return `<option value="${escapeHtml(talent.id)}"${selected}>${escapeHtml(talentName(talent))} — ${escapeHtml(marker)}</option>`;
  }).join('');
}

function jobFactHtml(icon, label, value) {
  return `
    <li class="job-fact">
      <span class="job-fact-icon">${tablerIcon(icon, { size: 18 })}</span>
      <span><span class="job-fact-label">${escapeHtml(label)}</span>
      <span class="job-fact-value">${escapeHtml(value)}</span></span>
    </li>`;
}

function answerAreaHtml(state) {
  const left = hoursLeft(state.availabilityRequestedAt, RESPONSE_DEADLINE_HOURS);
  const deadline = `
    <p class="deadline">
      ${tablerIcon('clock', { size: 16 })}
      <span>${escapeHtml(t('avail.deadline'))}</span>
      <strong>${escapeHtml(t('avail.hoursLeft', { hours: left }))}</strong>
    </p>`;

  if (declineOpen) {
    return `${deadline}
      <div class="answer-area">
        <div class="decline-panel">
          <label class="form-label" for="decline-reason">${escapeHtml(t('avail.reason'))} <span class="optional-mark">${escapeHtml(t('common.optional'))}</span></label>
          <select class="form-input" id="decline-reason">
            <option value="">${escapeHtml(t('avail.noReason'))}</option>
            ${DECLINE_REASONS.map((reason) => `<option value="${escapeHtml(reason)}">${escapeHtml(declineReasonLabel(reason))}</option>`).join('')}
          </select>
          <div class="answer-buttons">
            <button type="button" class="btn" data-action="cancel-decline">${escapeHtml(t('common.back'))}</button>
            <button type="button" class="btn btn-critical-outline" data-action="confirm-decline">${escapeHtml(t('avail.confirmDecline'))}</button>
          </div>
        </div>
      </div>`;
  }

  return `${deadline}
    <div class="answer-area">
      <div class="answer-buttons">
        <button type="button" class="btn btn-lg btn-critical-outline" data-action="decline">
          ${tablerIcon('x', { size: 18 })} ${escapeHtml(t('avail.decline'))}
        </button>
        <button type="button" class="btn btn-lg btn-good" data-action="accept">
          ${tablerIcon('check', { size: 18 })} ${escapeHtml(t('avail.accept'))}
        </button>
      </div>
    </div>`;
}

function resultHtml(state, talent) {
  const dashboardLink = `<a class="btn" href="dashboard.html">${escapeHtml(t('avail.toDashboard'))}</a>`;

  if (talent.availability === 'pending') {
    return `
      <div class="answer-result">
        <div class="answer-result-icon tone-stale">${tablerIcon('clock', { size: 26 })}</div>
        <h2 class="answer-result-title" tabindex="-1">${escapeHtml(t('avail.closedTitle'))}</h2>
        <p class="answer-result-text">${escapeHtml(t('avail.closedText'))}</p>
      </div>`;
  }

  if (talent.availability === 'declined') {
    const reason = talent.declineReason
      ? t('avail.declinedReason', { reason: declineReasonLabel(talent.declineReason) })
      : '';
    return `
      <div class="answer-result">
        <div class="answer-result-icon tone-critical">${tablerIcon('x', { size: 26 })}</div>
        <h2 class="answer-result-title" tabindex="-1">${escapeHtml(t('avail.declinedTitle'))}</h2>
        <p class="answer-result-text">${escapeHtml(t('avail.seenByHr'))}${escapeHtml(reason)}</p>
        ${dashboardLink}
      </div>`;
  }

  let title = t('avail.acceptedTitle');
  let text = t('avail.acceptedText');
  if (talent.shortlisted && state.status === 'briefed') {
    title = t('avail.briefedTitle');
    text = t('avail.briefedText');
  } else if (talent.shortlisted && state.status === 'booked') {
    title = t('avail.bookedTitle');
    text = t('avail.bookedText');
  } else if (talent.shortlisted) {
    text = t('avail.shortlistedText');
  }
  return `
    <div class="answer-result">
      <div class="answer-result-icon tone-good">${tablerIcon('circle-check', { size: 26 })}</div>
      <h2 class="answer-result-title" tabindex="-1">${escapeHtml(title)}</h2>
      <p class="answer-result-text">${escapeHtml(text)}</p>
      ${dashboardLink}
    </div>`;
}

function jobCardHtml(state, talent) {
  const { request } = state;
  const canAnswer = state.status === 'availability_requested' && talent.availability === 'pending';
  return `
    <article class="card" aria-labelledby="job-title">
      <div class="job-card-head">
        <p class="job-card-greeting">${escapeHtml(t('avail.greeting', { name: talentName(talent) }))}</p>
        <h2 class="job-card-title" id="job-title">${escapeHtml(request.role)}</h2>
        <p class="job-card-client">${escapeHtml(request.company)}</p>
      </div>
      <ul class="job-facts">
        ${jobFactHtml('map-pin', t('field.location'), request.location)}
        ${jobFactHtml('calendar', t('field.date'), formatDateRange(request.startDate, request.endDate))}
        ${jobFactHtml('clock', t('field.shift'), formatShift(request.shiftStart, request.shiftEnd))}
        ${jobFactHtml('briefcase', t('avail.pay'), t('avail.payValue'))}
      </ul>
      ${canAnswer ? answerAreaHtml(state) : resultHtml(state, talent)}
    </article>`;
}

function render() {
  const state = getState();
  const talents = askedTalents(state);

  if (talents.length === 0) {
    viewAsCard.hidden = true;
    viewedTalentId = null;
    content.innerHTML = `<div class="card">${waitingStateHtml({
      icon: 'device-mobile',
      title: t('avail.emptyTitle'),
      text: state.status === null ? t('avail.emptyNoOrder') : t('avail.emptyNotAsked'),
      linkPage: state.status === null ? 'request' : 'dashboard',
      linkLabel: state.status === null ? t('common.openRequestForm') : t('avail.openDashboard'),
    })}</div>`;
    return;
  }

  // Keep the viewed talent if still asked; otherwise show the first one still to answer.
  if (!talents.some((talent) => talent.id === viewedTalentId)) {
    const firstOpen = talents.find((talent) => talent.availability === 'pending');
    viewedTalentId = (firstOpen || talents[0]).id;
    declineOpen = false;
  }

  viewAsCard.hidden = false;
  renderViewAs(talents);
  const talent = talents.find((candidate) => candidate.id === viewedTalentId);
  content.innerHTML = jobCardHtml(state, talent);
}

function focusIn(selector) {
  const element = content.querySelector(selector);
  if (element) {
    element.focus();
  }
}

content.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) {
    return;
  }
  const { action } = button.dataset;
  if (action === 'accept') {
    answerAvailability(viewedTalentId, 'accepted');
    announce(t('avail.announceAccepted'));
    focusIn('.answer-result-title');
  } else if (action === 'decline') {
    declineOpen = true;
    render();
    focusIn('#decline-reason');
  } else if (action === 'cancel-decline') {
    declineOpen = false;
    render();
    focusIn('[data-action="decline"]');
  } else if (action === 'confirm-decline') {
    const reason = content.querySelector('#decline-reason').value || null;
    declineOpen = false;
    answerAvailability(viewedTalentId, 'declined', reason);
    announce(t('avail.announceDeclined'));
    focusIn('.answer-result-title');
  }
});

viewAs.addEventListener('change', () => {
  viewedTalentId = viewAs.value;
  declineOpen = false;
  render();
});

initLayout('availability');
renderInfoBox(document.getElementById('info-box'), 'availability');
render();
subscribe(render);

// Keep a decline reason picked before the switch.
onLangChange(() => {
  const reasonSelect = content.querySelector('#decline-reason');
  const reason = reasonSelect ? reasonSelect.value : '';
  render();
  if (reason) {
    content.querySelector('#decline-reason').value = reason;
  }
});

// Screen 2: availability check (talent, mobile first). One job card per asked talent; the
// "View as" picker lets one viewer answer for several demo talents (SPEC §5.2).

import { getState, subscribe, answerAvailability } from '../state.js';
import { initLayout, renderInfoBox, waitingStateHtml } from '../layout.js';
import { tablerIcon } from '../icons.js';
import { escapeHtml, formatDateRange, formatShift, hoursLeft } from '../format.js';
import { DECLINE_REASONS } from '../seed.js';

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
    const marker = talent.availability === 'pending' ? 'open' : 'answered ✓';
    const selected = talent.id === viewedTalentId ? ' selected' : '';
    return `<option value="${escapeHtml(talent.id)}"${selected}>${escapeHtml(talent.name)} — ${marker}</option>`;
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
      <span>Please answer within 24 h</span>
      <strong>${left} h left</strong>
    </p>`;

  if (declineOpen) {
    return `${deadline}
      <div class="answer-area">
        <div class="decline-panel">
          <label class="form-label" for="decline-reason">Reason <span class="optional-mark">(optional)</span></label>
          <select class="form-input" id="decline-reason">
            <option value="">Prefer not to say</option>
            ${DECLINE_REASONS.map((reason) => `<option>${escapeHtml(reason)}</option>`).join('')}
          </select>
          <div class="answer-buttons">
            <button type="button" class="btn" data-action="cancel-decline">Back</button>
            <button type="button" class="btn btn-critical-outline" data-action="confirm-decline">Confirm decline</button>
          </div>
        </div>
      </div>`;
  }

  return `${deadline}
    <div class="answer-area">
      <div class="answer-buttons">
        <button type="button" class="btn btn-lg btn-critical-outline" data-action="decline">
          ${tablerIcon('x', { size: 18 })} Decline
        </button>
        <button type="button" class="btn btn-lg btn-good" data-action="accept">
          ${tablerIcon('check', { size: 18 })} Accept
        </button>
      </div>
    </div>`;
}

function resultHtml(state, talent) {
  const dashboardLink = '<a class="btn" href="dashboard.html">See it in the HR dashboard</a>';

  if (talent.availability === 'pending') {
    return `
      <div class="answer-result">
        <div class="answer-result-icon tone-stale">${tablerIcon('clock', { size: 26 })}</div>
        <h2 class="answer-result-title" tabindex="-1">This offer is closed</h2>
        <p class="answer-result-text">Enough talents have already answered. Thank you — no action needed.</p>
      </div>`;
  }

  if (talent.availability === 'declined') {
    const reason = talent.declineReason ? ` Reason: ${talent.declineReason}.` : '';
    return `
      <div class="answer-result">
        <div class="answer-result-icon tone-critical">${tablerIcon('x', { size: 26 })}</div>
        <h2 class="answer-result-title" tabindex="-1">You declined this offer</h2>
        <p class="answer-result-text">HR sees your answer immediately.${escapeHtml(reason)}</p>
        ${dashboardLink}
      </div>`;
  }

  let title = 'You accepted — thank you!';
  let text = 'HR sees your answer immediately. You will hear back once the client has approved the team.';
  if (talent.shortlisted && state.status === 'briefed') {
    title = 'You are booked — briefing sent';
    text = 'Your job briefing has been sent to you on the platform.';
  } else if (talent.shortlisted && state.status === 'booked') {
    title = 'You are booked';
    text = 'The client approved the team. Your briefing follows shortly.';
  } else if (talent.shortlisted) {
    text = 'You are on the shortlist sent to the client for approval.';
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
        <p class="job-card-greeting">Hi ${escapeHtml(talent.name)}, new job offer for you</p>
        <h2 class="job-card-title" id="job-title">${escapeHtml(request.role)}</h2>
        <p class="job-card-client">${escapeHtml(request.company)}</p>
      </div>
      <ul class="job-facts">
        ${jobFactHtml('map-pin', 'Location', request.location)}
        ${jobFactHtml('calendar', 'Date', formatDateRange(request.startDate, request.endDate))}
        ${jobFactHtml('clock', 'Shift', formatShift(request.shiftStart, request.shiftEnd))}
        ${jobFactHtml('briefcase', 'Pay', 'As per contract')}
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
      title: 'No job offers yet',
      text: state.status === null
        ? 'There is no staffing order yet. Start the demo as the client.'
        : 'HR has not asked any talents for their availability yet.',
      linkPage: state.status === null ? 'request' : 'dashboard',
      linkLabel: state.status === null ? 'Open the request form' : 'Open the HR dashboard',
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
    announce('Offer accepted.');
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
    announce('Offer declined.');
    focusIn('.answer-result-title');
  }
});

viewAs.addEventListener('change', () => {
  viewedTalentId = viewAs.value;
  declineOpen = false;
  render();
});

initLayout('availability');
renderInfoBox(document.getElementById('info-box'), {
  replaces: '“Check availability” and waiting for e-mail replies.',
  solves: 'Slow confirmation — talents answer in the app within 24 h.',
  tasks: 'HR “Request availability” → “Check availability response”.',
});
render();
subscribe(render);

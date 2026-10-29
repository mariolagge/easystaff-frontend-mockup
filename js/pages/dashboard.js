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
  serviceAreaLabel, qualificationLabel, declineReasonLabel, talentName, talentRole,
} from '../format.js';
import { buildFlow, renderFlow } from '../flow.js';
import { t, onLangChange } from '../i18n.js';

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
  el('metric-role').textContent = `${request.role} · ${serviceAreaLabel(request.serviceArea)}`;
  el('metric-where').textContent = `${request.location} · ${formatDate(request.startDate)}`;
  el('metric-needed').textContent = String(counts.needed);
  el('metric-selected').textContent = String(counts.selected);
  el('metric-accepted').textContent = counts.asked ? `${counts.accepted} / ${counts.asked}` : '—';
  el('metric-status').innerHTML = statusPillHtml(status);
  el('metric-step').textContent = status === BRANCH_STATUS
    ? t('dashboard.stepRework')
    : t('dashboard.stepOf', { step: STATUSES.indexOf(status) + 1, total: STATUSES.length });
  el('metric-rework').textContent = String(state.reworkCount);
}

// ---------- talent table ----------

function renderTalents(state) {
  const { request, status } = state;
  const canSelect = status === 'validated';
  el('talent-rows').innerHTML = state.talents.map((talent) => {
    const matches = matchesRequest(talent, request);
    const reason = talent.declineReason
      ? `<span class="talent-sub">${escapeHtml(declineReasonLabel(talent.declineReason))}</span>` : '';
    const shortlisted = talent.shortlisted ? ` ${pillHtml(t('dashboard.shortlisted'), 'accent')}` : '';
    return `
      <tr class="${talent.selected ? 'is-selected' : ''}">
        <td><span class="talent-name">${escapeHtml(talentName(talent))}</span>
          <span class="talent-sub">${escapeHtml(talentRole(talent))}</span></td>
        <td>${qualificationChipsHtml(talent.qualifications, request.qualifications)}</td>
        <td>${matches ? pillHtml(t('common.yes'), 'good') : pillHtml(t('common.no'), 'stale')}</td>
        <td>${availabilityPillHtml(talent.availability)}${shortlisted}${reason}</td>
        <td class="col-center">
          <input type="checkbox" class="table-check" id="select-${escapeHtml(talent.id)}"
            data-talent-id="${escapeHtml(talent.id)}" aria-label="${escapeHtml(t('dashboard.selectTalent', { name: talentName(talent) }))}"
            ${talent.selected ? 'checked' : ''} ${canSelect ? '' : 'disabled'} />
        </td>
      </tr>`;
  }).join('');

  el('talents-meta').textContent = canSelect
    ? t('dashboard.tickHint')
    : t('dashboard.selectedMeta', {
      count: countTalents(state).selected,
      qualifications: request.qualifications.map(qualificationLabel).join(', '),
    });
}

// ---------- next action ----------

function quoteHtml(labelKey, comment) {
  return `<p class="quote"><span class="quote-label">${escapeHtml(t(labelKey))}</span>${escapeHtml(comment)}</p>`;
}

function nextActionContent(state) {
  const counts = countTalents(state);
  const { status } = state;
  const reworkComment = state.reworkCount > 0 && state.approval.comment && status === 'validated'
    ? quoteHtml('dashboard.clientFeedback', state.approval.comment)
    : '';

  switch (status) {
    case 'submitted':
      return {
        title: t('dashboard.submittedTitle'),
        text: t('dashboard.submittedText'),
        action: 'validate', label: t('dashboard.validate'), icon: 'clipboard-check',
      };
    case 'validated':
      return {
        title: state.reworkCount > 0 ? t('dashboard.searchAgain') : t('dashboard.selectTalents'),
        text: t('dashboard.validatedText'),
        extra: reworkComment,
        action: 'request-availability',
        label: t('dashboard.requestAvailability', { count: counts.selected }),
        icon: 'send',
        disabled: counts.selected === 0,
      };
    case 'availability_requested':
      if (allDeclined(state)) {
        return {
          title: t('dashboard.allDeclinedTitle'),
          text: t('dashboard.allDeclinedText'),
          action: 'search-again', label: t('dashboard.searchAgain'), icon: 'refresh',
        };
      }
      return {
        title: t('dashboard.waitingTitle'),
        text: t('dashboard.waitingText', {
          answered: counts.asked - counts.pending,
          asked: counts.asked,
          accepted: counts.accepted,
          needed: counts.needed,
        }),
        action: 'create-shortlist', label: t('dashboard.createShortlist'), icon: 'users', disabled: true,
        helper: true,
      };
    case 'responses_complete': {
      const warning = t('dashboard.shortWarning', { accepted: counts.accepted, needed: counts.needed });
      const short = counts.accepted < counts.needed
        ? `<p class="alert alert-watch">${tablerIcon('alert-triangle', { size: 16 })}<span>${escapeHtml(warning)}</span></p>`
        : '';
      return {
        title: t('dashboard.completeTitle'),
        text: t('dashboard.completeText', { accepted: counts.accepted }),
        extra: short,
        action: 'create-shortlist', label: t('dashboard.createShortlistApproval'), icon: 'send',
      };
    }
    case 'approval_requested':
      return {
        title: t('dashboard.approvalTitle'),
        text: t('dashboard.approvalText'),
        link: { href: 'approval.html', label: t('dashboard.openApproval') },
      };
    case 'approved':
      return {
        title: t('dashboard.approvedTitle'),
        text: t('dashboard.approvedText'),
        action: 'book', label: t('dashboard.book'), icon: 'circle-check',
      };
    case 'booked':
      return {
        title: t('dashboard.bookedTitle'),
        text: t('dashboard.bookedText'),
        action: 'brief', label: t('dashboard.brief'), icon: 'send',
      };
    case 'briefed':
      return {
        title: t('dashboard.briefedTitle'),
        text: t('dashboard.briefedText'),
        link: { href: 'index.html', label: t('dashboard.backToStart') },
      };
    case 'changes_requested':
      return {
        title: t('dashboard.changesTitle'),
        text: t('dashboard.changesText'),
        extra: quoteHtml('dashboard.clientComment', state.approval.comment),
        action: 'search-again', label: t('dashboard.searchAgain'), icon: 'refresh',
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
        <span class="demo-helper-label">${escapeHtml(t('dashboard.demoHelper'))}</span>
        <button type="button" class="btn" data-action="simulate">${tablerIcon('device-mobile', { size: 15 })} ${escapeHtml(t('dashboard.simulate'))}</button>
        <a href="availability.html">${escapeHtml(t('dashboard.answerYourself'))}</a>
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

const ANSWER_KEYS = { accepted: 'dashboard.activityAccepted', declined: 'dashboard.activityDeclined' };

function renderActivity(state) {
  const statusEntries = state.history.map((entry) => ({
    at: entry.at, text: t('dashboard.activityStatus', { status: statusLabel(entry.status) }),
  }));
  const answerEntries = state.talents
    .filter((talent) => talent.answeredAt)
    .map((talent) => ({
      at: talent.answeredAt, text: t(ANSWER_KEYS[talent.availability], { name: talentName(talent) }),
    }));
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
      title: t('dashboard.emptyTitle'),
      text: t('dashboard.emptyText'),
      linkPage: 'request',
      linkLabel: t('common.openRequestForm'),
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
  announce(t('dashboard.announceStatus', { status: statusLabel(getState().status) }));
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
renderInfoBox(el('info-box'), 'dashboard');
buildFlow();
render();
subscribe(render);
onLangChange(render);

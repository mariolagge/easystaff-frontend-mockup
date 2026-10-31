// Display text and value formatting. State holds raw values and keys; every label shown
// for a status, availability, option or talent comes from js/i18n through the helpers
// below. Task names follow the To-Be model (images/to-be-process-model.png in the repo root) and
// GLOSSARY.md.

import { tablerIcon } from './icons.js';
import { t, locale } from './i18n.js';

export const EM_DASH = '—';

// tone: colour family of the badge. The label is t('status.<status>'), the To-Be BPMN task
// name shown everywhere a status is labelled (SPEC §6); two tasks joined by " · " share
// one status.
export const STATUS_META = {
  submitted: { tone: 'accent' },
  validated: { tone: 'accent' },
  availability_requested: { tone: 'accent' },
  responses_complete: { tone: 'accent' },
  approval_requested: { tone: 'accent' },
  approved: { tone: 'good' },
  booked: { tone: 'good' },
  briefed: { tone: 'good' },
  changes_requested: { tone: 'watch' },
};

export const AVAILABILITY_META = {
  not_requested: { tone: 'stale' },
  pending: { tone: 'watch' },
  accepted: { tone: 'good' },
  declined: { tone: 'critical' },
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- labels for keys ----------

export function serviceAreaLabel(key) {
  return t(`serviceArea.${key}`);
}

export function qualificationLabel(key) {
  return t(`qualification.${key}`);
}

export function declineReasonLabel(key) {
  return t(`declineReason.${key}`);
}

export function talentName(talent) {
  return t(`talent.${talent.id}.name`);
}

export function talentRole(talent) {
  return t(`talent.${talent.id}.role`);
}

export function talentProfile(talent) {
  return t(`talent.${talent.id}.profile`);
}

// ---------- dates and times ----------

// "2027-03-12" is a calendar date, not an instant — parse it in local time.
function parseIsoDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(isoDate) {
  if (!isoDate) {
    return EM_DASH;
  }
  return parseIsoDate(isoDate).toLocaleDateString(locale(), {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateRange(startDate, endDate) {
  if (!startDate) {
    return EM_DASH;
  }
  return !endDate || startDate === endDate
    ? formatDate(startDate)
    : `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function formatShift(shiftStart, shiftEnd) {
  return shiftStart && shiftEnd ? `${shiftStart}–${shiftEnd}` : EM_DASH;
}

export function formatTimeOfDay(isoInstant) {
  if (!isoInstant) {
    return EM_DASH;
  }
  return new Date(isoInstant).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

// Full hours left of a deadline that started at isoInstant, never below zero
// (right after the request this reads "23 h", like a real countdown would).
export function hoursLeft(isoInstant, deadlineHours) {
  if (!isoInstant) {
    return deadlineHours;
  }
  const elapsedHours = (Date.now() - new Date(isoInstant).getTime()) / 3_600_000;
  return Math.max(0, Math.floor(deadlineHours - elapsedHours));
}

// ---------- pills and chips ----------

export function statusLabel(status) {
  return status ? t(`status.${status}`) : t('status.none');
}

export function pillHtml(label, tone, icon = null, extraClass = '') {
  const iconHtml = icon ? tablerIcon(icon, { size: 12 }) : '';
  const classes = `status-pill tone-${tone}${extraClass ? ` ${extraClass}` : ''}`;
  return `<span class="${classes}">${iconHtml}${escapeHtml(label)}</span>`;
}

export function statusPillHtml(status) {
  return status
    ? pillHtml(statusLabel(status), STATUS_META[status].tone, null, 'is-task')
    : pillHtml(statusLabel(null), 'stale');
}

export function availabilityPillHtml(availability) {
  const key = AVAILABILITY_META[availability] ? availability : 'not_requested';
  return pillHtml(t(`availability.${key}`), AVAILABILITY_META[key].tone);
}

// Qualification chips; the ones the request asks for are emphasised.
export function qualificationChipsHtml(qualifications, requested = []) {
  return `<ul class="chip-list" aria-label="${escapeHtml(t('field.qualifications'))}">${qualifications
    .map((qualification) => {
      const isRequested = requested.includes(qualification);
      return `<li class="chip${isRequested ? ' chip-match' : ''}">${escapeHtml(qualificationLabel(qualification))}</li>`;
    })
    .join('')}</ul>`;
}

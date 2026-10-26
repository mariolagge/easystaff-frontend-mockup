// Display text and value formatting. State holds raw values; every label shown for a
// status, availability or task comes from the maps below. Task names follow the To-Be
// model (docs/images/to-be-process-model.png) and GLOSSARY.md.

import { tablerIcon } from './icons.js';

export const EM_DASH = '—';

// label: badge text. task: the To-Be BPMN task(s) that lead into this status (SPEC §6).
// tone: colour family of the badge.
export const STATUS_META = {
  submitted: { label: 'Submitted', task: 'Client request received', tone: 'accent' },
  validated: { label: 'Validated', task: 'Validate requirements list', tone: 'accent' },
  availability_requested: {
    label: 'Availability requested', task: 'Search suitable talents · Request availability', tone: 'accent',
  },
  responses_complete: { label: 'Responses complete', task: 'Check availability response', tone: 'accent' },
  approval_requested: {
    label: 'Approval requested', task: 'Create final talents list · Request customer approval', tone: 'accent',
  },
  approved: { label: 'Approved', task: 'Check approval decision (yes)', tone: 'good' },
  booked: { label: 'Booked', task: 'Book talents', tone: 'good' },
  briefed: { label: 'Briefings sent', task: 'Send briefings', tone: 'good' },
  changes_requested: { label: 'Changes requested', task: 'Check approval decision (no)', tone: 'watch' },
};

// Short labels for the process-flow pills, where space is tight.
export const STATUS_SHORT_LABELS = {
  submitted: 'Submitted',
  validated: 'Validated',
  availability_requested: 'Availability',
  responses_complete: 'Responses',
  approval_requested: 'Approval',
  approved: 'Approved',
  booked: 'Booked',
  briefed: 'Briefed',
  changes_requested: 'Changes',
};

export const AVAILABILITY_META = {
  not_requested: { label: 'Not asked', tone: 'stale' },
  pending: { label: 'Pending', tone: 'watch' },
  accepted: { label: 'Accepted', tone: 'good' },
  declined: { label: 'Declined', tone: 'critical' },
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// "2027-03-12" is a calendar date, not an instant — parse it in local time.
function parseIsoDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(isoDate) {
  if (!isoDate) {
    return EM_DASH;
  }
  return parseIsoDate(isoDate).toLocaleDateString('en-GB', {
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
  return new Date(isoInstant).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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

export function statusLabel(status) {
  return status ? STATUS_META[status].label : 'No open order';
}

export function pillHtml(label, tone, icon = null) {
  const iconHtml = icon ? tablerIcon(icon, { size: 12 }) : '';
  return `<span class="status-pill tone-${tone}">${iconHtml}${escapeHtml(label)}</span>`;
}

export function statusPillHtml(status) {
  return status
    ? pillHtml(STATUS_META[status].label, STATUS_META[status].tone)
    : pillHtml('No open order', 'stale');
}

export function availabilityPillHtml(availability) {
  const meta = AVAILABILITY_META[availability] || AVAILABILITY_META.not_requested;
  return pillHtml(meta.label, meta.tone);
}

// Qualification chips; the ones the request asks for are emphasised.
export function qualificationChipsHtml(qualifications, requested = []) {
  return `<ul class="chip-list" aria-label="Qualifications">${qualifications
    .map((qualification) => {
      const isRequested = requested.includes(qualification);
      return `<li class="chip${isRequested ? ' chip-match' : ''}">${escapeHtml(qualification)}</li>`;
    })
    .join('')}</ul>`;
}

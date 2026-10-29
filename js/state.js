// The demo case: one object in localStorage (SPEC §7). Status changes happen only here,
// through transition(); page scripts call the named actions below and never edit the
// object themselves (SPEC §8). Invalid transitions are ignored and logged.
//
// Extensions to the SPEC §7 shape, all needed by the screens:
// - status is null while no request exists (dashboard empty state);
// - talent.availability also has "not_requested", so "not asked yet" differs from "asked";
// - talent.shortlisted, availabilityRequestedAt, approvalRequestedAt (deadline texts),
//   reworkCount (rework loop label in the timeline).
// - serviceArea, qualifications and declineReason hold keys, and talents carry no display
//   text: labels come from js/i18n at render time, so a language switch keeps the case.

import { TALENTS } from './seed.js';

const STORAGE_KEY = 'matchTalentsDemo';
const VERSION = 2;

// The main path of SPEC §6; changes_requested branches off approval_requested.
export const STATUSES = [
  'submitted',
  'validated',
  'availability_requested',
  'responses_complete',
  'approval_requested',
  'approved',
  'booked',
  'briefed',
];

// SPEC §6, plus availability_requested → validated when every asked talent declined.
const ALLOWED = {
  null: ['submitted'],
  submitted: ['validated'],
  validated: ['availability_requested'],
  availability_requested: ['responses_complete', 'validated'],
  responses_complete: ['approval_requested'],
  approval_requested: ['approved', 'changes_requested'],
  approved: ['booked'],
  booked: ['briefed'],
  briefed: [],
  changes_requested: ['validated'],
};

function initialState() {
  return {
    version: VERSION,
    status: null,
    request: null,
    talents: TALENTS.map(({ id, qualifications }) => ({
      id,
      qualifications: [...qualifications],
      selected: false,
      availability: 'not_requested',
      answeredAt: null,
      declineReason: null,
      shortlisted: false,
    })),
    approval: { decision: null, comment: '', decidedAt: null },
    availabilityRequestedAt: null,
    approvalRequestedAt: null,
    reworkCount: 0,
    history: [],
  };
}

// ---------- storage ----------

let storageAvailable = true;

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState();
    }
    const parsed = JSON.parse(raw);
    return parsed && parsed.version === VERSION ? parsed : initialState();
  } catch (error) {
    storageAvailable = false;
    return initialState();
  }
}

function writeStored() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    storageAvailable = false;
  }
}

let state = readStored();
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener(state));
}

function commit() {
  writeStored();
  notify();
}

// Another tab changed the case (e.g. a talent answered): reload and re-render.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY || event.key === null) {
    state = readStored();
    notify();
  }
});

export function getState() {
  return state;
}

export function isStorageAvailable() {
  return storageAvailable;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function reset() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    storageAvailable = false;
  }
  state = initialState();
  notify();
}

// ---------- transitions ----------

function nowIso() {
  return new Date().toISOString();
}

function applyTransition(to) {
  const from = state.status;
  if (!(ALLOWED[String(from)] || []).includes(to)) {
    console.warn(`Ignored invalid transition ${from} → ${to}`);
    return false;
  }
  state.status = to;
  state.history.push({ status: to, at: nowIso() });
  return true;
}

export function transition(to) {
  const ok = applyTransition(to);
  if (ok) {
    commit();
  }
  return ok;
}

function warnIgnored(action) {
  console.warn(`Ignored ${action} in status ${state.status}`);
  return false;
}

// ---------- derived values ----------

export function matchesRequest(talent, request) {
  if (!request) {
    return false;
  }
  return request.qualifications.every((qualification) => talent.qualifications.includes(qualification));
}

export function countTalents(current = state) {
  const count = (predicate) => current.talents.filter(predicate).length;
  return {
    needed: current.request ? current.request.staff : 0,
    selected: count((t) => t.selected),
    asked: count((t) => t.availability !== 'not_requested'),
    pending: count((t) => t.availability === 'pending'),
    accepted: count((t) => t.availability === 'accepted'),
    declined: count((t) => t.availability === 'declined'),
    shortlisted: count((t) => t.shortlisted),
  };
}

// Everyone asked has answered and nobody accepted: the only way on is a new search.
export function allDeclined(current = state) {
  const counts = countTalents(current);
  return current.status === 'availability_requested' && counts.asked > 0
    && counts.pending === 0 && counts.accepted === 0;
}

// Enough talents accepted, or everyone answered with at least one yes.
function completeResponsesIfReady() {
  const { needed, pending, accepted } = countTalents();
  if (accepted >= needed || (pending === 0 && accepted >= 1)) {
    applyTransition('responses_complete');
  }
}

// ---------- actions ----------

export function submitRequest(request) {
  if (state.status !== null) {
    return warnIgnored('submitRequest');
  }
  state.request = { ...request, submittedAt: nowIso() };
  // HR starts from the talents who meet every requested qualification.
  state.talents.forEach((talent) => {
    talent.selected = matchesRequest(talent, state.request);
  });
  applyTransition('submitted');
  commit();
  return true;
}

export function validateRequest() {
  return transition('validated');
}

export function setSelected(talentId, selected) {
  if (state.status !== 'validated') {
    return warnIgnored('setSelected');
  }
  const talent = state.talents.find((candidate) => candidate.id === talentId);
  if (!talent) {
    return false;
  }
  talent.selected = selected;
  commit();
  return true;
}

export function requestAvailability() {
  if (state.status !== 'validated' || countTalents().selected === 0) {
    return warnIgnored('requestAvailability');
  }
  state.talents.forEach((talent) => {
    if (talent.selected) {
      talent.availability = 'pending';
    }
  });
  state.availabilityRequestedAt = nowIso();
  applyTransition('availability_requested');
  commit();
  return true;
}

function recordAnswer(talent, availability, declineReason) {
  talent.availability = availability;
  talent.answeredAt = nowIso();
  talent.declineReason = availability === 'declined' ? (declineReason || null) : null;
}

export function answerAvailability(talentId, availability, declineReason = null) {
  const talent = state.talents.find((candidate) => candidate.id === talentId);
  if (state.status !== 'availability_requested' || !talent || talent.availability !== 'pending') {
    return warnIgnored('answerAvailability');
  }
  if (availability !== 'accepted' && availability !== 'declined') {
    return warnIgnored(`answer "${availability}"`);
  }
  recordAnswer(talent, availability, declineReason);
  completeResponsesIfReady();
  commit();
  return true;
}

// Demo helper: answers for every pending talent with the reply defined in seed.js.
export function simulateAnswers() {
  if (state.status !== 'availability_requested') {
    return warnIgnored('simulateAnswers');
  }
  state.talents.forEach((talent) => {
    if (talent.availability !== 'pending') {
      return;
    }
    const seeded = TALENTS.find((candidate) => candidate.id === talent.id);
    const answer = seeded ? seeded.simulatedAnswer : { availability: 'accepted' };
    recordAnswer(talent, answer.availability, answer.declineReason);
  });
  completeResponsesIfReady();
  commit();
  return true;
}

// The shortlist is the accepted talents in answer order, at most as many as requested.
export function createShortlistAndRequestApproval() {
  if (state.status !== 'responses_complete') {
    return warnIgnored('createShortlistAndRequestApproval');
  }
  const accepted = state.talents
    .filter((talent) => talent.availability === 'accepted')
    .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));
  const shortlistIds = new Set(accepted.slice(0, state.request.staff).map((talent) => talent.id));
  state.talents.forEach((talent) => {
    talent.shortlisted = shortlistIds.has(talent.id);
  });
  state.approval = { decision: null, comment: '', decidedAt: null };
  state.approvalRequestedAt = nowIso();
  applyTransition('approval_requested');
  commit();
  return true;
}

export function decideApproval(decision, comment = '') {
  if (state.status !== 'approval_requested') {
    return warnIgnored('decideApproval');
  }
  if (decision === 'changes_requested' && !comment.trim()) {
    return warnIgnored('request changes without a comment');
  }
  state.approval = { decision, comment: comment.trim(), decidedAt: nowIso() };
  return transition(decision);
}

export function bookTalents() {
  return transition('booked');
}

export function sendBriefings() {
  return transition('briefed');
}

// Rework loop: back to the talent search, keeping HR's selection and the client's comment.
export function searchAgain() {
  const isRework = state.status === 'changes_requested';
  if (!isRework && !allDeclined()) {
    return warnIgnored('searchAgain');
  }
  if (isRework) {
    state.reworkCount += 1;
  }
  state.talents.forEach((talent) => {
    talent.availability = 'not_requested';
    talent.answeredAt = null;
    talent.declineReason = null;
    talent.shortlisted = false;
  });
  state.availabilityRequestedAt = null;
  state.approvalRequestedAt = null;
  applyTransition('validated');
  commit();
  return true;
}

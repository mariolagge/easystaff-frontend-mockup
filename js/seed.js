// Demo data. Everything here is fictional (SPEC C6); dates are examples, not process data.
// Options and talents are stable keys; their display text lives in js/i18n/*.js.

import { t } from './i18n.js';

export const REPO_URL = 'https://github.com/mariolagge/match-talents-process-redesign.git';

export const SERVICE_AREAS = ['promotion', 'pos', 'gastro', 'hospitality', 'security', 'medical', 'hr'];

export const QUALIFICATIONS = [
  'english',
  'german',
  'event_experience',
  'food_hygiene',
  'first_aid',
  'driving_licence',
];

export const DECLINE_REASONS = ['other_assignment', 'not_available', 'too_far', 'other'];

// The SPEC §7 example request. Dates are filled in relative to today by demoRequest(),
// so the form's "start ≥ today" rule never rejects the demo data. Role and location are
// free text, so they are filled in the current language.
const DEMO_REQUEST = {
  company: 'Demo Client GmbH',
  email: 'orders@demo-client.example',
  serviceArea: 'hospitality',
  staff: 3,
  qualifications: ['english', 'event_experience'],
  shiftStart: '17:00',
  shiftEnd: '23:00',
  notes: '',
};

function isoDateInDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function demoRequest() {
  const day = isoDateInDays(14);
  return {
    ...DEMO_REQUEST,
    role: t('demo.role'),
    location: t('demo.location'),
    qualifications: [...DEMO_REQUEST.qualifications],
    startDate: day,
    endDate: day,
  };
}

// Six talents; name, role and profile are looked up by id (talent.<id>.* in js/i18n).
// D lacks event experience and F lacks English, so HR's selection matters for the demo
// request. `simulatedAnswer` is what "Simulate answers (demo)" records.
export const TALENTS = [
  {
    id: 't1', qualifications: ['english', 'german', 'event_experience'],
    simulatedAnswer: { availability: 'accepted' },
  },
  {
    id: 't2', qualifications: ['english', 'event_experience', 'first_aid'],
    simulatedAnswer: { availability: 'accepted' },
  },
  {
    id: 't3', qualifications: ['english', 'german', 'event_experience', 'food_hygiene'],
    simulatedAnswer: { availability: 'accepted' },
  },
  {
    id: 't4', qualifications: ['english', 'german', 'driving_licence'],
    simulatedAnswer: { availability: 'accepted' },
  },
  {
    id: 't5', qualifications: ['english', 'event_experience'],
    simulatedAnswer: { availability: 'declined', declineReason: 'other_assignment' },
  },
  {
    id: 't6', qualifications: ['german', 'event_experience', 'food_hygiene'],
    simulatedAnswer: { availability: 'accepted' },
  },
];

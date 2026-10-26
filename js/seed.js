// Demo data. Everything here is fictional (SPEC C6); dates are examples, not process data.

// Fill in once the repository is pushed to GitHub.
export const REPO_URL = 'https://github.com/';

export const SERVICE_AREAS = ['Promotion', 'POS', 'Gastro', 'Hospitality', 'Security', 'Medical', 'HR'];

export const QUALIFICATIONS = [
  'English',
  'German',
  'Event experience',
  'Food hygiene certificate',
  'First aid',
  'Driving licence',
];

export const DECLINE_REASONS = [
  'Other assignment',
  'Not available on this date',
  'Location too far away',
  'Other reason',
];

// The SPEC §7 example request. Dates are filled in relative to today by demoRequest(),
// so the form's "start ≥ today" rule never rejects the demo data.
const DEMO_REQUEST = {
  company: 'Demo Client GmbH',
  email: 'orders@demo-client.example',
  serviceArea: 'Hospitality',
  role: 'Event host',
  staff: 3,
  qualifications: ['English', 'Event experience'],
  location: 'Vienna',
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
  return { ...DEMO_REQUEST, qualifications: [...DEMO_REQUEST.qualifications], startDate: day, endDate: day };
}

// Six talents. D lacks event experience and F lacks English, so HR's selection matters
// for the demo request. `simulatedAnswer` is what "Simulate answers (demo)" records.
export const TALENTS = [
  {
    id: 't1', name: 'Talent A (demo)', role: 'Event host',
    qualifications: ['English', 'German', 'Event experience'],
    profile: 'Five seasons of trade-fair hosting, calm under pressure.',
    simulatedAnswer: { availability: 'accepted' },
  },
  {
    id: 't2', name: 'Talent B (demo)', role: 'Event host',
    qualifications: ['English', 'Event experience', 'First aid'],
    profile: 'Gala and conference host with first-aid training.',
    simulatedAnswer: { availability: 'accepted' },
  },
  {
    id: 't3', name: 'Talent C (demo)', role: 'Hostess / guest service',
    qualifications: ['English', 'German', 'Event experience', 'Food hygiene certificate'],
    profile: 'Guest service and catering support at large venues.',
    simulatedAnswer: { availability: 'accepted' },
  },
  {
    id: 't4', name: 'Talent D (demo)', role: 'Promoter',
    qualifications: ['English', 'German', 'Driving licence'],
    profile: 'Retail promotions; new to event work.',
    simulatedAnswer: { availability: 'accepted' },
  },
  {
    id: 't5', name: 'Talent E (demo)', role: 'Event host',
    qualifications: ['English', 'Event experience'],
    profile: 'Bilingual moderator for product launches.',
    simulatedAnswer: { availability: 'declined', declineReason: 'Other assignment' },
  },
  {
    id: 't6', name: 'Talent F (demo)', role: 'Event staff',
    qualifications: ['German', 'Event experience', 'Food hygiene certificate'],
    profile: 'Backstage and catering crew lead.',
    simulatedAnswer: { availability: 'accepted' },
  },
];

// Copied from docs/data/kpis.json → rendered.en (SPEC C7). Update by hand if that file changes.
export const KPI_TEXT = {
  cycleTimeAsIs: '6.9 working days',
  cycleTimeToBe: '3.3 working days',
  cycleTimeChange: '−52 %',
};

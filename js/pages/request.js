// Screen 1: staffing request form (client). Validates on blur and on submit (SPEC §5.1),
// shows each error next to its field and announces it, and focuses the first invalid field.

import { getState, subscribe, submitRequest } from '../state.js';
import { initLayout, renderInfoBox } from '../layout.js';
import { initTablerIcons, tablerIcon } from '../icons.js';
import { escapeHtml, formatDateRange, formatShift, statusPillHtml } from '../format.js';
import { SERVICE_AREAS, QUALIFICATIONS, demoRequest } from '../seed.js';

const NOTES_MAX = 500;
const form = document.getElementById('request-form');

function field(id) {
  return document.getElementById(id);
}

function todayIso() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function checkedQualifications() {
  return [...form.querySelectorAll('input[name="qualifications"]:checked')].map((box) => box.value);
}

// Each validator returns an error message, or '' when the value is fine.
const VALIDATORS = {
  company: () => (field('company').value.trim() ? '' : 'Enter the company name.'),
  email: () => {
    const value = field('email').value.trim();
    if (!value) {
      return 'Enter a contact e-mail.';
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid e-mail, e.g. name@company.example.';
  },
  serviceArea: () => (field('serviceArea').value ? '' : 'Choose a service area.'),
  role: () => {
    const length = field('role').value.trim().length;
    if (length === 0) {
      return 'Enter the role or job title.';
    }
    return length >= 3 && length <= 60 ? '' : 'The role must be 3–60 characters long.';
  },
  staff: () => {
    const raw = field('staff').value.trim();
    if (!raw) {
      return 'Enter the number of staff.';
    }
    const value = Number(raw);
    return Number.isInteger(value) && value >= 1 && value <= 50 ? '' : 'Enter a whole number from 1 to 50.';
  },
  qualifications: () => (checkedQualifications().length > 0 ? '' : 'Select at least one qualification.'),
  location: () => (field('location').value.trim() ? '' : 'Enter the city.'),
  startDate: () => {
    const value = field('startDate').value;
    if (!value) {
      return 'Enter a start date.';
    }
    return value >= todayIso() ? '' : 'The start date cannot be in the past.';
  },
  endDate: () => {
    const value = field('endDate').value;
    if (!value) {
      return 'Enter an end date.';
    }
    const start = field('startDate').value;
    return !start || value >= start ? '' : 'The end date must be on or after the start date.';
  },
  shiftStart: () => (field('shiftStart').value ? '' : 'Enter the shift start.'),
  shiftEnd: () => {
    const value = field('shiftEnd').value;
    if (!value) {
      return 'Enter the shift end.';
    }
    const start = field('shiftStart').value;
    return !start || value > start ? '' : 'The shift must end after it starts.';
  },
  notes: () => (field('notes').value.length <= NOTES_MAX ? '' : `Notes can be at most ${NOTES_MAX} characters.`),
};

const FIELD_ORDER = Object.keys(VALIDATORS);

// A field validated after the one it depends on changes, once the user has touched it.
const DEPENDENTS = { startDate: 'endDate', shiftStart: 'shiftEnd' };
const touched = new Set();

function showError(id, message) {
  const errorElement = field(`${id}-error`);
  errorElement.innerHTML = message
    ? `${tablerIcon('alert-triangle', { size: 14 })}<span>${escapeHtml(message)}</span>`
    : '';
  field(id).setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validateField(id) {
  const message = VALIDATORS[id]();
  showError(id, message);
  return message;
}

function clearErrors() {
  FIELD_ORDER.forEach((id) => showError(id, ''));
  field('form-summary').textContent = '';
  touched.clear();
}

function readForm() {
  return {
    company: field('company').value.trim(),
    email: field('email').value.trim(),
    serviceArea: field('serviceArea').value,
    role: field('role').value.trim(),
    staff: Number(field('staff').value),
    qualifications: checkedQualifications(),
    location: field('location').value.trim(),
    startDate: field('startDate').value,
    endDate: field('endDate').value,
    shiftStart: field('shiftStart').value,
    shiftEnd: field('shiftEnd').value,
    notes: field('notes').value.trim(),
  };
}

function fillForm(request) {
  ['company', 'email', 'serviceArea', 'role', 'staff', 'location', 'startDate', 'endDate',
    'shiftStart', 'shiftEnd', 'notes'].forEach((id) => {
    field(id).value = request[id];
  });
  form.querySelectorAll('input[name="qualifications"]').forEach((box) => {
    box.checked = request.qualifications.includes(box.value);
  });
  updateNotesCount();
  updateDateMins();
}

function updateNotesCount() {
  field('notes-count').textContent = `${field('notes').value.length} / ${NOTES_MAX} characters`;
}

function updateDateMins() {
  field('startDate').min = todayIso();
  field('endDate').min = field('startDate').value || todayIso();
}

function buildOptions() {
  field('serviceArea').insertAdjacentHTML('beforeend', SERVICE_AREAS
    .map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`).join(''));
  field('qualifications-options').innerHTML = QUALIFICATIONS.map((qualification, index) => `
    <label class="checkbox" for="qualification-${index}">
      <input type="checkbox" id="qualification-${index}" name="qualifications" value="${escapeHtml(qualification)}" />
      ${escapeHtml(qualification)}
    </label>`).join('');
}

function bindValidation() {
  // focusout bubbles, so one listener covers every input; the checkbox group is validated
  // when focus leaves the whole fieldset.
  form.addEventListener('focusout', (event) => {
    const target = event.target;
    const group = target.closest('#qualifications');
    if (group) {
      if (!group.contains(event.relatedTarget)) {
        touched.add('qualifications');
        validateField('qualifications');
      }
      return;
    }
    if (!VALIDATORS[target.id]) {
      return;
    }
    touched.add(target.id);
    validateField(target.id);
    const dependent = DEPENDENTS[target.id];
    if (dependent && touched.has(dependent)) {
      validateField(dependent);
    }
  });

  form.addEventListener('change', (event) => {
    if (event.target.name === 'qualifications' && touched.has('qualifications')) {
      validateField('qualifications');
    }
    if (event.target.id === 'startDate') {
      updateDateMins();
    }
  });

  field('notes').addEventListener('input', updateNotesCount);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = FIELD_ORDER.filter((id) => validateField(id));
    FIELD_ORDER.forEach((id) => touched.add(id));
    if (invalid.length > 0) {
      field('form-summary').textContent = invalid.length === 1
        ? '1 field needs attention.'
        : `${invalid.length} fields need attention.`;
      const first = field(invalid[0]);
      (first.tagName === 'FIELDSET' ? first.querySelector('input') : first).focus();
      return;
    }
    field('form-summary').textContent = '';
    if (submitRequest(readForm())) {
      render({ justSubmitted: true });
    }
  });

  field('fill-demo-btn').addEventListener('click', () => {
    clearErrors();
    fillForm(demoRequest());
    field('form-summary').textContent = 'Demo data filled in. Check it and submit.';
  });
}

function renderSummary(request) {
  const rows = [
    ['Company', request.company],
    ['Contact e-mail', request.email],
    ['Service area', request.serviceArea],
    ['Role', request.role],
    ['Number of staff', String(request.staff)],
    ['Location', request.location],
    ['Date', formatDateRange(request.startDate, request.endDate)],
    ['Shift', formatShift(request.shiftStart, request.shiftEnd)],
    ['Qualifications', request.qualifications.join(', ')],
    ['Notes', request.notes || '—'],
  ];
  field('request-summary').innerHTML = rows
    .map(([label, value]) => `<div class="data-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('');
}

function render({ justSubmitted = false } = {}) {
  const { status, request } = getState();
  const hasRequest = status !== null && request;
  field('request-form-card').hidden = Boolean(hasRequest);
  field('request-summary-card').hidden = !hasRequest;
  if (!hasRequest) {
    field('request-confirmation').hidden = true;
    return;
  }
  renderSummary(request);
  field('summary-status').innerHTML = statusPillHtml(status);
  if (justSubmitted) {
    field('request-confirmation').hidden = false;
    field('summary-title').focus();
  }
}

initLayout('request');
renderInfoBox(field('info-box'), {
  replaces: '“Create requirements list” — Sales copies the client\'s e-mail into the CRM.',
  solves: 'Manual handover and incomplete requirements.',
  tasks: 'Client submits → HR “Validate requirements list”.',
});
buildOptions();
updateDateMins();
bindValidation();
initTablerIcons();
render();

// Another tab may reset the demo or submit; only toggle the views, never rebuild the form.
subscribe(() => {
  if (getState().status === null) {
    form.reset();
    clearErrors();
    updateNotesCount();
  }
  render();
});

// Screen 1: staffing request form (client). Validates on blur and on submit (SPEC §5.1),
// shows each error next to its field and announces it, and focuses the first invalid field.

import { getState, subscribe, submitRequest } from '../state.js';
import { initLayout, renderInfoBox } from '../layout.js';
import { initTablerIcons, tablerIcon } from '../icons.js';
import {
  escapeHtml, formatDateRange, formatShift, statusPillHtml, serviceAreaLabel, qualificationLabel,
} from '../format.js';
import { SERVICE_AREAS, QUALIFICATIONS, demoRequest } from '../seed.js';
import { t, tPlural, onLangChange } from '../i18n.js';

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

// Each validator returns the key of an error message, or '' when the value is fine.
const VALIDATORS = {
  company: () => (field('company').value.trim() ? '' : 'error.company.required'),
  email: () => {
    const value = field('email').value.trim();
    if (!value) {
      return 'error.email.required';
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'error.email.invalid';
  },
  serviceArea: () => (field('serviceArea').value ? '' : 'error.serviceArea.required'),
  role: () => {
    const length = field('role').value.trim().length;
    if (length === 0) {
      return 'error.role.required';
    }
    return length >= 3 && length <= 60 ? '' : 'error.role.length';
  },
  staff: () => {
    const raw = field('staff').value.trim();
    if (!raw) {
      return 'error.staff.required';
    }
    const value = Number(raw);
    return Number.isInteger(value) && value >= 1 && value <= 50 ? '' : 'error.staff.range';
  },
  qualifications: () => (checkedQualifications().length > 0 ? '' : 'error.qualifications.required'),
  location: () => (field('location').value.trim() ? '' : 'error.location.required'),
  startDate: () => {
    const value = field('startDate').value;
    if (!value) {
      return 'error.startDate.required';
    }
    return value >= todayIso() ? '' : 'error.startDate.past';
  },
  endDate: () => {
    const value = field('endDate').value;
    if (!value) {
      return 'error.endDate.required';
    }
    const start = field('startDate').value;
    return !start || value >= start ? '' : 'error.endDate.beforeStart';
  },
  shiftStart: () => (field('shiftStart').value ? '' : 'error.shiftStart.required'),
  shiftEnd: () => {
    const value = field('shiftEnd').value;
    if (!value) {
      return 'error.shiftEnd.required';
    }
    const start = field('shiftStart').value;
    return !start || value > start ? '' : 'error.shiftEnd.beforeStart';
  },
  notes: () => (field('notes').value.length <= NOTES_MAX ? '' : 'error.notes.tooLong'),
};

const FIELD_ORDER = Object.keys(VALIDATORS);

// A field validated after the one it depends on changes, once the user has touched it.
const DEPENDENTS = { startDate: 'endDate', shiftStart: 'shiftEnd' };
const touched = new Set();

// The error key shown per field and the form summary, kept so a language switch can
// re-render them without validating again.
const shownErrors = {};
let formSummary = null;

function showError(id, key) {
  shownErrors[id] = key;
  const errorElement = field(`${id}-error`);
  errorElement.innerHTML = key
    ? `${tablerIcon('alert-triangle', { size: 14 })}<span>${escapeHtml(t(key, { max: NOTES_MAX }))}</span>`
    : '';
  field(id).setAttribute('aria-invalid', key ? 'true' : 'false');
}

function validateField(id) {
  const key = VALIDATORS[id]();
  showError(id, key);
  return key;
}

function setFormSummary(summary) {
  formSummary = summary;
  let text = '';
  if (summary && summary.count !== undefined) {
    text = tPlural(summary.key, summary.count);
  } else if (summary) {
    text = t(summary.key);
  }
  field('form-summary').textContent = text;
}

function clearErrors() {
  FIELD_ORDER.forEach((id) => showError(id, ''));
  setFormSummary(null);
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
  field('notes-count').textContent = t('request.notesCount', { count: field('notes').value.length, max: NOTES_MAX });
}

function updateDateMins() {
  field('startDate').min = todayIso();
  field('endDate').min = field('startDate').value || todayIso();
}

// Options carry keys as values; their labels use data-i18n, so a language switch relabels
// them in place and the user's choices survive.
function buildOptions() {
  field('serviceArea').insertAdjacentHTML('beforeend', SERVICE_AREAS
    .map((area) => `<option value="${escapeHtml(area)}" data-i18n="serviceArea.${escapeHtml(area)}">${escapeHtml(serviceAreaLabel(area))}</option>`)
    .join(''));
  field('qualifications-options').innerHTML = QUALIFICATIONS.map((qualification, index) => `
    <label class="checkbox" for="qualification-${index}">
      <input type="checkbox" id="qualification-${index}" name="qualifications" value="${escapeHtml(qualification)}" />
      <span data-i18n="qualification.${escapeHtml(qualification)}">${escapeHtml(qualificationLabel(qualification))}</span>
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
      setFormSummary({ key: 'request.invalidCount', count: invalid.length });
      const first = field(invalid[0]);
      (first.tagName === 'FIELDSET' ? first.querySelector('input') : first).focus();
      return;
    }
    setFormSummary(null);
    if (submitRequest(readForm())) {
      render({ justSubmitted: true });
    }
  });

  field('fill-demo-btn').addEventListener('click', () => {
    clearErrors();
    fillForm(demoRequest());
    setFormSummary({ key: 'request.demoFilled' });
  });
}

function renderSummary(request) {
  const rows = [
    [t('field.company'), request.company],
    [t('field.email'), request.email],
    [t('field.serviceArea'), serviceAreaLabel(request.serviceArea)],
    [t('field.role'), request.role],
    [t('field.staff'), String(request.staff)],
    [t('field.location'), request.location],
    [t('field.date'), formatDateRange(request.startDate, request.endDate)],
    [t('field.shift'), formatShift(request.shiftStart, request.shiftEnd)],
    [t('field.qualifications'), request.qualifications.map(qualificationLabel).join(', ')],
    [t('field.notes'), request.notes || '—'],
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
renderInfoBox(field('info-box'), 'request');
buildOptions();
updateDateMins();
updateNotesCount();
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

// The static labels and options are relabelled by data-i18n; typed input stays as it is.
onLangChange(() => {
  FIELD_ORDER.filter((id) => shownErrors[id]).forEach((id) => showError(id, shownErrors[id]));
  setFormSummary(formSummary);
  updateNotesCount();
  render();
});

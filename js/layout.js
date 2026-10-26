// Chrome shared by every page: header with the case status, the concept banner (SPEC C5),
// the role switcher (a demo device, not a login — SPEC §4) and the "Replaces / Solves" box.

import { getState, subscribe, isStorageAvailable } from './state.js';
import { tablerIcon, initTablerIcons } from './icons.js';
import { escapeHtml, statusPillHtml } from './format.js';

const NAV_ITEMS = [
  { page: 'start', href: 'index.html', role: 'Demo', label: 'Start', icon: 'home' },
  { page: 'request', href: 'request.html', role: 'Client', label: 'Request', icon: 'briefcase' },
  { page: 'availability', href: 'availability.html', role: 'Talent', label: 'Availability', icon: 'device-mobile' },
  { page: 'approval', href: 'approval.html', role: 'Client', label: 'Approval', icon: 'clipboard-check' },
  { page: 'dashboard', href: 'dashboard.html', role: 'HR', label: 'Dashboard', icon: 'layout-dashboard' },
];

// Which screen has the next move, so the viewer always knows where to click.
const NEXT_PAGE_BY_STATUS = {
  null: 'request',
  submitted: 'dashboard',
  validated: 'dashboard',
  availability_requested: 'availability',
  responses_complete: 'dashboard',
  approval_requested: 'approval',
  approved: 'dashboard',
  booked: 'dashboard',
  briefed: null,
  changes_requested: 'dashboard',
};

export function nextPage(status) {
  return NEXT_PAGE_BY_STATUS[String(status)];
}

export function pageHref(page) {
  return NAV_ITEMS.find((item) => item.page === page).href;
}

function navHtml(currentPage, status) {
  const next = nextPage(status);
  return NAV_ITEMS.map((item) => {
    const current = item.page === currentPage ? ' aria-current="page"' : '';
    const isNext = item.page === next && item.page !== currentPage;
    const nextMarker = isNext
      ? '<span class="nav-next-dot" aria-hidden="true"></span><span class="sr-only"> (next step)</span>'
      : '';
    return `
      <li>
        <a class="nav-link${isNext ? ' is-next' : ''}" href="${item.href}"${current}>
          ${tablerIcon(item.icon, { size: 15 })}
          <span class="nav-role">${escapeHtml(item.role)}</span>
          <span class="nav-label">${escapeHtml(item.label)}</span>
          ${nextMarker}
        </a>
      </li>`;
  }).join('');
}

function renderChrome(currentPage) {
  const { status } = getState();
  document.getElementById('header-status').innerHTML = statusPillHtml(status);
  document.getElementById('role-nav-list').innerHTML = navHtml(currentPage, status);
}

export function showNotice(message) {
  const placeholder = document.getElementById('notice-placeholder');
  placeholder.innerHTML = `
    <div class="alert alert-watch" role="status">
      ${tablerIcon('info-circle', { size: 16 })}
      <span>${escapeHtml(message)}</span>
    </div>`;
}

export function initLayout(currentPage) {
  const header = document.getElementById('site-header');
  header.innerHTML = `
    <div class="concept-banner">
      ${tablerIcon('info-circle', { size: 14 })}
      <span><strong>Concept mockup – no real data.</strong>
      <a href="index.html#disclaimer">Read the disclaimer</a></span>
    </div>
    <div class="header-bar">
      <a class="brand" href="index.html">
        <span class="logo">${tablerIcon('users', { size: 14 })}</span>
        <span class="brand-text">Match Talents Platform</span>
      </a>
      <div class="header-meta">
        <span class="header-meta-label">Demo order</span>
        <span id="header-status" aria-live="polite"></span>
      </div>
    </div>
    <nav class="role-nav" aria-label="Switch role (demo)">
      <ul id="role-nav-list"></ul>
    </nav>
    <div id="notice-placeholder"></div>`;

  renderChrome(currentPage);
  subscribe(() => renderChrome(currentPage));
  initTablerIcons();

  if (!isStorageAvailable()) {
    showNotice('Your browser blocks local storage. The demo still works, but only within this page — reloading or switching screens starts over.');
  }
}

// SPEC §5: every screen names the BPMN task it replaces and the pain point it solves.
export function renderInfoBox(element, { replaces, solves, tasks }) {
  element.classList.add('info-box');
  element.setAttribute('aria-label', 'What this screen replaces');
  element.innerHTML = `
    <div class="info-box-icon">${tablerIcon('mail-off', { size: 20 })}</div>
    <dl class="info-box-list">
      <div><dt>Replaces</dt><dd>${escapeHtml(replaces)}</dd></div>
      <div><dt>Solves</dt><dd>${escapeHtml(solves)}</dd></div>
      <div><dt>To-Be tasks</dt><dd>${escapeHtml(tasks)}</dd></div>
    </dl>`;
}

// A friendly "not yet" panel for screens opened out of order.
export function waitingStateHtml({ icon = 'clock', title, text, linkPage, linkLabel }) {
  const link = linkPage
    ? `<a class="btn btn-primary" href="${pageHref(linkPage)}">${escapeHtml(linkLabel)} ${tablerIcon('arrow-right', { size: 15 })}</a>`
    : '';
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${tablerIcon(icon, { size: 28 })}</div>
      <h2 class="empty-state-title">${escapeHtml(title)}</h2>
      <p class="empty-state-text">${escapeHtml(text)}</p>
      ${link}
    </div>`;
}

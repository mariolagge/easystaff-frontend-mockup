// Chrome shared by every page: the concept banner (SPEC C5), the role switcher (a demo
// device, not a login — SPEC §4), the EN | DE language switch (SPEC C3) and the
// "Replaces / Solves" box.

import { getState, subscribe, isStorageAvailable } from './state.js';
import { tablerIcon, initTablerIcons } from './icons.js';
import { escapeHtml } from './format.js';
import { REPO_URL } from './seed.js';
import { t, getLang, setLang, onLangChange, applyStatic } from './i18n.js';

const NAV_ITEMS = [
  { page: 'start', href: 'index.html', role: 'demo', icon: 'home' },
  { page: 'request', href: 'request.html', role: 'client', icon: 'briefcase' },
  { page: 'availability', href: 'availability.html', role: 'talent', icon: 'device-mobile' },
  { page: 'approval', href: 'approval.html', role: 'client', icon: 'clipboard-check' },
  { page: 'dashboard', href: 'dashboard.html', role: 'hr', icon: 'layout-dashboard' },
];

// Each language is named in itself, so the switch reads the same in both.
const LANGUAGES = [
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'de', short: 'DE', name: 'Deutsch' },
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
      ? `<span class="nav-next-dot" aria-hidden="true"></span><span class="sr-only">${escapeHtml(t('layout.nextStep'))}</span>`
      : '';
    return `
      <li>
        <a class="nav-link${isNext ? ' is-next' : ''}" href="${item.href}"${current}>
          ${tablerIcon(item.icon, { size: 15 })}
          <span class="nav-role">${escapeHtml(t(`nav.role.${item.role}`))}</span>
          <span class="nav-label">${escapeHtml(t(`nav.${item.page}`))}</span>
          ${nextMarker}
        </a>
      </li>`;
  }).join('');
}

function langSwitchHtml() {
  return LANGUAGES.map(({ code, short, name }) => `
    <button type="button" class="lang-btn" data-lang="${code}" lang="${code}" title="${name}"
      aria-pressed="${code === getLang()}">${short}</button>`).join('');
}

function renderChrome(currentPage) {
  const { status } = getState();
  document.getElementById('role-nav-list').innerHTML = navHtml(currentPage, status);
  document.getElementById('lang-switch').innerHTML = langSwitchHtml();
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
      <span><strong data-i18n="layout.banner"></strong>
      <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer" data-i18n="layout.bannerLink"></a></span>
    </div>
    <div class="site-nav-row">
      <nav class="role-nav" data-i18n-attr="aria-label:layout.navLabel">
        <ul id="role-nav-list"></ul>
      </nav>
      <div class="lang-switch" id="lang-switch" role="group" data-i18n-attr="aria-label:layout.langLabel"></div>
    </div>
    <div id="notice-placeholder"></div>`;
  applyStatic(header);

  document.getElementById('lang-switch').addEventListener('click', (event) => {
    const button = event.target.closest('[data-lang]');
    if (button) {
      setLang(button.dataset.lang);
      document.querySelector(`#lang-switch [data-lang="${button.dataset.lang}"]`).focus();
    }
  });

  renderChrome(currentPage);
  subscribe(() => renderChrome(currentPage));
  onLangChange(() => renderChrome(currentPage));
  initTablerIcons();

  if (!isStorageAvailable()) {
    showNotice(t('layout.storageNotice'));
    onLangChange(() => showNotice(t('layout.storageNotice')));
  }
}

// SPEC §5: every screen names the BPMN task it replaces and the pain point it solves.
// The texts are info.<page>.replaces / .solves / .tasks in js/i18n.
export function renderInfoBox(element, page) {
  const render = () => {
    element.setAttribute('aria-label', t('info.label'));
    element.innerHTML = `
      <div class="info-box-icon">${tablerIcon('mail-off', { size: 20 })}</div>
      <dl class="info-box-list">
        <div><dt>${escapeHtml(t('info.replaces'))}</dt><dd>${escapeHtml(t(`info.${page}.replaces`))}</dd></div>
        <div><dt>${escapeHtml(t('info.solves'))}</dt><dd>${escapeHtml(t(`info.${page}.solves`))}</dd></div>
        <div><dt>${escapeHtml(t('info.tasks'))}</dt><dd>${escapeHtml(t(`info.${page}.tasks`))}</dd></div>
      </dl>`;
  };
  element.classList.add('info-box');
  render();
  onLangChange(render);
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

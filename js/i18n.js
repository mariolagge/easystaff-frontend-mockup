// UI language (SPEC C3): German by default, English on request. The choice has its own
// localStorage key, so "Reset demo" keeps it and other tabs follow a switch.
//
// Static HTML is translated through attributes, applied on load and on every switch:
// - data-i18n="key"       textContent
// - data-i18n-html="key"  innerHTML (only for dictionary strings with inline markup)
// - data-i18n-attr="aria-label:key;content:key"  attributes
// Scripts call t() / tPlural() and re-render through onLangChange().

import en from './i18n/en.js';
import de from './i18n/de.js';

const LANG_KEY = 'matchTalentsLang';
const DEFAULT_LANG = 'de';
const DICTIONARIES = { en, de };
const LOCALES = { de: 'de-DE', en: 'en-GB' };

function readLang() {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    return DICTIONARIES[stored] ? stored : DEFAULT_LANG;
  } catch (error) {
    return DEFAULT_LANG;
  }
}

let lang = readLang();
const listeners = new Set();

export function getLang() {
  return lang;
}

export function locale() {
  return LOCALES[lang];
}

// "{name}" placeholders are filled from params; unknown ones stay visible.
export function t(key, params = {}) {
  let text = DICTIONARIES[lang][key];
  if (text === undefined) {
    console.warn(`Missing ${lang} text for "${key}"`);
    text = en[key] ?? key;
  }
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

// Count-dependent text: the dictionary holds "key.one" and "key.other"; {count} is filled in.
export function tPlural(key, count, params = {}) {
  const form = new Intl.PluralRules(locale()).select(count) === 'one' ? 'one' : 'other';
  return t(`${key}.${form}`, { count, ...params });
}

export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-html]').forEach((node) => {
    node.innerHTML = t(node.dataset.i18nHtml);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((node) => {
    node.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attribute, key] = pair.split(':').map((part) => part.trim());
      node.setAttribute(attribute, t(key));
    });
  });
}

function applyLang() {
  document.documentElement.lang = lang;
  applyStatic();
  listeners.forEach((listener) => listener(lang));
}

export function setLang(next) {
  if (!DICTIONARIES[next] || next === lang) {
    return;
  }
  lang = next;
  try {
    window.localStorage.setItem(LANG_KEY, next);
  } catch (error) {
    // Storage blocked: the switch still applies to this page.
  }
  applyLang();
}

export function onLangChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Another tab switched the language. The state store's listener ignores this key.
window.addEventListener('storage', (event) => {
  if (event.key === LANG_KEY || event.key === null) {
    const next = readLang();
    if (next !== lang) {
      lang = next;
      applyLang();
    }
  }
});

// Module scripts run after parsing, so the static text can be translated right away.
document.documentElement.lang = lang;
applyStatic();

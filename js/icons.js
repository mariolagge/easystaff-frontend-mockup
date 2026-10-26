// Tabler Icons (outline, 24x24, stroke-width 2) inlined as path data — no CDN, no build step.
// Path data is copied verbatim from @tabler/icons 3.31.0 outline SVGs. To add an icon,
// copy the <path d="..."> values of the outline SVG here (skip the transparent
// "M0 0h24v24H0z" background path) — never hand-draw path data.
// Only icons the markup actually references are kept.

const TABLER_PATHS = {
  // Roles (SPEC §4)
  users: [
    'M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
    'M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2',
    'M16 3.13a4 4 0 0 1 0 7.75',
    'M21 21v-2a4 4 0 0 0 -3 -3.85',
  ],
  user: [
    'M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0',
    'M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2',
  ],
  briefcase: [
    'M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z',
    'M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2',
    'M12 12l0 .01',
    'M3 13a20 20 0 0 0 18 0',
  ],
  'device-mobile': [
    'M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14z',
    'M11 4h2',
    'M12 17v.01',
  ],
  'layout-dashboard': [
    'M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1',
    'M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1',
    'M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1',
    'M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1',
  ],
  'clipboard-check': [
    'M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2',
    'M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z',
    'M9 14l2 2l4 -4',
  ],

  // Order facts
  calendar: [
    'M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z',
    'M16 3v4',
    'M8 3v4',
    'M4 11h16',
    'M11 15h1',
    'M12 15v3',
  ],
  'map-pin': [
    'M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0',
    'M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z',
  ],
  certificate: [
    'M15 15m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
    'M13 17.5v4.5l2 -1.5l2 1.5v-4.5',
    'M10 19h-5a2 2 0 0 1 -2 -2v-10c0 -1.1 .9 -2 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -1 1.73',
    'M6 9l12 0',
    'M6 12l3 0',
    'M6 15l2 0',
  ],
  clock: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 7v5l3 3'],

  // Status and feedback
  'circle-check': [
    'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0',
    'M9 12l2 2l4 -4',
  ],
  'alert-triangle': [
    'M12 9v4',
    'M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z',
    'M12 16h.01',
  ],
  'info-circle': [
    'M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0',
    'M12 9h.01',
    'M11 12h1v4h1',
  ],
  'mail-off': [
    'M9 5h10a2 2 0 0 1 2 2v10m-2 2h-14a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2',
    'M3 7l9 6l.565 -.377m2.435 -1.623l6 -4',
    'M3 3l18 18',
  ],

  // Chrome and actions
  home: [
    'M5 12l-2 0l9 -9l9 9l-2 0',
    'M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7',
    'M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6',
  ],
  send: [
    'M10 14l11 -11',
    'M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5',
  ],
  check: ['M5 12l5 5l10 -10'],
  'arrow-right': ['M5 12l14 0', 'M13 18l6 -6', 'M13 6l6 6'],
  'rotate-clockwise': ['M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5'],
  history: ['M12 8l0 4l2 2', 'M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5'],
  refresh: [
    'M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4',
    'M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4',
  ],
  'chevron-right': ['M9 6l6 6l-6 6'],
  x: ['M18 6l-12 12', 'M6 6l12 12'],
};

export function tablerIcon(name, { size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 } = {}) {
  const paths = TABLER_PATHS[name];
  if (!paths) {
    return '';
  }
  const pathEls = paths.map((d) => `<path d="${d}" />`).join('');
  const extraClass = className ? ` ${className}` : '';
  return `<svg class="tabler-icon${extraClass}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${pathEls}</svg>`;
}

// Static markup marks icon slots with data-tabler-icon; this fills them once per page.
export function initTablerIcons(root = document) {
  root.querySelectorAll('[data-tabler-icon]').forEach((el) => {
    el.innerHTML = tablerIcon(el.dataset.tablerIcon, {
      size: Number(el.dataset.tablerSize) || 24,
      stroke: el.dataset.tablerStroke || 'currentColor',
      strokeWidth: Number(el.dataset.tablerStrokeWidth) || 2,
    });
  });
}

// Tabler Icons (outline, 24x24, stroke-width 2) inlined as path data — no CDN, no build step.
// Path data is copied verbatim from @tabler/icons 3.31.0 outline SVGs. To add an icon,
// copy the <path d="..."> values of the outline SVG here (skip the transparent
// "M0 0h24v24H0z" background path) — never hand-draw path data.
// Only icons the markup actually references are kept.

const TABLER_PATHS = {
  // Assets (GLOSSARY §2)
  tractor: [
    'M7 15m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
    'M7 15l0 .01',
    'M19 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    'M10.5 17l6.5 0',
    'M20 15.2v-4.2a1 1 0 0 0 -1 -1h-6l-2 -5h-6v6.5',
    'M18 5h-1a1 1 0 0 0 -1 1v4',
  ],
  blade: [
    'M17.707 3.707l2.586 2.586a1 1 0 0 1 0 1.414l-.586 .586a1 1 0 0 0 0 1.414l.586 .586a1 1 0 0 1 0 1.414l-8.586 8.586a1 1 0 0 1 -1.414 0l-.586 -.586a1 1 0 0 0 -1.414 0l-.586 .586a1 1 0 0 1 -1.414 0l-2.586 -2.586a1 1 0 0 1 0 -1.414l.586 -.586a1 1 0 0 0 0 -1.414l-.586 -.586a1 1 0 0 1 0 -1.414l8.586 -8.586a1 1 0 0 1 1.414 0l.586 .586a1 1 0 0 0 1.414 0l.586 -.586a1 1 0 0 1 1.414 0z',
    'M8 16l3.2 -3.2',
    'M12.8 11.2l3.2 -3.2',
    'M14 8l2 2',
    'M8 14l2 2',
    'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  ],
  barrel: [
    'M7.278 4h9.444a2 2 0 0 1 1.841 1.22c.958 2.26 1.437 4.52 1.437 6.78c0 2.26 -.479 4.52 -1.437 6.78a2 2 0 0 1 -1.841 1.22h-9.444a2 2 0 0 1 -1.841 -1.22c-.958 -2.26 -1.437 -4.52 -1.437 -6.78c0 -2.26 .479 -4.52 1.437 -6.78a2 2 0 0 1 1.841 -1.22z',
    'M14 4c.667 2.667 1 5.333 1 8s-.333 5.333 -1 8',
    'M10 4c-.667 2.667 -1 5.333 -1 8s.333 5.333 1 8',
    'M4.5 16h15',
    'M19.5 8h-15',
  ],
  blender: [
    'M9 10h-3a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h10.802a1 1 0 0 1 .984 1.179l-1.786 9.821',
    'M8 4l2 11',
    'M11 15h4a3 3 0 0 1 3 3v2a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-2a3 3 0 0 1 3 -3z',
    'M12 4v-1h2v1',
    'M13 18v.01',
  ],

  // Status and live condition (GLOSSARY §6)
  'circle-check': [
    'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0',
    'M9 12l2 2l4 -4',
  ],
  'alert-triangle': [
    'M12 9v4',
    'M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z',
    'M12 16h.01',
  ],
  'alert-octagon': [
    'M12.802 2.165l5.575 2.389c.48 .206 .863 .589 1.07 1.07l2.388 5.574c.22 .512 .22 1.092 0 1.604l-2.389 5.575c-.206 .48 -.589 .863 -1.07 1.07l-5.574 2.388c-.512 .22 -1.092 .22 -1.604 0l-5.575 -2.389a2.036 2.036 0 0 1 -1.07 -1.07l-2.388 -5.574a2.036 2.036 0 0 1 0 -1.604l2.389 -5.575c.206 -.48 .589 -.863 1.07 -1.07l5.574 -2.388a2.036 2.036 0 0 1 1.604 0z',
    'M12 8v4',
    'M12 16h.01',
  ],

  // Flags (GLOSSARY §5)
  weight: [
    'M12 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
    'M6.835 9h10.33a1 1 0 0 1 .984 .821l1.637 9a1 1 0 0 1 -.984 1.179h-13.604a1 1 0 0 1 -.984 -1.179l1.637 -9a1 1 0 0 1 .984 -.821z',
  ],
  flame: [
    'M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235',
  ],
  activity: [
    'M3 12h4l3 8l4 -16l3 8h4',
  ],
  hourglass: [
    'M6.5 7h11',
    'M6.5 17h11',
    'M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z',
    'M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z',
  ],

  // Counter scopes (GLOSSARY §4) and derived figures
  clock: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 7v5l3 3'],
  gauge: [
    'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0',
    'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
    'M13.41 10.59l2.59 -2.59',
    'M7 12a5 5 0 0 1 5 -5',
  ],

  // Chrome
  tool: [
    'M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5',
  ],
  'chart-bar': [
    'M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z',
    'M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z',
    'M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z',
    'M4 20h14',
  ],
  history: ['M12 8l0 4l2 2', 'M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5'],
  refresh: [
    'M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4',
    'M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4',
  ],
  download: ['M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2', 'M7 11l5 5l5 -5', 'M12 4l0 12'],
  'chevron-right': ['M9 6l6 6l-6 6'],
  x: ['M18 6l-12 12', 'M6 6l12 12'],
};

function tablerIcon(name, { size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 } = {}) {
  const paths = TABLER_PATHS[name];
  if (!paths) {
    return '';
  }
  const pathEls = paths.map((d) => `<path d="${d}" />`).join('');
  const extraClass = className ? ` ${className}` : '';
  return `<svg class="tabler-icon${extraClass}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${pathEls}</svg>`;
}

function mountTablerIcon(el, name, { size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 } = {}) {
  const paths = TABLER_PATHS[name];
  if (!paths) {
    return;
  }

  if (el.namespaceURI === 'http://www.w3.org/2000/svg') {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', stroke);
    svg.setAttribute('stroke-width', String(strokeWidth));
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.classList.add('tabler-icon');
    if (className) {
      className.split(' ').filter(Boolean).forEach((cls) => svg.classList.add(cls));
    }

    paths.forEach((d) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    el.appendChild(svg);
    return;
  }

  el.innerHTML = tablerIcon(name, { size, stroke, strokeWidth, className });
}

function initTablerIcons() {
  document.querySelectorAll('[data-tabler-icon]').forEach((el) => {
    const name = el.dataset.tablerIcon;
    const size = Number(el.dataset.tablerSize) || 24;
    const stroke = el.dataset.tablerStroke || 'currentColor';
    const strokeWidth = Number(el.dataset.tablerStrokeWidth) || 2;
    const className = el.dataset.tablerClass || '';
    mountTablerIcon(el, name, { size, stroke, strokeWidth, className });
  });
}


// Order status flow (SVG + text list), shared by the start page and the case dashboard.
// Both pages provide #flow-wrap and #flow-list; buildFlow() runs once, renderFlow() on
// every state change.

import { STATUSES } from './state.js';
import { STATUS_META, escapeHtml } from './format.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BRANCH_STATUS = 'changes_requested';
const BRANCH_PARENT_INDEX = STATUSES.indexOf('approval_requested');
const REWORK_TARGET_INDEX = STATUSES.indexOf('validated');

// Built once from STATUSES, like the example's static node groups; render only toggles
// classes. Each pill carries its BPMN task name, with the step number above that text.

const FLOW = {
  width: 1280,
  height: 250,
  rowY: 62,
  branchY: 186,
  firstX: 84,
  lastX: 1196,
  pillW: 152,
  pillH: 88,
  pillRx: 28,
};

// Each BPMN task is its own line. The approval gateway splits on the yes/no phrase
// so "(yes)" and "(no)" stay readable inside the outline.
const FLOW_LINES = {
  submitted: ['Client request received'],
  validated: ['Validate requirements list'],
  availability_requested: ['Search suitable talents', 'Request availability'],
  responses_complete: ['Check availability response'],
  approval_requested: ['Create final talents list', 'Request customer approval'],
  approved: ['Check approval', 'decision (yes)'],
  booked: ['Book talents'],
  briefed: ['Send briefings'],
  changes_requested: ['Check approval', 'decision (no)'],
};

function el(id) {
  return document.getElementById(id);
}

function nodeX(index) {
  return FLOW.firstX + (index * (FLOW.lastX - FLOW.firstX)) / (STATUSES.length - 1);
}

function svgEl(tag, attrs = {}, text = null) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  if (text !== null) {
    node.textContent = text;
  }
  return node;
}

function flowNode(status, index, x, y) {
  const half = FLOW.pillW / 2;
  const lines = FLOW_LINES[status];
  const badge = 22;
  const lineHeight = 13.5;
  const gap = 6;
  const block = badge + gap + lines.length * lineHeight;
  const badgeY = -block / 2;

  const group = svgEl('g', { class: 'flow-node', 'data-status': status, transform: `translate(${x}, ${y})` });
  group.appendChild(svgEl('title', {}, STATUS_META[status].task));
  group.appendChild(svgEl('rect', {
    class: 'node-ring',
    x: -half - 6,
    y: -FLOW.pillH / 2 - 6,
    width: FLOW.pillW + 12,
    height: FLOW.pillH + 12,
    rx: FLOW.pillRx + 6,
  }));
  group.appendChild(svgEl('rect', {
    class: 'node-bg',
    x: -half,
    y: -FLOW.pillH / 2,
    width: FLOW.pillW,
    height: FLOW.pillH,
    rx: FLOW.pillRx,
  }));
  group.appendChild(svgEl('rect', {
    class: 'node-badge',
    x: -badge / 2,
    y: badgeY,
    width: badge,
    height: badge,
    rx: 6,
  }));
  group.appendChild(svgEl('text', {
    class: 'node-num',
    x: 0,
    y: badgeY + badge / 2,
  }, index === null ? '!' : String(index + 1)));

  lines.forEach((line, lineIndex) => {
    group.appendChild(svgEl('text', {
      class: 'node-task',
      x: 0,
      y: badgeY + badge + gap + lineHeight / 2 + lineIndex * lineHeight,
    }, line));
  });
  return group;
}

export function buildFlow() {
  const svg = svgEl('svg', {
    class: 'flow-svg', viewBox: `0 0 ${FLOW.width} ${FLOW.height}`, 'aria-hidden': 'true', focusable: 'false',
  });

  const defs = svgEl('defs');
  const marker = svgEl('marker', {
    id: 'arrow-rework', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse',
  });
  marker.appendChild(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'var(--watch)' }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  const half = FLOW.pillW / 2;
  STATUSES.slice(0, -1).forEach((status, index) => {
    svg.appendChild(svgEl('line', {
      class: 'flow-link', 'data-link': index,
      x1: nodeX(index) + half, y1: FLOW.rowY, x2: nodeX(index + 1) - half, y2: FLOW.rowY,
    }));
  });

  // Rework: approval → changes requested (down), then back to validated (left and up).
  const branchX = nodeX(BRANCH_PARENT_INDEX);
  const targetX = nodeX(REWORK_TARGET_INDEX);
  const bottom = FLOW.rowY + FLOW.pillH / 2;
  svg.appendChild(svgEl('path', {
    class: 'flow-rework', 'data-rework': 'down',
    d: `M ${branchX} ${bottom} L ${branchX} ${FLOW.branchY - FLOW.pillH / 2 - 2}`,
    'marker-end': 'url(#arrow-rework)',
  }));
  svg.appendChild(svgEl('path', {
    class: 'flow-rework', 'data-rework': 'back',
    d: `M ${branchX - half} ${FLOW.branchY} L ${targetX + 16} ${FLOW.branchY} Q ${targetX} ${FLOW.branchY} ${targetX} ${FLOW.branchY - 16} L ${targetX} ${bottom + 4}`,
    'marker-end': 'url(#arrow-rework)',
  }));
  svg.appendChild(svgEl('text', {
    class: 'flow-rework-label', id: 'flow-rework-label', x: (branchX - half + targetX) / 2, y: FLOW.branchY - 8,
  }, 'Rework loop'));

  STATUSES.forEach((status, index) => svg.appendChild(flowNode(status, index, nodeX(index), FLOW.rowY)));
  const branch = flowNode(BRANCH_STATUS, null, branchX, FLOW.branchY);
  branch.classList.add('is-branch');
  svg.appendChild(branch);

  el('flow-wrap').appendChild(svg);
}

function mainIndex(status) {
  return status === BRANCH_STATUS ? BRANCH_PARENT_INDEX + 1 : STATUSES.indexOf(status);
}

export function renderFlow(state) {
  const { status, reworkCount } = state;
  const current = mainIndex(status);
  const isFinal = status === STATUSES[STATUSES.length - 1];

  document.querySelectorAll('#flow-wrap .flow-node').forEach((node) => {
    const nodeStatus = node.dataset.status;
    if (nodeStatus === BRANCH_STATUS) {
      node.classList.toggle('is-current', status === BRANCH_STATUS);
      node.classList.toggle('is-done', reworkCount > 0 && status !== BRANCH_STATUS);
      return;
    }
    const index = STATUSES.indexOf(nodeStatus);
    // The last step, once reached, reads as done rather than in progress.
    node.classList.toggle('is-done', index < current || (isFinal && index === current));
    node.classList.toggle('is-current', nodeStatus === status && !isFinal);
  });
  // Link i joins node i and i + 1; it is done once node i + 1 has been reached.
  const reached = status === BRANCH_STATUS ? BRANCH_PARENT_INDEX : current;
  document.querySelectorAll('#flow-wrap .flow-link').forEach((link) => {
    link.classList.toggle('is-done', Number(link.dataset.link) + 1 <= reached);
  });
  const reworkActive = status === BRANCH_STATUS || reworkCount > 0;
  document.querySelectorAll('#flow-wrap .flow-rework').forEach((path) => {
    path.classList.toggle('is-active', reworkActive);
  });
  el('flow-rework-label').textContent = reworkCount > 0 ? `Rework loop · ${reworkCount}×` : 'Rework loop';

  // Text version of the same diagram (visible on small screens).
  const items = STATUSES.map((itemStatus, index) => ({ itemStatus, index }));
  if (status === BRANCH_STATUS || reworkCount > 0) {
    items.splice(BRANCH_PARENT_INDEX + 1, 0, { itemStatus: BRANCH_STATUS, index: null });
  }
  el('flow-list').innerHTML = items.map(({ itemStatus, index }) => {
    const isCurrent = itemStatus === status;
    const isDone = index === null
      ? reworkCount > 0 && !isCurrent
      : index < current || (isFinal && isCurrent);
    const cls = `${isDone ? ' is-done' : ''}${isCurrent && !isFinal ? ' is-current' : ''}${index === null ? ' is-branch' : ''}`;
    let suffix = '';
    if (isCurrent) {
      suffix = ' (current)';
    } else if (isDone) {
      suffix = ' (done)';
    }
    const reworkNote = index === null && reworkCount > 0 ? ` · ${reworkCount}×` : '';
    return `
      <li class="flow-list-item${cls}"${isCurrent ? ' aria-current="step"' : ''}>
        <span class="flow-list-dot" aria-hidden="true">${index === null ? '!' : index + 1}</span>
        <span class="flow-list-label">${escapeHtml(STATUS_META[itemStatus].task)}${reworkNote}<span class="sr-only">${suffix}</span></span>
      </li>`;
  }).join('');
}

// Generates solar-system.svg and solar-system.config.json; edit this file, not the outputs.
// Usage (from the repository root):
//   node examples/solar-system/generate.mjs examples/solar-system
//   pnpm exec prettier --write examples/solar-system/solar-system.config.json
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2];
if (!out) throw new Error('output directory missing');

const W = 1280,
  H = 900;
const CX = 470,
  CY = 450;
const MAX_DAYS = 36525; // 2000-01-01 .. 2100-01-01
const DAY_MS = 86400000;
const TODAY = Math.round((Date.UTC(2026, 10, 19) - Date.UTC(2000, 0, 1)) / DAY_MS);
const OUTER = 432;

// Deterministic pseudo random numbers
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const f = (n, d = 1) => Number(n.toFixed(d));

// Mean longitude at J2000 (deg) and sidereal period (days); data rounded, see README
const PLANETS = [
  {
    key: 'mercury',
    name: 'Merkur',
    R: 62,
    s: 4,
    L0: 252.25,
    P: 87.969,
    c1: '#d8d0c8',
    c2: '#6e6660',
  },
  {
    key: 'venus',
    name: 'Venus',
    R: 92,
    s: 7,
    L0: 181.98,
    P: 224.701,
    c1: '#fbe7b8',
    c2: '#c08a3e',
  },
  {
    key: 'earth',
    name: 'Erde',
    R: 126,
    s: 7.5,
    L0: 100.46,
    P: 365.256,
    c1: '#8fd0ff',
    c2: '#1d4f9a',
  },
  { key: 'mars', name: 'Mars', R: 160, s: 5, L0: 355.45, P: 686.98, c1: '#ffab80', c2: '#8f3218' },
  { key: 'jupiter', name: 'Jupiter', R: 248, s: 16, L0: 34.4, P: 4332.59, banded: true },
  {
    key: 'saturn',
    name: 'Saturn',
    R: 305,
    s: 12,
    L0: 49.94,
    P: 10759.22,
    banded: true,
    ring: true,
  },
  {
    key: 'uranus',
    name: 'Uranus',
    R: 360,
    s: 9.5,
    L0: 313.23,
    P: 30688.5,
    c1: '#c9fbff',
    c2: '#3f9fb0',
  },
  {
    key: 'neptune',
    name: 'Neptun',
    R: 410,
    s: 9.5,
    L0: 304.88,
    P: 60182,
    c1: '#8fb4ff',
    c2: '#22378f',
  },
];

// Data panel per focus name
const DATA = {
  Sonne: {
    cls: 'G2V-HAUPTREIHENSTERN',
    dist: '0 AE',
    period: '—',
    diam: '1 392 700 km',
    moons: '8 Planeten',
    temp: '≈ 5 500 °C',
    light: '—',
    bar: 0.02,
  },
  Merkur: {
    cls: 'GESTEINSPLANET',
    dist: '0,39 AE',
    period: '88 Tage',
    diam: '4 879 km',
    moons: '0',
    temp: '−180 … 430 °C',
    light: '3,2 min',
    bar: 0.2,
  },
  Venus: {
    cls: 'GESTEINSPLANET',
    dist: '0,72 AE',
    period: '225 Tage',
    diam: '12 104 km',
    moons: '0',
    temp: '≈ 465 °C',
    light: '6,0 min',
    bar: 0.3,
  },
  Erde: {
    cls: 'GESTEINSPLANET',
    dist: '1,00 AE',
    period: '365,26 Tage',
    diam: '12 742 km',
    moons: '1',
    temp: '≈ 15 °C',
    light: '8,3 min',
    bar: 0.38,
  },
  Mars: {
    cls: 'GESTEINSPLANET',
    dist: '1,52 AE',
    period: '687 Tage',
    diam: '6 779 km',
    moons: '2',
    temp: '≈ −63 °C',
    light: '12,7 min',
    bar: 0.46,
  },
  Jupiter: {
    cls: 'GASRIESE',
    dist: '5,20 AE',
    period: '11,9 Jahre',
    diam: '139 820 km',
    moons: '95',
    temp: '≈ −110 °C',
    light: '43 min',
    bar: 0.66,
  },
  Saturn: {
    cls: 'GASRIESE',
    dist: '9,58 AE',
    period: '29,5 Jahre',
    diam: '116 460 km',
    moons: '274',
    temp: '≈ −140 °C',
    light: '1 h 20 min',
    bar: 0.78,
  },
  Uranus: {
    cls: 'EISRIESE',
    dist: '19,2 AE',
    period: '84 Jahre',
    diam: '50 724 km',
    moons: '28',
    temp: '≈ −195 °C',
    light: '2 h 40 min',
    bar: 0.9,
  },
  Neptun: {
    cls: 'EISRIESE',
    dist: '30,1 AE',
    period: '165 Jahre',
    diam: '49 244 km',
    moons: '16',
    temp: '≈ −200 °C',
    light: '4 h 10 min',
    bar: 1,
  },
};

const svg = [];
const add = (s) => svg.push(s);
const config = { variables: [], transformations: [] };
const tf = (t) => config.transformations.push(t);

config.variables.push(
  { name: 'days', type: 'number', minimum: 0, maximum: MAX_DAYS, defaultValue: TODAY },
  { name: 'focus', type: 'text', defaultValue: 'Erde' },
  { name: 'orbits', type: 'boolean', defaultValue: true },
);

const turns = (P) => (360 * MAX_DAYS) / P;
// Counterclockwise orbit (seen from ecliptic north): negative SVG angles
const orbitFrames = (L0, P) => [
  { at: '$min', value: f(-L0, 2) },
  { at: '$max', value: f(-(L0 + turns(P)), 2) },
];
const counterFrames = (L0, P) => [
  { at: '$min', value: f(L0, 2) },
  { at: '$max', value: f(L0 + turns(P), 2) },
];

// ---------- SVG ----------
add(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif">`,
);
add(`  <defs>
    <radialGradient id="ss-space" cx="0.37" cy="0.5" r="0.75">
      <stop offset="0" stop-color="#0c1730" />
      <stop offset="0.55" stop-color="#050a18" />
      <stop offset="1" stop-color="#01030a" />
    </radialGradient>
    <radialGradient id="ss-sun-core" cx="0.45" cy="0.42" r="0.6">
      <stop offset="0" stop-color="#fffbe6" />
      <stop offset="0.35" stop-color="#ffe27a" />
      <stop offset="0.75" stop-color="#ffab2e" />
      <stop offset="1" stop-color="#f06a10" />
    </radialGradient>
    <radialGradient id="ss-sun-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffcf5a" stop-opacity="0.75" />
      <stop offset="0.4" stop-color="#ff8a1e" stop-opacity="0.25" />
      <stop offset="1" stop-color="#ff6a00" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="ss-shade" cx="0.38" cy="0.5" r="0.62" fx="0.22" fy="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="0.75" stop-color="#000000" stop-opacity="0.45" />
      <stop offset="1" stop-color="#000000" stop-opacity="0.85" />
    </radialGradient>
    <linearGradient id="ss-jupiter-bands" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9d8bd" /><stop offset="0.18" stop-color="#c6996b" />
      <stop offset="0.3" stop-color="#f3e6cd" /><stop offset="0.42" stop-color="#b37a50" />
      <stop offset="0.55" stop-color="#efdcbc" /><stop offset="0.68" stop-color="#c48e60" />
      <stop offset="0.82" stop-color="#e8d2ad" /><stop offset="1" stop-color="#a9764e" />
    </linearGradient>
    <linearGradient id="ss-saturn-bands" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f1e1b8" /><stop offset="0.3" stop-color="#dcc28c" />
      <stop offset="0.5" stop-color="#f4e7c4" /><stop offset="0.7" stop-color="#cfb27a" />
      <stop offset="1" stop-color="#b99a62" />
    </linearGradient>
    <linearGradient id="ss-panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a1a33" stop-opacity="0.85" />
      <stop offset="1" stop-color="#040b1a" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="ss-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffb347" /><stop offset="0.5" stop-color="#5ff3ff" /><stop offset="1" stop-color="#7a7cff" />
    </linearGradient>`);
for (const p of PLANETS.filter((q) => q.c1)) {
  add(
    `    <radialGradient id="ss-${p.key}-fill" cx="0.45" cy="0.45" r="0.6"><stop offset="0" stop-color="${p.c1}" /><stop offset="1" stop-color="${p.c2}" /></radialGradient>`,
  );
}
add('  </defs>');

// Background and stars
add(`  <rect width="${W}" height="${H}" rx="22" fill="url(#ss-space)" />`);
add('  <g id="ss-stars" fill="#ffffff">');
for (let i = 0; i < 230; i++) {
  const x = f(rnd() * W),
    y = f(rnd() * H);
  const r = f(rnd() < 0.08 ? 1.4 + rnd() : 0.4 + rnd() * 0.7, 2);
  add(`    <circle cx="${x}" cy="${y}" r="${r}" opacity="${f(0.25 + rnd() * 0.7, 2)}" />`);
}
add('  </g>');
// Faint nebula

// HUD ring with degree scale
add('  <g id="ss-hud" fill="none" stroke="#5ff3ff">');
add(`    <circle cx="${CX}" cy="${CY}" r="${OUTER}" stroke-opacity="0.35" stroke-width="1" />`);
add(
  `    <circle cx="${CX}" cy="${CY}" r="${OUTER + 8}" stroke-opacity="0.15" stroke-width="1" stroke-dasharray="2 6" />`,
);
for (let a = 0; a < 360; a += 2) {
  const long = a % 10 === 0;
  const r1 = OUTER,
    r2 = OUTER - (a % 30 === 0 ? 12 : long ? 7 : 3);
  const t = (-a * Math.PI) / 180;
  add(
    `    <line x1="${f(CX + r1 * Math.cos(t))}" y1="${f(CY + r1 * Math.sin(t))}" x2="${f(CX + r2 * Math.cos(t))}" y2="${f(CY + r2 * Math.sin(t))}" stroke-opacity="${long ? 0.6 : 0.3}" />`,
  );
}
add('  </g>');
add('  <g fill="#5ff3ff" font-size="10" letter-spacing="1" text-anchor="middle" opacity="0.75">');
for (let a = 0; a < 360; a += 30) {
  const t = (-a * Math.PI) / 180,
    r = OUTER - 24;
  add(
    `    <text x="${f(CX + r * Math.cos(t))}" y="${f(CY + r * Math.sin(t) + 3.5)}">${a === 0 ? 'γ 0°' : a + '°'}</text>`,
  );
}
add('  </g>');

// Radar sweep (several wedges, fading)
add('  <g id="ss-sweep" opacity="0.55">');
for (let i = 0; i < 6; i++) {
  const a1 = (i * 5 * Math.PI) / 180,
    a2 = ((i + 1) * 5 * Math.PI) / 180;
  const r = OUTER - 2;
  add(
    `    <path d="M ${CX} ${CY} L ${f(CX + r * Math.cos(a1))} ${f(CY + r * Math.sin(a1))} A ${r} ${r} 0 0 1 ${f(CX + r * Math.cos(a2))} ${f(CY + r * Math.sin(a2))} Z" fill="#5ff3ff" opacity="${f(0.11 - i * 0.017, 3)}" />`,
  );
}
add(
  `    <line x1="${CX}" y1="${CY}" x2="${CX + OUTER - 2}" y2="${CY}" stroke="#5ff3ff" stroke-width="1.2" stroke-opacity="0.7" />`,
);
add('  </g>');
tf({
  name: 'radar_sweep',
  type: 'rotate',
  element: 'ss-sweep',
  variable: 'days',
  origin: { x: CX, y: CY },
  frames: [
    { at: '$min', value: 0 },
    { at: '$max', value: f(-turns(30), 1) },
  ],
});

// Orbits
add('  <g id="ss-orbits" fill="none">');
for (const p of PLANETS) {
  add(
    `    <circle id="ss-orbit-${p.key}" cx="${CX}" cy="${CY}" r="${p.R}" stroke="#3d7fa8" stroke-opacity="0.55" stroke-width="1" ${p.R > 200 ? 'stroke-dasharray="6 4"' : ''}/>`,
  );
  tf({
    name: `orbit_${p.key}_highlight`,
    type: 'stroke-color',
    element: `ss-orbit-${p.key}`,
    variable: 'focus',
    transition: { duration: 400, easing: 'easeout' },
    frames: [{ at: p.name, value: '#7ff6ff' }],
    default: '#3d7fa8',
  });
  tf({
    name: `orbit_${p.key}_width`,
    type: 'stroke-width',
    element: `ss-orbit-${p.key}`,
    variable: 'focus',
    frames: [{ at: p.name, value: 2 }],
    default: 1,
  });
}
add(
  `    <circle cx="${CX}" cy="${CY}" r="186" stroke="#8a7a66" stroke-opacity="0.3" stroke-dasharray="1 5" />`,
);
add(
  `    <circle cx="${CX}" cy="${CY}" r="214" stroke="#8a7a66" stroke-opacity="0.3" stroke-dasharray="1 5" />`,
);
add('  </g>');
tf({
  name: 'orbits_visible',
  type: 'opacity',
  element: 'ss-orbits',
  variable: 'orbits',
  transition: { duration: 500, easing: 'easeinout' },
  frames: [
    { at: false, value: 0 },
    { at: true, value: 1 },
  ],
});

// Asteroid belt
add('  <g id="ss-belt" fill="#b9a68a">');
for (let i = 0; i < 260; i++) {
  const t = rnd() * Math.PI * 2,
    r = 188 + rnd() * 24 + (rnd() - 0.5) * 4;
  add(
    `    <circle cx="${f(CX + r * Math.cos(t))}" cy="${f(CY + r * Math.sin(t))}" r="${f(0.5 + rnd() * 1.1, 2)}" opacity="${f(0.3 + rnd() * 0.6, 2)}" />`,
  );
}
add('  </g>');
tf({
  name: 'belt_drift',
  type: 'rotate',
  element: 'ss-belt',
  variable: 'days',
  origin: { x: CX, y: CY },
  frames: [
    { at: '$min', value: 0 },
    { at: '$max', value: f(-turns(1680), 1) },
  ],
});

// Sun
add(`  <circle cx="${CX}" cy="${CY}" r="90" fill="url(#ss-sun-glow)" />`);
add('  <g id="ss-corona" fill="#ffc24a" opacity="0.5">');
for (let i = 0; i < 16; i++) {
  const t = (i / 16) * Math.PI * 2,
    w = 0.07,
    r1 = 30,
    r2 = i % 2 ? 46 : 56;
  add(
    `    <polygon points="${f(CX + r1 * Math.cos(t - w))},${f(CY + r1 * Math.sin(t - w))} ${f(CX + r2 * Math.cos(t))},${f(CY + r2 * Math.sin(t))} ${f(CX + r1 * Math.cos(t + w))},${f(CY + r1 * Math.sin(t + w))}" />`,
  );
}
add('  </g>');
tf({
  name: 'sun_rotation',
  type: 'rotate',
  element: 'ss-corona',
  variable: 'days',
  origin: { x: CX, y: CY },
  frames: [
    { at: '$min', value: 0 },
    { at: '$max', value: f(-turns(25.38), 1) },
  ],
});
add(`  <circle cx="${CX}" cy="${CY}" r="31" fill="url(#ss-sun-core)" />`);
add(`  <circle cx="${CX}" cy="${CY}" r="31" fill="none" stroke="#fff3c4" stroke-opacity="0.5" />`);
const bracket = (x, y, d, id) => {
  const l = Math.max(5, d * 0.45);
  return `    <g id="${id}" fill="none" stroke="#7ff6ff" stroke-width="1.5" opacity="0">
      <path d="M ${f(x - d)} ${f(y - d + l)} V ${f(y - d)} H ${f(x - d + l)} M ${f(x + d - l)} ${f(y - d)} H ${f(x + d)} V ${f(y - d + l)} M ${f(x + d)} ${f(y + d - l)} V ${f(y + d)} H ${f(x + d - l)} M ${f(x - d + l)} ${f(y + d)} H ${f(x - d)} V ${f(y + d - l)}" />
      <circle cx="${x}" cy="${y}" r="${f(d * 1.25)}" stroke-opacity="0.35" stroke-dasharray="2 3" />
    </g>`;
};
add(bracket(CX, CY, 44, 'ss-sun-target'));
tf({
  name: 'sun_target',
  type: 'opacity',
  element: 'ss-sun-target',
  variable: 'focus',
  transition: { duration: 300, easing: 'easeout' },
  frames: [{ at: 'Sonne', value: 1 }],
  default: 0,
});
add(
  `  <text x="${CX}" y="${CY + 50}" text-anchor="middle" font-size="10" letter-spacing="3" fill="#ffd27a">SONNE</text>`,
);

// Planets
for (const p of PLANETS) {
  const x = CX + p.R,
    y = CY;
  add(`  <g id="ss-${p.key}-orbit">`);
  if (p.banded) {
    add(`    <g id="ss-${p.key}-surface">`);
    if (p.ring)
      add(
        `      <path d="M ${f(x - 25)} ${y} A 25 7 0 0 1 ${f(x + 25)} ${y}" fill="none" stroke="#d9c79c" stroke-width="3.5" stroke-opacity="0.75" transform="rotate(-20 ${x} ${y})" />`,
      );
    add(`      <circle cx="${x}" cy="${y}" r="${p.s}" fill="url(#ss-${p.key}-bands)" />`);
    add('    </g>');
    tf({
      name: `${p.key}_surface_upright`,
      type: 'rotate',
      element: `ss-${p.key}-surface`,
      variable: 'days',
      origin: { x, y },
      frames: counterFrames(p.L0, p.P),
    });
  } else {
    add(`    <circle cx="${x}" cy="${y}" r="${p.s}" fill="url(#ss-${p.key}-fill)" />`);
    if (p.key === 'earth') {
      add(
        `    <path d="M ${x - 3} ${y - 5} C ${x + 1} ${y - 6} ${x + 3} ${y - 2} ${x + 1} ${y} C ${x - 1} ${y + 2} ${x - 4} ${y} ${x - 3} ${y - 5} Z M ${x + 2} ${y + 3} C ${x + 5} ${y + 2} ${x + 5} ${y + 5} ${x + 3} ${y + 6} Z" fill="#5fbf7a" opacity="0.8" />`,
      );
    }
  }
  // Shade: lit side always faces the sun, because it turns with the orbit
  add(`    <circle cx="${x}" cy="${y}" r="${p.s}" fill="url(#ss-shade)" />`);
  if (p.key === 'earth') {
    add(`    <g id="ss-moon-orbit">`);
    add(
      `      <circle cx="${x}" cy="${y}" r="14" fill="none" stroke="#9fb7c9" stroke-opacity="0.25" stroke-dasharray="1 3" />`,
    );
    add(`      <circle cx="${x + 14}" cy="${y}" r="2.3" fill="#d9dde3" />`);
    add('    </g>');
    // Moon relative to the Earth's orbit group: synodic motion
    tf({
      name: 'moon_orbit',
      type: 'rotate',
      element: 'ss-moon-orbit',
      variable: 'days',
      origin: { x, y },
      frames: [
        { at: '$min', value: -117.86 },
        { at: '$max', value: f(-(117.86 + 12.190749 * MAX_DAYS), 1) },
      ],
    });
  }
  add(`    <g id="ss-${p.key}-tag">`);
  if (p.ring)
    add(
      `      <path d="M ${f(x + 25)} ${y} A 25 7 0 0 1 ${f(x - 25)} ${y}" fill="none" stroke="#e8d8ae" stroke-width="3.5" stroke-opacity="0.9" transform="rotate(-20 ${x} ${y})" />`,
    );
  add(
    `      <text x="${x}" y="${f(y - p.s - (p.ring ? 14 : 9))}" text-anchor="middle" font-size="10" letter-spacing="2" fill="#a9e6ff">${p.name.toUpperCase()}</text>`,
  );
  add(bracket(x, y, p.s + (p.ring ? 18 : 8), `ss-${p.key}-target`).replace(/^/gm, '  '));
  add('    </g>');
  add('  </g>');
  tf({
    name: `${p.key}_orbit`,
    type: 'rotate',
    element: `ss-${p.key}-orbit`,
    variable: 'days',
    origin: { x: CX, y: CY },
    frames: orbitFrames(p.L0, p.P),
  });
  tf({
    name: `${p.key}_tag_upright`,
    type: 'rotate',
    element: `ss-${p.key}-tag`,
    variable: 'days',
    origin: { x, y },
    frames: counterFrames(p.L0, p.P),
  });
  tf({
    name: `${p.key}_target`,
    type: 'opacity',
    element: `ss-${p.key}-target`,
    variable: 'focus',
    transition: { duration: 300, easing: 'easeout' },
    frames: [{ at: p.name, value: 1 }],
    default: 0,
  });
}

// Title
add(`  <text x="36" y="40" font-size="11" letter-spacing="6" fill="#5ff3ff" opacity="0.85">SOL // ORRERY</text>
  <text x="36" y="66" font-size="24" font-weight="200" fill="#ffffff">Sonnensystem</text>
  <text x="36" y="82" font-size="9" letter-spacing="2" fill="#7fa8c9">HELIOZENTRISCH · EKLIPTIK J2000</text>`);

// Epoch panel
const PX = 922;
add(`  <g transform="translate(${PX} 40)">
    <rect width="318" height="150" rx="14" fill="url(#ss-panel)" stroke="#5ff3ff" stroke-opacity="0.3" />
    <path d="M 0 30 V 14 A 14 14 0 0 1 14 0 H 60" fill="none" stroke="#5ff3ff" stroke-width="2" />
    <text x="20" y="32" font-size="10" letter-spacing="3" fill="#5ff3ff">EPOCHE</text>
    <text id="ss-year" x="20" y="92" font-size="56" font-weight="200" fill="#ffffff" letter-spacing="2">2026</text>
    <text x="20" y="122" font-size="10" letter-spacing="2" fill="#7fa8c9">T+</text>
    <text id="ss-days" x="42" y="122" font-size="13" fill="#ffffff">${TODAY}</text>
    <text x="298" y="122" text-anchor="end" font-size="10" letter-spacing="2" fill="#7fa8c9">TAGE SEIT 1.1.2000</text>
    <rect x="20" y="132" width="278" height="3" rx="1.5" fill="#ffffff" opacity="0.12" />
    <rect id="ss-epoch-bar" x="20" y="132" width="278" height="3" rx="1.5" fill="#5ff3ff" />
  </g>`);
tf({ name: 'days_text', type: 'text', element: 'ss-days', variable: 'days', bind: true });
tf({
  name: 'epoch_progress',
  type: 'scale',
  element: 'ss-epoch-bar',
  variable: 'days',
  origin: 'left',
  frames: [
    { at: '$min', value: { x: 0.005, y: 1 } },
    { at: '$max', value: { x: 1, y: 1 } },
  ],
});
const years = [];
for (let Y = 2000; Y <= 2100; Y++)
  years.push({
    at: Math.round((Date.UTC(Y, 0, 1) - Date.UTC(2000, 0, 1)) / DAY_MS),
    value: String(Y),
  });
tf({ name: 'year_text', type: 'text', element: 'ss-year', variable: 'days', frames: years });

// Focus panel
const rows = [
  ['dist', 'MITTLERER ABSTAND'],
  ['period', 'UMLAUFZEIT'],
  ['diam', 'DURCHMESSER'],
  ['moons', 'MONDE'],
  ['temp', 'TEMPERATUR'],
  ['light', 'LICHTLAUFZEIT'],
];
add(`  <g transform="translate(${PX} 210)">
    <rect width="318" height="390" rx="14" fill="url(#ss-panel)" stroke="#5ff3ff" stroke-opacity="0.3" />
    <path d="M 318 40 V 14 A 14 14 0 0 0 304 0 H 250" fill="none" stroke="#5ff3ff" stroke-width="2" />
    <text x="20" y="32" font-size="10" letter-spacing="3" fill="#5ff3ff">ZIELOBJEKT</text>
    <circle cx="290" cy="28" r="4" fill="#5ff3ff"><title>live</title></circle>
    <text id="ss-focus-name" x="20" y="76" font-size="34" font-weight="300" letter-spacing="3" fill="#ffffff">ERDE</text>
    <text id="ss-focus-cls" x="20" y="98" font-size="10" letter-spacing="3" fill="#ffd27a">GESTEINSPLANET</text>`);
rows.forEach(([key, label], i) => {
  const y = 140 + i * 38;
  add(`    <line x1="20" y1="${y - 18}" x2="298" y2="${y - 18}" stroke="#5ff3ff" stroke-opacity="0.12" />
    <text x="20" y="${y}" font-size="10" letter-spacing="2" fill="#7fa8c9">${label}</text>
    <text id="ss-focus-${key}" x="298" y="${y}" text-anchor="end" font-size="15" fill="#ffffff">${DATA.Erde[key]}</text>`);
});
add(`    <text x="20" y="362" font-size="10" letter-spacing="2" fill="#7fa8c9">ABSTAND ZUR SONNE (LOG)</text>
    <rect x="20" y="372" width="278" height="6" rx="3" fill="#ffffff" opacity="0.1" />
    <rect id="ss-focus-bar" x="20" y="372" width="278" height="6" rx="3" fill="url(#ss-bar)" />
  </g>`);
const focusText = (key, map = (v) => v) => {
  const frames = Object.entries(DATA).map(([name, d]) => ({ at: name, value: map(d[key], name) }));
  return frames;
};
tf({
  name: 'focus_name',
  type: 'text',
  element: 'ss-focus-name',
  variable: 'focus',
  frames: Object.keys(DATA).map((name) => ({ at: name, value: name.toUpperCase() })),
  default: '—',
});
tf({
  name: 'focus_class',
  type: 'text',
  element: 'ss-focus-cls',
  variable: 'focus',
  frames: focusText('cls'),
  default: 'KEIN ZIEL',
});
for (const [key] of rows) {
  tf({
    name: `focus_${key}`,
    type: 'text',
    element: `ss-focus-${key}`,
    variable: 'focus',
    frames: focusText(key),
    default: '—',
  });
}
tf({
  name: 'focus_distance_bar',
  type: 'scale',
  element: 'ss-focus-bar',
  variable: 'focus',
  origin: 'left',
  transition: { duration: 600, easing: 'easeout' },
  frames: Object.entries(DATA).map(([name, d]) => ({ at: name, value: { x: d.bar, y: 1 } })),
  default: { x: 0.01, y: 1 },
});

// Legend / status
add(`  <g transform="translate(${PX} 620)">
    <rect width="318" height="120" rx="14" fill="url(#ss-panel)" stroke="#5ff3ff" stroke-opacity="0.3" />
    <text x="20" y="30" font-size="10" letter-spacing="3" fill="#5ff3ff">SYSTEMSTATUS</text>
    <g font-size="11" fill="#cfe9ff">
      <circle cx="26" cy="52" r="3" fill="#5fe08a" /><text x="38" y="56">Navigation: heliozentrisch</text>
      <circle cx="26" cy="74" r="3" fill="#5fe08a" /><text x="38" y="78">Bahnmodell: mittlere Bewegung</text>
      <circle cx="26" cy="96" r="3" fill="#ffd27a" /><text x="38" y="100">Abstände und Größen nicht maßstäblich</text>
    </g>
  </g>`);
add(
  `  <text x="40" y="${H - 34}" font-size="10" letter-spacing="2" fill="#7fa8c9">γ = FRÜHLINGSPUNKT · UMLAUF GEGEN DEN UHRZEIGERSINN</text>`,
);
add('</svg>');

writeFileSync(join(out, 'solar-system.svg'), svg.join('\n') + '\n');
writeFileSync(join(out, 'solar-system.config.json'), JSON.stringify(config, null, 2) + '\n');
console.log(`days default ${TODAY}, ${config.transformations.length} transformations`);

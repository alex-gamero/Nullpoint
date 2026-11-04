// The secret: a green map behind the pixel. Solid walls, wide halls, no dead ends,
// so what chases you can always be outrun.
const CW = 20, CH = 10, COLS = CW * 3 + 1, ROWS = CH * 3 + 1, T = 16;
const NEAR = 7, FAR = 16, RUN = 125, FOE_STEP = 300, CHASE = 20;
const WALL = '#48ee82', OLD = '#1b6a3e', FLOOR = '#10241c', BG = '#0d0d14', FOE = '#e0705a', KEY = '#e9c9b4';
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function rng(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function build() {
  const r = rng(40412), g = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const carveCell = (i, j) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) g[j * 3 + 1 + y][i * 3 + 1 + x] = ' '; };
  const openBetween = (i, j, a, b) => { // two tiles wide, so halls stay wide
    if (a) for (let y = 0; y < 2; y++) g[j * 3 + 1 + y][(a > 0 ? i + 1 : i) * 3] = ' ';
    else for (let x = 0; x < 2; x++) g[(b > 0 ? j + 1 : j) * 3][i * 3 + 1 + x] = ' ';
  };
  const isOpen = (i, j, a, b) => a ? g[j * 3 + 1][(a > 0 ? i + 1 : i) * 3] === ' ' : g[(b > 0 ? j + 1 : j) * 3][i * 3 + 1] === ' ';
  const inside = (i, j) => i >= 0 && j >= 0 && i < CW && j < CH;
  const seen = new Set(['0,0']), stack = [[0, 0]];
  for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) carveCell(i, j);
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const opts = DIRS.filter(([a, b]) => inside(i + a, j + b) && !seen.has(`${i + a},${j + b}`));
    if (!opts.length) { stack.pop(); continue; }
    const [a, b] = opts[r() * opts.length | 0];
    openBetween(i, j, a, b); seen.add(`${i + a},${j + b}`); stack.push([i + a, j + b]);
  }
  // Loops everywhere: a third of the remaining walls come down.
  for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) for (const [a, b] of [[1, 0], [0, 1]])
    if (inside(i + a, j + b) && r() < .33) openBetween(i, j, a, b);
  // No dead ends: every cell gets at least two exits.
  for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
    const nb = DIRS.filter(([a, b]) => inside(i + a, j + b));
    if (nb.filter(([a, b]) => isOpen(i, j, a, b)).length < 2) {
      const c = nb.filter(([a, b]) => !isOpen(i, j, a, b)); const [a, b] = c[r() * c.length | 0]; openBetween(i, j, a, b);
    }
  }
  // A few big rooms to circle in.
  for (const [i, j, w, h] of [[3, 1, 4, 3], [12, 2, 4, 3], [6, 6, 4, 3], [15, 6, 3, 3]])
    for (let y = j * 3 + 1; y < (j + h) * 3; y++) for (let x = i * 3 + 1; x < (i + w) * 3; x++) g[y][x] = ' ';
  return g;
}
const dist = (g, sx, sy) => {
  const d = g.map(r => r.map(() => -1)), q = [[sx, sy]]; d[sy][sx] = 0;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [a, b] of DIRS) if (g[y + b][x + a] === ' ' && d[y + b][x + a] < 0) { d[y + b][x + a] = d[y][x] + 1; q.push([x + a, y + b]); }
  }
  return d;
};
export function dungeon(el, story, audio) {
  el.classList.add('green');
  el.innerHTML = '<p class="say"></p><canvas></canvas>';
  const say = el.querySelector('.say'), cv = el.querySelector('canvas'), c = cv.getContext('2d');
  cv.width = COLS * T; cv.height = ROWS * T;
  const g = build(), fromStart = dist(g, 1, 1);
  let key = [1, 1], far = 0;
  fromStart.forEach((row, y) => row.forEach((v, x) => { if (v > far) { far = v; key = [x, y]; } }));
  const spots = []; fromStart.forEach((row, y) => row.forEach((v, x) => { if (v > 30 && v < far - 6 && x % 13 === 2 && y % 7 === 2) spots.push([x, y]); }));
  const pick = [0, .33, .66, .99].map(f => spots[Math.floor(f * (spots.length - 1))]);
  const foes = pick.map(([x, y]) => ({ x, y, hx: x, hy: y }));
  const known = new Set();
  let px = 1, py = 1, over = false;
  const lit = (x, y) => {
    const d = Math.hypot(x - px, y - py);
    if (d <= NEAR) return true;
    if (d > FAR) return false;
    const n = Math.ceil(d * 2);
    for (let i = 1; i < n; i++) if (g[Math.round(py + (y - py) * i / n)][Math.round(px + (x - px) * i / n)] === '#') return false;
    return true;
  };
  const glyph = (ch, x, y, col) => {
    c.fillStyle = col; c.fillText(ch, x * T + T / 2, y * T + T / 2 + 1);
  };
  const draw = () => {
    c.fillStyle = BG; c.fillRect(0, 0, cv.width, cv.height);
    c.font = `${T + 4}px VT323, monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const id = y * COLS + x, v = lit(x, y);
      if (v) known.add(id);
      if (known.has(id)) { c.fillStyle = g[y][x] === '#' ? (v ? WALL : OLD) : FLOOR; c.fillRect(x * T, y * T, T, T); }
    }
    if (known.has(key[1] * COLS + key[0])) glyph('k', key[0], key[1], KEY);
    for (const f of foes) if (known.has(f.y * COLS + f.x)) glyph('E', f.x, f.y, FOE);
    glyph('@', px, py, WALL);
  };
  return new Promise(resolve => {
    const held = [];
    const MOVE = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] };
    const end = found => {
      over = true; clearInterval(foeId); clearInterval(runId);
      removeEventListener('keydown', down); removeEventListener('keyup', up); el.classList.remove('green'); resolve({ found });
    };
    const hit = () => {
      if (!foes.some(f => f.x === px && f.y === py)) return;
      px = 1; py = 1; foes.forEach(f => { f.x = f.hx; f.y = f.hy; });
      audio.bad(); say.textContent = story.caught; setTimeout(() => { if (say.textContent === story.caught) say.textContent = ''; }, 1800);
    };
    const step = () => {
      const m = MOVE[held[held.length - 1]];
      if (!m || over) return;
      if (g[py + m[1]][px + m[0]] === ' ') { px += m[0]; py += m[1]; audio.key(); }
      hit();
      if (px === key[0] && py === key[1]) {
        over = true; clearInterval(foeId); clearInterval(runId); audio.melody(); say.textContent = story.found; cv.remove();
        setTimeout(() => end(true), 3200); return;
      }
      draw();
    };
    const down = e => {
      if (over) return;
      if (e.key === 'Escape') return end(false);
      if (!MOVE[e.key]) return;
      e.preventDefault();
      if (!e.repeat && !held.includes(e.key)) { held.push(e.key); step(); }
    };
    const up = e => { const i = held.indexOf(e.key); if (i >= 0) held.splice(i, 1); };
    addEventListener('keydown', down); addEventListener('keyup', up);
    const runId = setInterval(step, RUN);
    const foeId = setInterval(() => {
      const d = dist(g, px, py);
      for (const f of foes) {
        if (d[f.y][f.x] > CHASE || d[f.y][f.x] < 0) continue;
        const opts = DIRS.filter(([a, b]) => g[f.y + b][f.x + a] === ' ' && d[f.y + b][f.x + a] < d[f.y][f.x]);
        const o = opts.find(([a, b]) => !foes.some(q => q !== f && q.x === f.x + a && q.y === f.y + b));
        if (o) { f.x += o[0]; f.y += o[1]; }
      }
      hit(); draw();
    }, FOE_STEP);
    document.fonts?.load(`${T}px VT323`).then(draw); draw();
    if (location.search.includes('dev')) el.__dungeonDebug = { key, foes, get pos() { return [px, py]; }, g };
  });
}

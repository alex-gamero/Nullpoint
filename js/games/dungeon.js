// The secret: an ASCII maze behind the green pixel. You see only what your light reaches.
const COLS = 47, ROWS = 21, SIGHT = 7;
function rng(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function build() {
  const r = rng(40412), g = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const stack = [[1, 1]]; g[1][1] = ' ';
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([a, b]) => g[y + b]?.[x + a] === '#' && x + a > 0 && x + a < COLS - 1 && y + b > 0 && y + b < ROWS - 1);
    if (!dirs.length) { stack.pop(); continue; }
    const [a, b] = dirs[r() * dirs.length | 0];
    g[y + b / 2][x + a / 2] = ' '; g[y + b][x + a] = ' '; stack.push([x + a, y + b]);
  }
  for (let i = 0; i < 45; i++) { // loops, so you can run around what chases you
    const x = 1 + (r() * (COLS - 2) | 0), y = 1 + (r() * (ROWS - 2) | 0);
    if (g[y][x] === '#' && ((g[y][x - 1] === ' ' && g[y][x + 1] === ' ') || (g[y - 1][x] === ' ' && g[y + 1][x] === ' '))) g[y][x] = ' ';
  }
  return g;
}
const dist = (g, sx, sy) => {
  const d = g.map(r => r.map(() => -1)), q = [[sx, sy]]; d[sy][sx] = 0;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g[y + b][x + a] === ' ' && d[y + b][x + a] < 0) { d[y + b][x + a] = d[y][x] + 1; q.push([x + a, y + b]); }
  }
  return d;
};
export function dungeon(el, story, audio) {
  el.classList.add('green');
  el.innerHTML = `<p class="say">${story.intro}</p><pre></pre>`;
  const g = build(), say = el.querySelector('.say'), pre = el.querySelector('pre');
  const fromStart = dist(g, 1, 1); let key = [1, 1], far = 0;
  fromStart.forEach((row, y) => row.forEach((v, x) => { if (v > far) { far = v; key = [x, y]; } }));
  const spots = []; fromStart.forEach((row, y) => row.forEach((v, x) => { if (v > 18 && (x + y * 7) % 41 === 0) spots.push([x, y]); }));
  const foes = spots.slice(0, 3).map(([x, y]) => ({ x, y }));
  let px = 1, py = 1, over = false;
  const known = new Set(); // walls stay on your mental map once you have seen them
  const lit = (x, y) => {
    if (Math.hypot(x - px, (y - py) * 1.6) > SIGHT) return false;
    const n = Math.max(Math.abs(x - px), Math.abs(y - py));
    for (let i = 1; i < n; i++) if (g[Math.round(py + (y - py) * i / n)][Math.round(px + (x - px) * i / n)] === '#') return false;
    return true;
  };
  const draw = () => {
    let s = '';
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = lit(x, y);
        if (v) known.add(y * COLS + x);
        s += x === px && y === py ? '@' : !v ? (known.has(y * COLS + x) ? g[y][x] : ' ') : x === key[0] && y === key[1] ? 'k' : foes.some(f => f.x === x && f.y === y) ? 'E' : g[y][x];
      }
      s += '\n';
    }
    pre.textContent = s;
  };
  return new Promise(resolve => {
    const end = found => { over = true; clearInterval(id); removeEventListener('keydown', onKey); el.classList.remove('green'); resolve({ found }); };
    const hit = () => {
      if (!foes.some(f => f.x === px && f.y === py)) return;
      px = 1; py = 1; audio.bad(); say.textContent = story.caught;
    };
    const onKey = e => {
      if (over) return;
      if (e.key === 'Escape') return end(false);
      const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }[e.key];
      if (!m) return;
      e.preventDefault();
      if (g[py + m[1]][px + m[0]] === ' ') { px += m[0]; py += m[1]; audio.key(); }
      hit();
      if (px === key[0] && py === key[1]) {
        over = true; clearInterval(id); audio.melody(); say.textContent = story.found; pre.textContent = '';
        setTimeout(() => { over = false; end(true); }, 3200); return;
      }
      draw();
    };
    addEventListener('keydown', onKey);
    const id = setInterval(() => {
      const d = dist(g, px, py);
      for (const f of foes) {
        if (d[f.y][f.x] > 10 || d[f.y][f.x] < 0) continue;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => g[f.y + b][f.x + a] === ' ' && d[f.y + b][f.x + a] < d[f.y][f.x]);
        if (opts.length && !foes.some(o => o !== f && o.x === f.x + opts[0][0] && o.y === f.y + opts[0][1])) { f.x += opts[0][0]; f.y += opts[0][1]; }
      }
      hit(); draw();
    }, 460);
    draw();
    if (location.search.includes('dev')) el.__dungeonDebug = { key, get pos() { return [px, py]; }, g };
  });
}

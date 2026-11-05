// Dithered first-person raycaster. Everything is drawn into a luminance buffer,
// then ordered-dithered down to the five colours of the game's artwork.
const W = 320, H = 180;
const RED = [[13, 13, 20], [34, 19, 34], [82, 38, 62], [172, 50, 50], [224, 112, 90], [233, 201, 180]];
const OTHER = [[5, 15, 22], [10, 40, 50], [20, 78, 86], [44, 146, 140], [152, 228, 196], [240, 252, 232]];
const SECRET = [72, 238, 130];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const FOV = 1.05, TEX = 64;
const SOLID = new Set(['#', '1', '2', '3', '4', 'X']);

function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }

// Walls and floor echo img/terminal.png: a thin grid with red veins growing through it.
function makeTexture(base, grid, veins, seed) {
  const t = new Float32Array(TEX * TEX), r = rng(seed);
  for (let y = 0; y < TEX; y++) for (let x = 0; x < TEX; x++) {
    let v = base + (r() - .5) * .05;
    if (x % 16 === 0 || y % 16 === 0) v *= grid;
    t[y * TEX + x] = v;
  }
  for (let n = 0; n < veins; n++) {
    let x = r() * TEX, y = r() * TEX, a = r() * 6.28;
    for (let i = 0; i < 26; i++) {
      a += (r() - .5) * .9; x += Math.cos(a); y += Math.sin(a);
      t[((y | 0) & 63) * TEX + ((x | 0) & 63)] = 1.05;
    }
  }
  return t;
}

// Sprites are painted on a canvas once: red channel is lit, blue is self-lit, green is the secret.
function paint(size, fn) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true }); fn(g, size);
  const d = g.getImageData(0, 0, size, size).data, out = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const [R, G, B, A] = [d[i * 4], d[i * 4 + 1], d[i * 4 + 2], d[i * 4 + 3]];
    out[i] = A < 128 ? -1 : G > 200 ? 9 : B > 40 ? 2 + B / 255 : R / 255;
  }
  return { size, px: out };
}
const fill = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
const rgb = (r, b = 0) => `rgb(${r},0,${b})`;
const SPRITES = {
  terminal: paint(64, g => {
    fill(g, rgb(70), 26, 56, 12, 8); fill(g, rgb(90), 16, 26, 32, 24);
    fill(g, rgb(0, 45), 19, 29, 26, 18);
    fill(g, rgb(0, 255), 22, 32, 3, 5); fill(g, rgb(0, 150), 27, 34, 12, 1); fill(g, rgb(0, 150), 22, 39, 18, 1);
  }),
  // A typewriter on a desk, one sheet of paper still lit.
  typewriter: paint(64, g => {
    fill(g, rgb(55), 8, 42, 48, 4); fill(g, rgb(35), 11, 46, 4, 18); fill(g, rgb(35), 49, 46, 4, 18);
    fill(g, rgb(120), 16, 32, 32, 10); fill(g, rgb(0, 230), 22, 20, 20, 13);
    for (let y = 23; y < 31; y += 3) fill(g, rgb(0, 90), 24, y, 16, 1);
    for (let x = 18; x < 46; x += 4) fill(g, rgb(20), x, 37, 2, 2);
  }),
  // A black slab with four runes burning in it.
  monolith: paint(64, g => {
    g.fillStyle = rgb(80); g.beginPath(); g.moveTo(22, 64); g.lineTo(24, 2); g.lineTo(40, 2); g.lineTo(42, 64); g.fill();
    g.strokeStyle = rgb(0, 255); g.lineWidth = 1.4; g.beginPath();
    [8, 22, 36, 50].forEach((y, i) => {
      g.moveTo(32, y); g.lineTo(32, y + 10);
      if (i === 0) { g.moveTo(32, y + 2); g.lineTo(37, y); g.moveTo(32, y + 5); g.lineTo(37, y + 3); }
      if (i === 1) { g.moveTo(32, y); g.lineTo(36, y + 3); g.lineTo(36, y + 10); }
      if (i === 2) { g.moveTo(32, y + 2); g.lineTo(36, y + 5); g.lineTo(32, y + 8); }
      if (i === 3) { g.moveTo(32, y + 4); g.lineTo(28, y); g.moveTo(32, y + 4); g.lineTo(36, y); }
    });
    g.stroke();
  }),
  // A wall speaker on a post with an air tank chained beside it.
  intercom: paint(64, g => {
    fill(g, rgb(40), 28, 34, 6, 30); fill(g, rgb(95), 18, 10, 26, 26);
    for (let y = 14; y < 28; y += 3) fill(g, rgb(25), 22, y, 18, 1);
    fill(g, rgb(0, 255), 38, 30, 3, 3);
    fill(g, rgb(70), 46, 38, 10, 26); fill(g, rgb(110), 48, 34, 6, 4);
  }),
  note: paint(32, g => { fill(g, rgb(230), 9, 26, 14, 5); fill(g, rgb(90), 11, 28, 9, 1); }),
  echo: paint(32, g => { fill(g, rgb(0, 255), 15, 8, 2, 16); fill(g, rgb(0, 170), 12, 12, 8, 8); fill(g, rgb(0, 90), 9, 15, 14, 2); }),
  // A standing mirror with your own shape caught inside it, sliding toward you.
  reflection: paint(128, g => {
    g.fillStyle = rgb(0, 255); g.beginPath(); g.ellipse(64, 60, 31, 56, 0, 0, 7); g.fill();
    g.fillStyle = '#000001'; g.beginPath(); g.ellipse(64, 60, 26, 51, 0, 0, 7); g.fill();
    g.fillStyle = rgb(0, 120); g.beginPath(); g.ellipse(64, 44, 11, 14, 0, 0, 7); g.fill(); g.fillRect(50, 58, 28, 44);
    g.fillStyle = '#000001'; g.fillRect(58, 40, 4, 5); g.fillRect(67, 40, 4, 5); g.fillRect(62, 50, 5, 8);
    g.strokeStyle = rgb(0, 255); g.lineWidth = 1.6; g.beginPath();
    [[64, 60, 44, 28], [64, 60, 86, 34], [64, 60, 42, 92], [64, 60, 84, 96], [64, 60, 90, 62], [64, 60, 60, 12]].forEach(([a, b, c, d]) => { g.moveTo(a, b); g.lineTo((a + c) / 2 + 3, (b + d) / 2 - 2); g.lineTo(c, d); });
    g.stroke();
    fill(g, rgb(0, 170), 50, 114, 28, 5); fill(g, rgb(0, 170), 60, 112, 8, 16);
  }),
  // Torn cardboard on a stick, drawn on with marker. Cheap, stupid, and it still gets you.
  cutout: paint(128, g => {
    fill(g, rgb(70), 61, 86, 6, 42);
    g.fillStyle = rgb(0, 175); g.beginPath(); [[30, 18], [46, 12], [58, 17], [76, 9], [97, 16], [103, 42], [97, 66], [101, 88], [78, 94], [60, 90], [40, 96], [27, 82], [33, 58], [25, 38]].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
    g.fillStyle = rgb(0, 118); g.fillRect(30, 20, 70, 2); g.fillRect(33, 74, 64, 2); // cardboard creases
    g.strokeStyle = '#000001'; g.lineWidth = 3; g.fillStyle = '#000001';
    g.beginPath(); g.arc(49, 40, 9, 0, 7); g.moveTo(90, 38); g.arc(81, 38, 9, 0, 7); g.stroke();
    g.fillRect(47, 38, 4, 5); g.fillRect(80, 40, 4, 4);
    g.beginPath(); g.moveTo(37, 58); g.quadraticCurveTo(66, 92, 94, 56); g.stroke();
    g.lineWidth = 2; [44, 53, 62, 71, 80, 88].forEach((x, i) => { g.beginPath(); g.moveTo(x, 58 + (i % 2) * 3); g.lineTo(x + 1, 76 - Math.abs(x - 66) * .3); g.stroke(); });
    fill(g, rgb(0, 235), 72, 4, 16, 8); // tape
  }),
  // A doorway made of light.
  door: paint(128, g => {
    fill(g, rgb(0, 255), 30, 8, 68, 120); fill(g, rgb(0, 150), 37, 15, 54, 113);
    g.fillStyle = rgb(0, 255); g.fillRect(62, 34, 4, 94); g.fillRect(44, 66, 40, 4);
  }),
  fuse: paint(32, g => { fill(g, rgb(60), 13, 18, 6, 12); fill(g, rgb(0, 255), 14, 12, 4, 7); }),
  pixel: paint(32, g => { g.fillStyle = '#00ff00'; g.fillRect(15, 15, 2, 2); }),
  watcher: paint(128, g => {
    g.fillStyle = '#000001';
    g.beginPath(); g.ellipse(64, 30, 18, 22, 0, 0, 7); g.fill();
    g.fillRect(46, 30, 36, 18);
    g.beginPath(); g.moveTo(40, 58); g.quadraticCurveTo(64, 40, 88, 58); g.lineTo(94, 128); g.lineTo(34, 128); g.fill();
    g.fillStyle = rgb(0, 255); g.fillRect(56, 32, 4, 2); g.fillRect(68, 32, 4, 2);
  }),
};

export class World {
  constructor(canvas) {
    this.g = canvas.getContext('2d'); this.img = this.g.createImageData(W, H);
    this.lum = new Float32Array(W * H); this.secret = new Uint8Array(W * H);
    this.depth = new Float32Array(W);
    this.wall = makeTexture(.5, .5, 5, 11); this.floor = makeTexture(.28, .5, 2, 23); this.ceil = makeTexture(.16, .6, 2, 37);
    this.p = { x: 0, y: 0, a: 0, pitch: 0, bob: 0 };
    this.sprites = []; this.lights = []; this.staticAmt = 0; this.dark = 1; this.falloff = .7; this.fade = 1; this.pal = RED; this.realm = 'red'; this.grids = null; this.sky = false; this.moon = null;
  }
  load(rows, sky = false) {
    this.rows = rows.map(r => r.split('')); this.h = rows.length; this.w = rows[0].length; this.sky = sky;
  }
  // Two versions of the same building. Only one is ever under your feet.
  loadRealms(red, other) {
    this.grids = { red: red.map(r => r.split('')), other: other.map(r => r.split('')) };
    this.h = red.length; this.w = red[0].length; this.sky = false; this.setRealm('red');
  }
  setRealm(name) { this.realm = name; this.rows = this.grids[name]; this.pal = name === 'other' ? OTHER : RED; }
  solidIn(name, x, y) { return SOLID.has((this.grids[name][y | 0] || [])[x | 0] ?? '#'); }
  canBe(name, x, y, R = .26) { return ![[-R, -R], [R, -R], [-R, R], [R, R]].some(([a, b]) => this.solidIn(name, x + a, y + b)); }
  inRealm(s) { return !s.realm || s.realm === this.realm; }
  at(x, y) { return (this.rows[y | 0] || [])[x | 0] ?? '#'; }
  solid(x, y) { return SOLID.has(this.at(x, y)); }
  open(ch) { for (const g of this.grids ? Object.values(this.grids) : [this.rows]) for (const r of g) for (let i = 0; i < r.length; i++) if (r[i] === ch) r[i] = '.'; }
  find(ch) { const o = []; this.rows.forEach((r, y) => r.forEach((c, x) => { if (c === ch) o.push([x + .5, y + .5]); })); return o; }

  move(dx, dy) {
    const R = .24, p = this.p;
    const clear = (x, y) => !this.solid(x - R, y - R) && !this.solid(x + R, y - R) && !this.solid(x - R, y + R) && !this.solid(x + R, y + R)
      && !this.sprites.some(s => s.block && this.inRealm(s) && Math.hypot(s.x - x, s.y - y) < .42);
    if (clear(p.x + dx, p.y)) p.x += dx;
    if (clear(p.x, p.y + dy)) p.y += dy;
  }
  // Is a world point on screen and not hidden behind a wall?
  sees(x, y) {
    const p = this.p; let d = Math.atan2(y - p.y, x - p.x) - p.a;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    return Math.abs(d) < FOV / 2 + .05 && this.los(p.x, p.y, x, y);
  }
  los(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 6);
    for (let i = 1; i < n; i++) if (this.solid(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false;
    return true;
  }
  light(x, y, d) {
    let l = this.dark / (1 + d * d * this.falloff);
    for (const s of this.lights) { if (!this.inRealm(s)) continue; const q = (s.x - x) ** 2 + (s.y - y) ** 2; if (q < 40) l += s.i / (1 + q * s.k); }
    return l;
  }
  render(t) {
    const { lum, secret, depth, p } = this, cos = Math.cos(p.a), sin = Math.sin(p.a);
    const plane = Math.tan(FOV / 2), horizon = (H >> 1) + (p.pitch | 0) + (Math.sin(p.bob) * 1.6 | 0) + (p.sink | 0);
    const dl = [cos + sin * plane, sin - cos * plane], dr = [cos - sin * plane, sin + cos * plane];
    const hs = W / (4 * plane);
    secret.fill(0);
    // floor and ceiling
    for (let y = 0; y < H; y++) {
      const dy = y - horizon, row = y * W;
      if (dy === 0) { lum.fill(0, row, row + W); continue; }
      const floor = dy > 0;
      if (!floor && this.sky) { lum.fill(0, row, row + W); continue; }
      const dist = hs / Math.abs(dy), tex = floor ? this.floor : this.ceil;
      let fx = p.x + dist * dl[0], fy = p.y + dist * dl[1];
      const sx = dist * (dr[0] - dl[0]) / W, sy = dist * (dr[1] - dl[1]) / W;
      let l = 0;
      for (let x = 0; x < W; x++, fx += sx, fy += sy) {
        if (!(x & 3)) l = this.light(fx, fy, dist);
        lum[row + x] = tex[(fy * TEX & 63) * TEX + (fx * TEX & 63)] * l;
      }
    }
    // walls
    for (let x = 0; x < W; x++) {
      const cam = 2 * x / W - 1;
      const rx = cos - sin * plane * cam, ry = sin + cos * plane * cam;
      let mx = p.x | 0, my = p.y | 0, side = 0;
      const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry), stx = rx < 0 ? -1 : 1, sty = ry < 0 ? -1 : 1;
      let sdx = (rx < 0 ? p.x - mx : mx + 1 - p.x) * ddx, sdy = (ry < 0 ? p.y - my : my + 1 - p.y) * ddy;
      for (let i = 0; i < 64; i++) {
        if (sdx < sdy) { sdx += ddx; mx += stx; side = 0; } else { sdy += ddy; my += sty; side = 1; }
        if (this.solid(mx, my)) break;
      }
      const d = Math.max(.05, side ? sdy - ddy : sdx - ddx); depth[x] = d;
      const hx = p.x + rx * d, hy = p.y + ry * d, u = side ? hx - (hx | 0) : hy - (hy | 0);
      const lh = hs / d, top = Math.max(0, horizon - lh | 0), bot = Math.min(H, horizon + lh | 0);
      const l = this.light(hx, hy, d) * (side ? .78 : 1), tu = u * TEX & 63;
      for (let y = top; y < bot; y++) {
        const v = ((y - horizon + lh) / (2 * lh)) * TEX & 63;
        lum[y * W + x] = this.wall[v * TEX + tu] * l;
      }
    }
    this.drawSprites(cos, sin, plane, horizon, hs);
    this.compose(t);
    if (this.sky && this.moon && this.moon.complete) this.drawMoon(horizon, plane);
  }
  drawSprites(cos, sin, plane, horizon, hs) {
    const p = this.p, list = this.sprites.filter(s => !s.hidden && s.sprite && this.inRealm(s))
      .map(s => ({ s, d: (s.x - p.x) * cos + (s.y - p.y) * sin })).filter(o => o.d > .15).sort((a, b) => b.d - a.d);
    for (const { s, d } of list) {
      const lat = -(s.x - p.x) * sin + (s.y - p.y) * cos, sp = SPRITES[s.sprite];
      const sx = W / 2 + lat / d * (W / 2) / plane, size = hs * 2 / d * (s.scale || 1);
      const floorY = horizon + hs / d, x0 = sx - size / 2 | 0, y0 = floorY - size | 0;
      const l = this.light(s.x, s.y, d);
      for (let x = Math.max(0, x0); x < Math.min(W, x0 + size); x++) {
        if (this.depth[x] < d) continue;
        const tx = (x - x0) / size * sp.size | 0;
        for (let y = Math.max(0, y0); y < Math.min(H, y0 + size); y++) {
          const v = sp.px[((y - y0) / size * sp.size | 0) * sp.size + tx];
          if (v < 0) continue;
          const i = y * W + x;
          if (v === 9) { this.secret[i] = 1; continue; }
          this.lum[i] = v >= 2 ? v - 2 + (s.glow || .1) : v * l;
        }
      }
    }
  }
  compose(t) {
    const { lum, secret, staticAmt, fade } = this, PAL = this.pal, d = this.img.data, last = PAL.length - 1;
    const nS = staticAmt > 0 ? rng(t * 1000 | 0) : null;
    for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
      const o = i * 4; let c;
      if (secret[i]) c = SECRET;
      else {
        let v = lum[i];
        if (nS && nS() < staticAmt) v = nS() * .5;
        v = Math.pow(Math.max(0, v * fade), .85) * last;
        const lo = Math.min(last, v | 0), f = v - lo;
        c = PAL[Math.min(last, lo + (f > BAYER[(y & 3) * 4 + (x & 3)] ? 1 : 0))];
      }
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    this.g.putImageData(this.img, 0, 0);
  }
  drawMoon(horizon, plane) {
    const p = this.p, dist = Math.max(1, p.y - 0.5), size = Math.min(150, 2200 / (dist + 14));
    const lat = Math.atan2(Math.sin(p.a + Math.PI / 2), Math.cos(p.a + Math.PI / 2));
    const cx = W / 2 - lat / plane * (W / 2), cy = horizon - size * .62;
    const g = this.g; g.save(); g.beginPath(); g.rect(0, 0, W, Math.max(0, horizon)); g.clip();
    g.globalCompositeOperation = 'lighten'; g.imageSmoothingEnabled = false;
    const w = size * this.moon.width / this.moon.height;
    g.drawImage(this.moon, cx - w / 2, cy - size / 2, w, size); g.restore();
  }
}

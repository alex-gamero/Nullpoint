// Full-screen screamers. Each face is a little height map lit by a real light,
// so skin, bone and sockets have volume, then it is dithered down to pixel art.
const W = 240, H = 135, FW = 200, FH = 225, KEYS = 6;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const PALS = {
  watcher: [[5, 4, 8], [38, 10, 22], [104, 20, 36], [186, 40, 42], [246, 150, 108], [255, 244, 225]],
  mirror: [[3, 9, 13], [10, 42, 52], [24, 96, 100], [72, 180, 165], [178, 240, 216], [250, 255, 245]],
};
const gray = v => `rgb(${v},${v},${v})`;
const UPPER = [9, 14, 8, 18, 11, 7, 15, 20, 8, 12, 17, 9, 13], LOWER = [7, 12, 16, 8, 13, 9, 18, 10, 7, 14, 9, 11];

// Smooth noise for skin that isn't perfectly clean.
const NOISE = (() => { let s = 91; const n = new Float32Array(4096); for (let i = 0; i < 4096; i++) { s = (s * 1664525 + 1013904223) >>> 0; n[i] = s / 4294967296; } return n; })();
function bumpy(x, y) {
  const fx = (x + 2) * 14, fy = (y + 2) * 14, ix = fx | 0, iy = fy | 0, a = fx - ix, b = fy - iy, at = (i, j) => NOISE[(j * 64 + i) & 4095];
  return (at(ix, iy) * (1 - a) + at(ix + 1, iy) * a) * (1 - b) + (at(ix, iy + 1) * (1 - a) + at(ix + 1, iy + 1) * a) * b;
}
function faceParts(kind, open) {
  const my = .3 + .13 * open, ry = .09 + .3 * open, rx = .33 + .07 * open;
  const g = kind === 'mirror'
    ? [[-.28, -.3, .19, .2 + open * .05, -.72], [.3, -.28, .17, .19 + open * .05, -.72], [-.28, -.56, .22, .05, .1], [.3, -.54, .22, .05, .1], [-.46, .1, .1, .32, -.25], [.46, .1, .1, .32, -.25], [0, -.02, .05, .13, .12], [0, my, rx, ry, -1.15]]
    : [[-.3, -.27, .19, .19 + open * .05, -.66], [.31, -.25, .18, .2 + open * .05, -.66], [-.31, -.5, .25, .07, .2], [.32, -.48, .25, .07, .2], [-.56, .02, .15, .14, .2], [.56, .02, .15, .14, .2], [-.48, .34, .13, .2, -.3], [.48, .34, .13, .2, -.3], [0, -.05, .07, .2, .28], [-.07, .09, .035, .05, -.32], [.07, .09, .035, .05, -.32], [0, my, rx, ry, -1.15]];
  return { g, my, ry, rx };
}
function heightOf(kind, parts, X, Y) {
  const ex = X / (kind === 'mirror' ? .72 : .86), ey = Y / (kind === 'mirror' ? .98 : .94), q = 1 - ex * ex - ey * ey;
  if (q <= 0) return -1;
  let h = Math.sqrt(q) * .9 + (bumpy(X, Y) - .5) * .05;
  for (const [x, y, sx, sy, a] of parts.g) { const dx = (X - x) / sx, dy = (Y - y) / sy; h += a * Math.exp(-(dx * dx + dy * dy)); }
  if (kind === 'mirror') h += Math.sin(Y * 42) * .012 * (Y < -.55 ? 1 : 0);
  else h += Math.sin(X * 30 + Y * 9) * .008;
  return h;
}
function teeth(g, cx, y, halfW, sizes, dir, base, tip) {
  sizes.forEach((len, i) => {
    const u = i / (sizes.length - 1) * 2 - 1, x = cx + u * halfW, w = 2.4 + (i % 3) * .8, y0 = y - (1 - u * u) * 5 * dir, l = len * dir;
    const f = g.createLinearGradient(x, y0, x, y0 + l); f.addColorStop(0, gray(base)); f.addColorStop(1, gray(tip));
    g.fillStyle = f; g.beginPath(); g.moveTo(x - w, y0); g.quadraticCurveTo(x - w * .3, y0 + l * .6, x + (i % 2 ? 1 : -1), y0 + l); g.quadraticCurveTo(x + w * .4, y0 + l * .5, x + w, y0); g.fill();
    g.strokeStyle = gray(15); g.lineWidth = .6; g.beginPath(); g.moveTo(x + w, y0); g.lineTo(x + w * .4, y0 + l * .5); g.stroke();
  });
}
function buildFace(kind, open) {
  const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH;
  const g = cv.getContext('2d'), im = g.createImageData(FW, FH), d = im.data, parts = faceParts(kind, open);
  const L = kind === 'mirror' ? [-.5, -.55, .67] : [-.34, .78, .52], e = .012;
  for (let y = 0, o = 0; y < FH; y++) for (let x = 0; x < FW; x++, o += 4) {
    const X = (x - FW / 2) / (FW / 2), Y = (y - FH / 2) / (FH / 2), h = heightOf(kind, parts, X, Y);
    let v = 0;
    if (h > -1) {
      const dx = (heightOf(kind, parts, X + e, Y) - heightOf(kind, parts, X - e, Y)) / (2 * e) * .55;
      const dy = (heightOf(kind, parts, X, Y + e) - heightOf(kind, parts, X, Y - e)) / (2 * e) * .55;
      const m = Math.hypot(dx, dy, 1), diff = Math.max(0, (-dx * L[0] - dy * L[1] + L[2]) / m), spec = Math.pow(diff, 14) * .35;
      const deep = Math.min(1, Math.max(0, (h + .3) * 1.5));
      v = (.04 + diff * (kind === 'mirror' ? .95 : .7) + spec) * deep;
    }
    const c = Math.min(255, v * 255); d[o] = d[o + 1] = d[o + 2] = c; d[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const px = X => FW / 2 + X * FW / 2, py = Y => FH / 2 + Y * FH / 2;
  // inside the mouth: throat, gums, teeth
  const cx = px(0), top = py(parts.my - parts.ry), bot = py(parts.my + parts.ry), w = parts.rx * FW / 2;
  if (open > .1) {
    const f = g.createRadialGradient(cx, top + (bot - top) * .78, 2, cx, top + (bot - top) * .78, w * .7); f.addColorStop(0, gray(135)); f.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = f; g.beginPath(); g.ellipse(cx, top + (bot - top) * .8, w * .62, (bot - top) * .2, 0, 0, 7); g.fill();
    g.strokeStyle = gray(190); g.lineWidth = .7; [-.5, .1, .55].forEach(u => { g.beginPath(); g.moveTo(cx + u * w, top + 11); g.quadraticCurveTo(cx + u * w + 2, (top + bot) / 2, cx + u * w - 1, bot - 9); g.stroke(); });
  }
  teeth(g, cx, top + 7, w * .78, UPPER, 1, 118, 250);
  teeth(g, cx, bot - 6, w * .72, LOWER, -1, 96, 228);
  if (kind === 'watcher') {
    [[-.3, -.26], [.31, -.24]].forEach(([x, y]) => { g.fillStyle = gray(145); g.beginPath(); g.arc(px(x), py(y), 4.2, 0, 7); g.fill(); g.fillStyle = gray(255); g.beginPath(); g.arc(px(x) + .5, py(y), 2.7, 0, 7); g.fill(); g.fillStyle = gray(5); g.beginPath(); g.arc(px(x) + .8, py(y) + .4, 1, 0, 7); g.fill(); });
    // wet black hair falling in front of the face
    for (let i = 0; i < 90; i++) {
      const u = i / 89 * 2 - 1, side = Math.abs(u), x0 = px(u * .5), reach = side > .45 ? FH : 34 + (i * 53) % 38;
      g.strokeStyle = gray((i * 37) % 3 ? 4 : 22); g.lineWidth = 1 + (i % 3) * .7; g.beginPath(); g.moveTo(x0, 0); g.quadraticCurveTo(px(u * .9), reach * .45, px(u * (.8 + side * .35)) + (i % 7) - 3, reach); g.stroke();
    }
  } else {
    [[-.28, -.28], [.3, -.26]].forEach(([x, y]) => { g.fillStyle = gray(4); g.fillRect(px(x) - .8, py(y + .16), 1.6, 34 + open * 25); });
    g.strokeStyle = gray(38); g.lineWidth = .8; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(px(-.48), py(-.86 + i * .035)); g.quadraticCurveTo(px(0), py(-.91 + i * .035), px(.48), py(-.86 + i * .035)); g.stroke(); }
  }
  return cv;
}
const cache = {};
const faces = kind => (cache[kind] ||= Array.from({ length: KEYS }, (_, i) => buildFace(kind, i / (KEYS - 1))));
// Build ahead of time so the first scare never stalls.
export function prepareScares() { [['watcher', 0], ['mirror', 200]].forEach(([k, at]) => setTimeout(() => faces(k), 300 + at)); }

export function screamer(kind, ms = 560) {
  const cv = document.getElementById('scare'), c = cv.getContext('2d', { willReadFrequently: true });
  cv.width = W; cv.height = H; cv.hidden = false;
  const pal = PALS[kind], last = pal.length - 1, set = faces(kind);
  let seed = 7; const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const frame = (t, step) => {
    const open = Math.min(.6, t * 1.8), img = set[Math.round(open * (KEYS - 1))];
    // it is already in your face on frame one, then keeps coming
    const zoom = 1.18 + .34 * (1 - (1 - t) * (1 - t)), kick = 9 * (1 - t * .35);
    const fh = H * zoom * 1.5, fw = fh * FW / FH * 1.32, ox = (W - fw) / 2 + (r() - .5) * kick, oy = (H - fh) / 2 + (r() - .5) * kick;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.translate(W / 2, H / 2); c.rotate((r() - .5) * .07); c.translate(-W / 2, -H / 2);
    c.imageSmoothingEnabled = true; c.drawImage(img, ox, oy, fw, fh);
    const im = c.getImageData(0, 0, W, H), d = im.data, flash = step === 0 ? 1.7 : step === 1 ? 1.25 : 1;
    for (let y = 0; y < H; y++) {
      const tear = r() < .05 ? (r() * 22 - 11) | 0 : 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + ((x + tear + W) % W)) * 4, o = (y * W + x) * 4;
        const v = Math.min(last, (d[i] / 255) * last * flash + (r() < .015 ? r() * .6 : 0)), lo = v | 0;
        const col = pal[Math.min(last, lo + (v - lo > BAYER[(y & 3) * 4 + (x & 3)] ? 1 : 0))];
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
    }
    c.putImageData(im, 0, 0);
  };
  return new Promise(res => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { frame(1, 9); setTimeout(() => { cv.hidden = true; res(); }, ms); return; }
    let step = 0; const steps = Math.max(5, Math.round(ms / 45));
    frame(0, step);
    const id = setInterval(() => {
      step++; frame(Math.min(1, step / steps), step);
      if (step >= steps) { clearInterval(id); cv.hidden = true; res(); }
    }, 45);
  });
}

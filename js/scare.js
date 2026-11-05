// Full-screen pixel-art screamers, drawn live and dithered to the game's colors.
const W = 320, H = 180;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const PALS = {
  red: [[6, 5, 9], [40, 12, 24], [110, 22, 38], [190, 42, 44], [245, 150, 110], [255, 244, 225]],
  teal: [[3, 10, 14], [10, 44, 54], [24, 96, 100], [70, 180, 165], [175, 240, 215], [250, 255, 245]],
};
const gray = v => `rgb(${v},${v},${v})`;
const oval = (g, x, y, rx, ry, fill, rot = 0) => { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); g.fill(); };
const glow = (g, x, y, r0, r1, a, b) => { const f = g.createRadialGradient(x, y, r0, x, y, r1); f.addColorStop(0, gray(a)); f.addColorStop(1, gray(b)); return f; };
// Hand-placed so that no two teeth match.
const UPPER = [9, 13, 8, 17, 11, 7, 14, 19, 8, 12, 16, 9, 13];
const LOWER = [7, 11, 15, 8, 12, 9, 17, 10, 7, 13, 9, 11];

function teeth(g, cx, y, halfW, sizes, dir, base, tip) {
  sizes.forEach((len, i) => {
    const u = i / (sizes.length - 1) * 2 - 1, x = cx + u * halfW, w = 3.4 + (i % 3);
    const curve = (1 - u * u) * 8 * dir, y0 = y - curve, l = len * dir;
    const f = g.createLinearGradient(x, y0, x, y0 + l); f.addColorStop(0, gray(base)); f.addColorStop(1, gray(tip));
    g.fillStyle = f; g.beginPath(); g.moveTo(x - w, y0); g.quadraticCurveTo(x - w * .3, y0 + l * .6, x + (i % 2 ? 1 : -1), y0 + l); g.quadraticCurveTo(x + w * .4, y0 + l * .5, x + w, y0); g.fill();
    g.strokeStyle = gray(20); g.lineWidth = .6; g.beginPath(); g.moveTo(x + w, y0); g.lineTo(x + w * .4, y0 + l * .5); g.stroke();
  });
}
function mouth(g, cx, top, w, h) {
  // lips and stretched skin
  oval(g, cx, top + h / 2, w + 5, h / 2 + 5, gray(26));
  oval(g, cx, top + h / 2, w, h / 2, glow(g, cx, top + h * .62, 2, Math.max(w, h / 2), 0, 54));
  // throat falling away, tongue in shadow
  oval(g, cx, top + h * .8, w * .55, h * .22, glow(g, cx, top + h * .74, 1, w * .55, 150, 36));
  g.fillStyle = gray(10); oval(g, cx, top + h * .52, w * .34, h * .17, gray(0));
  // gums
  g.strokeStyle = gray(112); g.lineWidth = 4; g.beginPath(); g.ellipse(cx, top + h / 2, w - 2, h / 2 - 2, 0, 3.5, 5.92); g.stroke();
  g.beginPath(); g.ellipse(cx, top + h / 2, w - 2, h / 2 - 2, 0, .36, 2.78); g.stroke();
  teeth(g, cx, top + 12, w * .84, UPPER, 1, 128, 248);
  teeth(g, cx, top + h - 11, w * .78, LOWER, -1, 104, 225);
  // saliva strung between the jaws
  g.strokeStyle = gray(205); g.lineWidth = .7; [-.5, .08, .55].forEach(u => { g.beginPath(); g.moveTo(cx + u * w, top + 16); g.quadraticCurveTo(cx + u * w + 2, top + h / 2, cx + u * w - 1, top + h - 14); g.stroke(); });
}
function socket(g, x, y, rx, ry, pupil) {
  oval(g, x, y, rx + 4, ry + 4, glow(g, x, y, rx * .6, rx + 5, 8, 56));
  oval(g, x, y, rx, ry, glow(g, x, y, 1, rx, 0, 12));
  oval(g, x, y + 1, pupil + 2.2, pupil + 2.2, gray(120)); oval(g, x, y + 1, pupil, pupil, gray(255)); oval(g, x + .6, y + 1, pupil * .35, pupil * .35, gray(10));
  g.strokeStyle = gray(18); g.lineWidth = 1; g.beginPath(); g.moveTo(x - rx - 2, y - ry * .3); g.quadraticCurveTo(x, y - ry - 5, x + rx + 2, y - ry * .3); g.stroke();
}
function drawWatcher(g, t, r) {
  const s = .52 + 1.55 * t * t, cx = W / 2 + (r() - .5) * 9 * t, cy = H * .56 + (r() - .5) * 7 * t, open = Math.min(1, t * 1.7);
  g.fillStyle = glow(g, W / 2, H / 2, 10, 170, 44, 6); g.fillRect(0, 0, W, H);
  g.save(); g.translate(cx, cy); g.scale(s, s); g.rotate((r() - .5) * .06 * t);
  // hair: strands, not a shape
  oval(g, 0, -10, 54, 58, gray(7)); g.fillStyle = gray(7); g.fillRect(-54, -10, 108, 62);
  for (let i = 0; i < 46; i++) {
    const x = -52 + i * 2.3, v = 12 + (i * 37) % 30;
    g.strokeStyle = gray(v); g.lineWidth = .8; g.beginPath(); g.moveTo(x * .45, -58); g.quadraticCurveTo(x * 1.1, -20, x + (i % 5) - 2, 44 + (i * 11) % 24); g.stroke();
  }
  // skull under the skin, lit from below
  oval(g, 0, 2, 35, 45, glow(g, 0, 26, 4, 50, 150, 22));
  oval(g, -24, 16, 8, 14, gray(30), .3); oval(g, 24, 16, 8, 14, gray(30), -.3); // hollow cheeks
  g.fillStyle = gray(24); g.fillRect(-29, -20, 58, 4); // brow
  socket(g, -14, -10, 11 + open * 2, 12 + open * 4, 1.8);
  socket(g, 14, -9, 10 + open * 2, 13 + open * 4, 1.5);
  oval(g, -3.2, 7, 1.7, 3.3, gray(0), .25); oval(g, 3.2, 7, 1.7, 3.3, gray(0), -.25); // torn nose
  // creases where the jaw pulls the face apart
  g.strokeStyle = gray(48); g.lineWidth = .8; [[-23, 2, -30, 34], [23, 2, 30, 34], [-10, -24, -5, -33], [10, -24, 6, -33], [-17, 8, -24, 18], [17, 8, 24, 18]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 + 2, (b + d) / 2, c, d); g.stroke(); });
  mouth(g, 0, 12, 21 + open * 4, 16 + open * 46);
  g.restore();
}
function drawMirror(g, t, r) {
  const s = .55 + 1.5 * t * t, open = Math.min(1, t * 1.7);
  g.fillStyle = glow(g, W / 2, H / 2, 10, 170, 36, 4); g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2 + (r() - .5) * 8 * t, H / 2 + 4 + (r() - .5) * 6 * t); g.scale(s, s); g.rotate(.09 + (r() - .5) * .05 * t);
  // a face stretched too long, with nothing behind the eyes
  oval(g, 0, -4, 30, 59, glow(g, -6, -18, 4, 62, 225, 38));
  oval(g, -22, 6, 8, 25, gray(46), .08); oval(g, 22, 6, 8, 25, gray(46), -.08);
  g.strokeStyle = gray(82); g.lineWidth = .8; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(-20, -48 + i * 3); g.quadraticCurveTo(0, -52 + i * 3, 20, -48 + i * 3); g.stroke(); }
  socket(g, -12, -22, 9, 13 + open * 5, .01); socket(g, 12, -22, 9, 13 + open * 5, .01);
  [[-12, -11], [12, -11]].forEach(([x, y]) => { g.fillStyle = gray(10); g.fillRect(x - .7, y + open * 4, 1.4, 16 + open * 13); }); // black tears
  g.fillStyle = gray(0); g.beginPath(); g.moveTo(-2, -5); g.lineTo(2, -5); g.lineTo(0, 2); g.fill();
  mouth(g, 2, 4, 15 + open * 4, 12 + open * 38);
  g.restore();
}
export function screamer(kind, ms = 780) {
  const cv = document.getElementById('scare'), c = cv.getContext('2d', { willReadFrequently: true });
  cv.width = W; cv.height = H; cv.hidden = false;
  const pal = kind === 'mirror' ? PALS.teal : PALS.red, last = pal.length - 1;
  const draw = kind === 'mirror' ? drawMirror : drawWatcher;
  let seed = 7; const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const frame = t => {
    c.setTransform(1, 0, 0, 1, 0, 0);
    draw(c, t, r);
    const im = c.getImageData(0, 0, W, H), d = im.data;
    for (let y = 0; y < H; y++) {
      const tear = r() < .04 * t ? (r() * 18 - 9) | 0 : 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + ((x + tear + W) % W)) * 4, o = (y * W + x) * 4;
        let v = (d[i] / 255) * last + (r() < .02 ? r() * .5 : 0);
        const lo = Math.min(last, v | 0), col = pal[Math.min(last, lo + (v - lo > BAYER[(y & 3) * 4 + (x & 3)] ? 1 : 0))];
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
    }
    c.putImageData(im, 0, 0);
  };
  return new Promise(res => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { frame(1); setTimeout(() => { cv.hidden = true; res(); }, ms); return; }
    let step = 0; const steps = Math.round(ms / 42);
    const id = setInterval(() => { // a low frame rate on purpose: it hits harder
      step++; frame(Math.min(1, step / (steps * .8)));
      if (step >= steps) { clearInterval(id); cv.hidden = true; res(); }
    }, 42);
  });
}

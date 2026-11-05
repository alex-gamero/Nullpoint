// Full-screen pixel-art screamers, drawn live and dithered to the game's colors.
const W = 240, H = 135;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const PALS = {
  red: [[6, 5, 9], [40, 12, 24], [110, 22, 38], [190, 42, 44], [245, 150, 110], [255, 244, 225]],
  teal: [[3, 10, 14], [10, 44, 54], [24, 96, 100], [70, 180, 165], [175, 240, 215], [250, 255, 245]],
};
const gray = v => `rgb(${v},${v},${v})`;
const blob = (g, x, y, rx, ry, v) => { g.fillStyle = gray(v); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };

function drawWatcher(g, t, r) {
  const s = .5 + 1.5 * t * t, cx = W / 2 + (r() - .5) * 8 * t, cy = H * .56 + (r() - .5) * 6 * t;
  g.save(); g.translate(cx, cy); g.scale(s, s); g.rotate((r() - .5) * .07 * t);
  // hair and shoulders, the shape you have been seeing in the dark
  blob(g, 0, -6, 46, 52, 8);
  g.fillStyle = gray(8); g.fillRect(-46, -8, 92, 48);
  for (let i = -44; i < 44; i += 7) { g.fillRect(i, 36, 5, 10 + r() * 10); }
  // rim of light so the silhouette reads
  g.strokeStyle = gray(90); g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, -6, 46, 52, 0, 3.4, 6); g.stroke();
  // a face that was not there before
  blob(g, 0, 2, 31, 38, 62);
  const open = Math.min(1, t * 1.7);
  [-13, 13].forEach(x => {
    blob(g, x, -9, 11, 12 + 3 * open, 0);
    blob(g, x + (r() - .5) * 2, -8, 2.2, 2.2, 255);
    g.strokeStyle = gray(150); g.lineWidth = 1; g.beginPath(); g.moveTo(x, 4 + 3 * open); g.lineTo(x - 2, 17); g.stroke();
  });
  // the mouth opens far past where a jaw should stop
  const m = 5 + 25 * open;
  blob(g, 0, 15 + m * .55, 20, m, 0);
  blob(g, 0, 19 + m * .8, 12, m * .55, 118);
  g.fillStyle = gray(240);
  for (let x = -17; x <= 17; x += 5) {
    const edge = Math.sqrt(Math.max(0, 1 - (x / 20) ** 2)) * m;
    g.beginPath(); g.moveTo(x - 2.3, 15 + m * .55 - edge); g.lineTo(x + 2.3, 15 + m * .55 - edge); g.lineTo(x, 15 + m * .55 - edge + 7); g.fill();
    g.beginPath(); g.moveTo(x - 2.3, 15 + m * .55 + edge); g.lineTo(x + 2.3, 15 + m * .55 + edge); g.lineTo(x, 15 + m * .55 + edge - 7); g.fill();
  }
  g.restore();
}
function drawMirror(g, t, r) {
  const s = .55 + 1.5 * t * t;
  g.save(); g.translate(W / 2 + (r() - .5) * 7 * t, H / 2 + (r() - .5) * 5 * t); g.scale(s, s);
  blob(g, 0, 0, 40, 60, 215); blob(g, 0, 0, 35, 55, 16);
  // your own outline, wrong
  blob(g, 0, -12, 17, 21, 160); g.fillStyle = gray(160); g.fillRect(-23, 11, 46, 45);
  const open = Math.min(1, t * 1.7);
  [-7, 7].forEach(x => blob(g, x, -16, 4.5, 6 + 3 * open, 0));
  blob(g, 0, 0 + 3 * open, 5 + 2 * open, 3 + 13 * open, 0);
  // the glass breaks outward from the face
  g.strokeStyle = gray(255); g.lineWidth = 1.1;
  for (let i = 0; i < 12; i++) {
    const a = i * .52 + 1.1 * Math.sin(i * 7.3), l = 22 + 60 * t;
    g.beginPath(); g.moveTo(0, -6); g.lineTo(Math.cos(a) * l * .5 + 3 * Math.sin(i * 3), Math.sin(a) * l * .5 - 6); g.lineTo(Math.cos(a) * l, Math.sin(a) * l - 6); g.stroke();
  }
  g.restore();
}
export function screamer(kind, ms = 780) {
  const cv = document.getElementById('scare'), c = cv.getContext('2d', { willReadFrequently: true });
  cv.width = W; cv.height = H; cv.hidden = false;
  const pal = kind === 'mirror' ? PALS.teal : PALS.red, last = pal.length - 1;
  const draw = kind === 'mirror' ? drawMirror : drawWatcher;
  let seed = 7; const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const frame = t => {
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = gray(frameDark(t)); c.fillRect(0, 0, W, H);
    draw(c, t, r);
    const im = c.getImageData(0, 0, W, H), d = im.data;
    for (let y = 0; y < H; y++) {
      const tear = r() < .04 * t ? (r() * 18 - 9) | 0 : 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + ((x + tear + W) % W)) * 4, o = (y * W + x) * 4;
        let v = (d[i] / 255) * last + (r() < .03 ? r() * .8 : 0);
        const lo = Math.min(last, v | 0), col = pal[Math.min(last, lo + (v - lo > BAYER[(y & 3) * 4 + (x & 3)] ? 1 : 0))];
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
    }
    c.putImageData(im, 0, 0);
  };
  const frameDark = t => (Math.floor(t * 9) % 2 ? 26 : 8);
  return new Promise(res => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { frame(1); setTimeout(() => { cv.hidden = true; res(); }, ms); return; }
    let step = 0; const steps = Math.round(ms / 42);
    const id = setInterval(() => { // a low frame rate on purpose: it hits harder
      step++; frame(Math.min(1, step / (steps * .8)));
      if (step >= steps) { clearInterval(id); cv.hidden = true; res(); }
    }, 42);
  });
}

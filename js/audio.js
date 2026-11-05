import { makePlayer } from './music.js';

let ctx, master, drone, player, playing = null, muted = false;
const tone = (f, d = .12, type = 'square', v = .05, when = 0) => {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + when;
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(master); o.start(t); o.stop(t + d);
};
const noise = (d, v, freq) => {
  if (!ctx) return;
  const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = b; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = v;
  s.connect(f).connect(g).connect(master); s.start();
};
export const audio = {
  start() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
    drone = ctx.createGain(); drone.gain.value = .09; f.connect(drone).connect(master);
    [41, 41.6, 61.9].forEach(n => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = n; o.connect(f); o.start(); });
    this.static = ctx.createGain(); this.static.gain.value = 0;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.connect(this.static).connect(master); s.start();
  },
  step() { noise(.09, .1, 420); },
  key() { tone(620 + Math.random() * 80, .025, 'square', .012); },
  door() { noise(.7, .5, 160); tone(55, .7, 'sawtooth', .12); },
  fuse() { tone(880, .1); tone(1320, .2, 'square', .04, .1); },
  shift() { noise(.8, .4, 500); tone(55, .8, 'sine', .22); tone(330, .7, 'sine', .05, .3); tone(495, .6, 'sine', .04, .42); },
  star() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .5, 'sine', .09, i * .09)); },
  scream() {
    noise(.8, .7, 4200); tone(62, .85, 'sawtooth', .28);
    [660, 932, 1245].forEach((f, i) => { tone(f, .75, 'sawtooth', .13); tone(f * 1.06, .75, 'square', .07, .03 * i); });
  },
  pop() { noise(.12, .35, 2600); tone(1400, .12, 'square', .09); tone(1900, .1, 'square', .07, .1); },
  steps() { for (let i = 0; i < 5; i++) setTimeout(() => noise(.1, .22, 260), 350 + i * 300); },
  sting() { noise(.5, .35, 2400); tone(92, .8, 'sawtooth', .16); },
  rune(i) { tone([196, 247, 294, 370][i], .32, 'triangle', .14); },
  bad() { tone(82, .4, 'sawtooth', .12); },
  melody() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, 'square', .05, i * .14)); },
  setStatic(v) { if (this.static) this.static.gain.setTargetAtTime(muted ? 0 : v * .1, ctx.currentTime, .05); },
  setDrone(v) { if (drone) drone.gain.setTargetAtTime(v, ctx.currentTime, .6); },
  play(track, vol = 1) {
    if (!ctx || track === playing) return;
    player ??= makePlayer(ctx, master);
    playing = track;
    if (track) player.start(track, vol); else player.stop();
  },
  stopMusic() { this.play(null); },
  toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 1; return muted; },
};

// The soundtrack is code: five small generative pieces, no audio files.
// Each track is a function called once per step; it decides what sounds at that moment.
const hz = m => 440 * 2 ** ((m - 69) / 12);

function makeKit(ctx, out) {
  const bus = ctx.createGain(); bus.gain.value = 1.6; bus.connect(out);
  const send = ctx.createGain(); send.gain.value = .32;
  const delay = ctx.createDelay(2), fb = ctx.createGain(), tone = ctx.createBiquadFilter();
  delay.delayTime.value = .46; fb.gain.value = .42; tone.type = 'lowpass'; tone.frequency.value = 1900;
  send.connect(delay); delay.connect(tone); tone.connect(fb); fb.connect(delay); tone.connect(bus);
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const voice = (type, m, t, dur, vol, o = {}) => {
    const v = ctx.createOscillator(), g = ctx.createGain();
    v.type = type; v.frequency.value = hz(m); v.detune.value = o.detune || 0;
    const a = o.attack ?? .005, r = o.release ?? dur * .8;
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + Math.max(a, dur - r));
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let tail = g;
    if (o.cut) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.cut; g.connect(f); tail = f; }
    tail.connect(bus); if (o.wet !== 0) { const w = ctx.createGain(); w.gain.value = o.wet ?? 1; tail.connect(w); w.connect(send); }
    v.connect(g); v.start(t); v.stop(t + dur + .02);
  };
  return {
    bell: (m, t, vol = .1, dur = 1.8) => { voice('sine', m, t, dur, vol, { release: dur }); voice('sine', m + 24.1, t, dur * .22, vol * .28, { release: dur * .2 }); },
    pluck: (m, t, vol = .05, dur = .2, cut = 1700) => voice('square', m, t, dur, vol, { cut, release: dur }),
    lead: (m, t, dur, vol = .09, cut = 2400) => voice('triangle', m, t, dur, vol, { attack: .03, release: dur * .5, cut }),
    bass: (m, t, dur, vol = .16) => voice('triangle', m, t, dur, vol, { attack: .012, release: dur * .5, wet: 0 }),
    pad: (notes, t, dur, vol = .022, cut = 900) => notes.forEach(m => [-7, 7].forEach(detune => voice('sawtooth', m, t, dur, vol, { attack: dur * .3, release: dur * .45, detune, cut, wet: .6 }))),
    thump: (t, vol = .3) => { const v = ctx.createOscillator(), g = ctx.createGain(); v.frequency.setValueAtTime(92, t); v.frequency.exponentialRampToValueAtTime(40, t + .24); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .36); v.connect(g); g.connect(bus); v.start(t); v.stop(t + .4); },
    tick: (t, vol = .03, dur = .035) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 5000; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random() * .8); s.stop(t + dur + .01); },
    wind: (t, dur, vol = .03, cut = 500) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = cut; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .5); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + dur); },
  };
}
// Chords written as midi triads around the middle of the keyboard.
const TRACKS = {
  // Good ending: open, slow, walking toward the moon. D major.
  good: { bpm: 66, stepsPerBar: 16, play(k, s, t, spb) {
    const prog = [[50, 57, 62, 66], [45, 57, 61, 64], [47, 59, 62, 66], [43, 55, 59, 62], [50, 57, 62, 66], [45, 57, 61, 64], [43, 55, 59, 62], [45, 57, 61, 64],
      [47, 59, 62, 66], [43, 55, 59, 62], [50, 57, 62, 66], [45, 57, 61, 64], [43, 55, 59, 62], [45, 57, 61, 64], [50, 57, 62, 66], [50, 57, 62, 66]];
    const bar = s >> 4, st = s & 15, cycle = bar >> 4, c = prog[bar % 16];
    if (st === 0) k.pad(c.slice(1), t, spb * 17, .02, 1100);
    if (st % 2 === 0 && (bar >= 1 || cycle)) { const a = [0, 1, 2, 3, 2, 3, 1, 2][st / 2]; k.bell(c[a] + 12 + (a === 0 ? 12 : 0), t, st === 0 ? .075 : .05, 1.5); }
    if (st === 0 && (cycle || bar >= 4)) k.bass(c[0] - 12 + 12, t, spb * 14, .12);
    const melody = { 0: [78, 16], 16: [76, 16], 32: [74, 8], 40: [78, 8], 48: [79, 16], 64: [81, 12], 76: [78, 4], 80: [76, 16], 96: [79, 8], 104: [81, 8], 112: [83, 16], 128: [79, 12], 140: [78, 4], 144: [76, 16], 160: [78, 8], 168: [74, 8], 176: [74, 32] };
    const m = melody[s % 256];
    if (m && (cycle >= 1 || bar >= 8)) k.lead(m[0], t, spb * m[1], cycle >= 2 ? .075 : .06, 2600);
    if (cycle >= 2 && st % 4 === 2) k.tick(t, .012);
  } },
  // Knight: a slow march, carrying something heavy. A minor in 3/4.
  knight: { bpm: 60, stepsPerBar: 12, play(k, s, t, spb) {
    const prog = [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62], [45, 57, 60, 64], [41, 57, 60, 65], [38, 57, 62, 65], [40, 56, 59, 64]];
    const bar = s / 12 | 0, st = s % 12, c = prog[bar % 8], cycle = bar >> 3;
    if (st === 0) { k.pad(c.slice(1), t, spb * 13, .023, 800); k.bass(c[0], t, spb * 8, .17); k.thump(t, .24); }
    if (st === 8 && bar % 2) k.thump(t, .12);
    if (st % 4 === 0 && cycle) k.pluck(c[1 + st / 4] + 12, t, .03, .45, 1200);
    const tune = [[69, 8], [72, 4], [71, 12], [67, 8], [64, 4], [65, 12], [67, 8], [72, 4], [74, 8], [72, 4], [71, 8], [69, 4], [68, 12]];
    let at = 0; for (const [m, len] of tune) { if ((s % 96) === at && (cycle || bar >= 2)) k.lead(m + (cycle >= 2 ? 12 : 0), t, spb * len, .08, 1800); at += len; }
  } },
  // Candidate: cold machine approval. D minor, relentless sixteenths.
  candidate: { bpm: 92, stepsPerBar: 16, play(k, s, t, spb) {
    const prog = [[50, 62, 65, 69], [50, 62, 65, 69], [46, 58, 62, 65], [45, 57, 61, 64], [50, 62, 65, 69], [48, 60, 63, 67], [46, 58, 62, 65], [45, 57, 61, 64]];
    const bar = s >> 4, st = s & 15, c = prog[bar % 8], cycle = bar >> 3;
    const arp = [1, 2, 3, 2][st % 4] + 0;
    k.pluck(c[arp] + 12, t, st % 4 === 0 ? .045 : .026, .13, cycle ? 2600 : 1500);
    if (st % 8 === 0) k.bass(c[0], t, spb * 6, .15);
    if (st % 4 === 2) k.tick(t, .018);
    if (st === 0) k.pad(c.slice(1), t, spb * 17, .012, 700);
    const tune = { 0: 81, 4: 77, 8: 74, 24: 76, 32: 77, 44: 74, 48: 73, 72: 69 };
    const n = tune[s % 128];
    if (n && (bar >= 4 || cycle)) k.lead(n, t, spb * 6, .055, 2200);
  } },
  // Kitten: a music box running down. E minor, too slow, slightly wrong.
  kitten: { bpm: 54, stepsPerBar: 12, play(k, s, t, spb) {
    const prog = [[52, 64, 67, 71], [48, 64, 67, 72], [45, 60, 64, 69], [47, 59, 63, 66]];
    const bar = s / 12 | 0, st = s % 12, c = prog[bar % 4], cycle = bar >> 3;
    if (st === 0) { k.pad(c.slice(1), t, spb * 13, .012, 600); k.bass(c[0], t, spb * 10, .09); }
    const fall = cycle % 2 ? -.12 : 0;
    if (st % 2 === 0) {
      const line = [76, 79, 83, 79, 76, 71, 72, 76, 79, 76, 72, 69, 69, 72, 76, 72, 69, 64, 71, 75, 78, 75, 71, 66];
      const n = line[(bar % 4) * 6 + st / 2];
      if (!(bar % 8 === 7 && st >= 8)) k.bell(n + 12 + fall, t, .058, 1.3);
    }
    if (st === 6 && bar % 4 === 3) k.tick(t, .02, .08);
  } },
  // Evaluator: the first question played backwards under a held tritone.
  inversion: { bpm: 44, stepsPerBar: 16, play(k, s, t, spb) {
    const bar = s >> 4, st = s & 15;
    if (st === 0 && bar % 2 === 0) { k.pad([37, 43, 49], t, spb * 34, .03, 420); k.wind(t, spb * 32, .025, 380); }
    if (st === 0) k.thump(t, bar % 4 === 3 ? .28 : .15);
    const motif = [69, 70, 66, 63, 62, 61, 66, 58];
    if (st % 4 === 0) { const n = motif[(s >> 2) % 8]; if ((bar % 8) > 1) k.bell(n, t, .05, 2.2); }
    if (st === 10 && bar % 4 === 2) k.lead(55, t, spb * 18, .05, 700);
  } },
};
export function renderSteps(ctx, out, id, seconds) { // used for rendering a track offline
  const tr = TRACKS[id], k = makeKit(ctx, out), spb = 60 / tr.bpm / 4; let s = 0;
  for (let t = .05; t < seconds; t += spb) tr.play(k, s++, t, spb);
}
export function makePlayer(ctx, dest) {
  let timer, gain;
  const stop = () => { clearInterval(timer); if (gain) { const g = gain; g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setTargetAtTime(.0001, ctx.currentTime, .5); setTimeout(() => g.disconnect(), 2500); gain = null; } };
  return {
    stop,
    start(id, vol = 1) {
      stop();
      const tr = TRACKS[id]; if (!tr) return;
      gain = ctx.createGain(); gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 3); gain.connect(dest);
      const k = makeKit(ctx, gain), spb = 60 / tr.bpm / 4; let s = 0, next = ctx.currentTime + .1;
      const pump = () => { while (next < ctx.currentTime + .6) { tr.play(k, s++, next, spb); next += spb; } };
      pump(); timer = setInterval(pump, 150);
    },
  };
}

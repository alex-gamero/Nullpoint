import { World } from './world.js';
import { Terminal } from './terminal.js';
import { audio } from './audio.js';
import { save } from './save.js';
import { erase } from './games/erase.js';
import { obey } from './games/obey.js';
import { trust } from './games/trust.js';
import { dungeon } from './games/dungeon.js';
import { brief } from './games/brief.js';
import { screamer } from './scare.js';

const $ = id => document.getElementById(id);
const story = await (await fetch('data/story.json')).json();
const canvas = $('view'), world = new World(canvas);
const term = new Terminal($('terminal'), () => audio.key());
const game = $('game');
const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛋᛏᛒᛖᛗᛚᛜ';
let speed = 2.5;
const SPEED = 2.5, TURN = 2.2, SENS = .0026;
const WING = { x: 20.5, y: 12.5 }; // the first cell past the east door
const ENDINGS = Object.keys(story.endings);

let run, mode = 'title', keys = new Set(), last = 0, stepT = 0, activeNote = null, rootMode = false, confirmRm = false;
const STARS = story.stars.length;
let reflection = null, scareT = 0, lurch = null;
let hunt = null, ghost = null, shifting = null, unseenRun = 0, exitCell = null;
const SENS_KEY = 'nullpoint.sens';
let sens = 1; try { sens = Math.min(3, Math.max(.2, +localStorage.getItem(SENS_KEY) || 1)); } catch { /* storage blocked */ }

/* ---------- world setup ---------- */
// One message at a time, long enough to read, and only while you can read it.
const messages = []; let messageUntil = 0;
const subtitle = (text, ms, urgent) => {
  if (urgent) { messages.length = 0; messageUntil = 0; }
  if (!messages.some(m => m.text === text)) messages.push({ text, ms: Math.max(ms || 0, 2400 + text.length * 45) });
};
function updateMessages(now) {
  const el = $('subtitle');
  if (mode !== 'world' && mode !== 'outside') { messageUntil += 16; el.textContent = ''; return; }
  if (now < messageUntil) { if (!el.textContent && messages.current) el.textContent = messages.current; return; }
  const next = messages.shift();
  messages.current = next ? next.text : '';
  el.textContent = messages.current;
  messageUntil = next ? now + next.ms : 0;
}
let objectiveShown = '';
function updateObjective() {
  if (!run || mode === 'title' || mode === 'ending') return;
  const o = story.objectives, n = run.flags.echoes?.length || 0, lines = [];
  if (n === STARS) lines.push(o.exit);
  else if (hunt) lines.push(o.hunt.replace('{n}', hunt.got));
  else if (run.stage === 'query') lines.push(o.query);
  else if (run.stage === 'test') lines.push(o.test[run.q]);
  else if (run.stage === 'done') lines.push(o.done);
  if (n && n < STARS) lines.push(o.stars.replace('{n}', n));
  const text = lines.join('\n');
  if (text !== objectiveShown) { objectiveShown = text; $('hud').textContent = text; }
}
const SPR = { O: ['obey', 'monolith'], E: ['erase', 'typewriter'], R: ['trust', 'intercom'] };
function loadHub() {
  world.loadRealms(story.maps.hub, story.maps.other);
  world.sprites = []; world.lights = [];
  const seenEchoes = run.flags.echoes ||= [];
  for (const realm of ['red', 'other']) {
    world.grids[realm].forEach((r, y) => r.forEach((c, x) => {
      const at = { x: x + .5, y: y + .5, realm };
      if (c === 'T') { world.sprites.push({ ...at, realm: null, id: 'terminal', sprite: 'terminal', block: true, glow: .15 }); world.lights.push({ ...at, realm: null, i: .55, k: .55 }); }
      if (SPR[c]) { world.sprites.push({ ...at, id: SPR[c][0], sprite: SPR[c][1], block: true, glow: .1 }); world.lights.push({ ...at, i: .3, k: .8 }); }
      if ('nmp'.includes(c)) world.sprites.push({ ...at, id: 'note', note: c, sprite: 'note', scale: .6 });
      if (c === 'G') world.sprites.push({ ...at, id: 'pixel', sprite: 'pixel', scale: .5 });
      if (c === 'F') world.sprites.push({ ...at, id: 'fuse', sprite: 'fuse', scale: .45, hidden: true, glow: .9 });
      if (c === 'W') world.sprites.push({ ...at, id: 'watcher', sprite: 'watcher', hidden: true, scale: 1.05, home: at });
      if ('wuvxy'.includes(c)) { world.sprites.push({ ...at, id: 'echo', echo: c, sprite: 'echo', scale: .8, glow: .8, hidden: seenEchoes.includes(c) }); if (!seenEchoes.includes(c)) world.lights.push({ ...at, i: .35, k: 1 }); }
      if (c === 'X') exitCell = { x, y };
      if (c !== '#' && c !== 'X' && !'1234'.includes(c)) r[x] = '.';
    }));
  }
  run.doors.forEach(d => world.open(d));
  (run.flags.cutouts || []).forEach(c => world.sprites.push({ id: 'cutout', sprite: 'cutout', plane: true, scale: 1, ...c }));
  if (seenEchoes.length === STARS) openExit();
  applyStars();
  world.dark = .78; world.falloff = .7; world.sky = false;
}
function applyStars() {
  const n = run.flags.echoes.length;
  world.dark = n >= 1 ? 1.05 : .78; world.falloff = n >= 1 ? .5 : .7;
  speed = n >= 2 ? 3 : SPEED;
}
function openExit() {
  world.open('X');
  world.sprites.push({ id: 'exit', sprite: 'door', realm: 'other', x: exitCell.x + .5, y: exitCell.y + .5, block: true, scale: 1.05, glow: .4 });
  world.lights.push({ x: exitCell.x + .5, y: exitCell.y + .5, realm: 'other', i: 1.4, k: .35 });
}
function placeSpawn(name) {
  const [x, y, a] = story.spawn[name];
  Object.assign(world.p, { x, y, a, pitch: 0, bob: 0 });
}
const openDoor = d => { if (!run.doors.includes(d)) { run.doors.push(d); world.open(d); audio.door(); save.write(); } };
const add = (obj, by = 1) => Object.keys(obj).forEach(k => { run.score[k] = (run.score[k] || 0) + obj[k] * by; });

/* ---------- movement and interaction ---------- */
function nearest() {
  const p = world.p; let best = null, bd = 1.35;
  for (const s of world.sprites) {
    if (s.hidden || !['terminal', 'erase', 'obey', 'trust', 'note', 'pixel', 'echo', 'exit'].includes(s.id) || !world.inRealm(s)) continue;
    const d = Math.hypot(s.x - p.x, s.y - p.y);
    if (d < bd && world.sees(s.x, s.y)) { bd = d; best = s; }
  }
  return best;
}
function startShift() {
  if (shifting || mode !== 'world') return;
  const to = world.realm === 'red' ? 'other' : 'red', p = world.p;
  if (!world.canBe(to, p.x, p.y)) { audio.bad(); return subtitle(story.shift.blocked, 1800); }
  shifting = { t: 0, to, swapped: false }; audio.shift(); keys.clear();
}
function updateShift(dt) {
  const s = shifting, p = world.p, D = .38;
  s.t += dt;
  if (!s.swapped && s.t >= D) {
    s.swapped = true; world.setRealm(s.to); audio.setDrone(s.to === 'other' ? .03 : .09);
    if (s.to === 'other') { unseenRun = 0; if (!run.flags.shifted) { run.flags.shifted = true; subtitle(story.shift.first, 3000); } }
    else if (unseenRun > 3) subtitle(story.shift.back.replace('{n}', Math.round(unseenRun)), 3000);
    if (s.to === 'red' && reflection) { reflection.hidden = true; reflection = null; }
    if (hunt) { hunt.lastRed = s.to === 'other' ? { x: p.x, y: p.y } : null; hunt.step = null; hunt.w.hidden = s.to === 'other'; }
    save.write();
  }
  const f = s.t < D ? s.t / D : (s.t - D) / D;
  world.fade = s.t < D ? 1 - f : f;
  p.sink = s.leaving ? 0 : s.t < D ? -130 * f * f : 130 * (1 - f) * (1 - f);
  if (s.leaving && s.t >= D) { shifting = null; world.fade = 1; p.sink = 0; return finish('author'); }
  if (s.t >= D * 2) { shifting = null; world.fade = 1; p.sink = 0; }
}
function update(dt) {
  const p = world.p;
  if (shifting) updateShift(dt);
  if (world.realm === 'other') {
    unseenRun += dt; run.flags.unseen = (run.flags.unseen || 0) + dt;
  }
  if (keys.has('ArrowLeft')) p.a -= TURN * sens * dt;
  if (keys.has('ArrowRight')) p.a += TURN * sens * dt;
  let f = 0, r = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) f++;
  if (keys.has('KeyS') || keys.has('ArrowDown')) f--;
  if (keys.has('KeyD')) r++;
  if (keys.has('KeyA')) r--;
  if (f || r) {
    const l = Math.hypot(f, r), c = Math.cos(p.a), s = Math.sin(p.a), v = speed * dt / l;
    world.move((c * f - s * r) * v, (s * f + c * r) * v);
    p.bob += dt * 9; stepT -= dt;
    if (stepT <= 0) { audio.step(); stepT = .42; }
  }
  if (mode === 'outside') {
    if (p.y < 6) finish('good');
    return;
  }
  if (run.q === 0 && run.stage === 'test' && !hunt && p.x > 19.2 && world.realm === 'red') startHunt();
  if (hunt) updateHunt(dt);
  updateReflection(dt);
  updateScares(dt);
  updateGhost(dt);
  const n = nearest();
  $('prompt').innerHTML = n ? `<kbd>E</kbd>${story.prompts[n.id]}` : '';
}

/* ---------- test one: the Watcher, played in the world itself ---------- */
function startHunt() {
  const w = world.sprites.find(s => s.id === 'watcher');
  hunt = { w, got: 0, caught: 0, stared: 0, path: null, repath: 0, lastRed: null };
  w.hidden = false; w.x = w.home.x; w.y = w.home.y;
  world.sprites.filter(s => s.id === 'fuse').forEach(s => { s.hidden = false; world.lights.push({ x: s.x, y: s.y, i: .22, k: 1.4, realm: s.realm }); });
  messages.length = 0;
  const box = $('brief'); box.hidden = false; mode = 'brief'; keys.clear();
  brief(box, story.briefs.watcher, story.briefStart).then(() => { box.hidden = true; box.innerHTML = ''; mode = 'world'; last = performance.now(); subtitle(story.watcher.start); });
}
function nextStep(from, to, grid = 'red', minX = 19) {
  const key = (x, y) => y * 64 + x, sx = from.x | 0, sy = from.y | 0, tx = to.x | 0, ty = to.y | 0;
  const prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    if (x === tx && y === ty) {
      let cur = [x, y], pk = prev.get(key(x, y));
      while (pk && !(pk[0] === sx && pk[1] === sy)) { cur = pk; pk = prev.get(key(pk[0], pk[1])); }
      return cur;
    }
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + a, ny = y + b;
      if (nx >= minX && !world.solidIn(grid, nx, ny) && !prev.has(key(nx, ny))) { prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); }
    }
  }
  return null;
}
function updateHunt(dt) {
  const { w } = hunt, p = world.p, away = world.realm === 'other';
  // fuses
  for (const s of world.sprites) {
    if (s.id !== 'fuse' || s.hidden || !world.inRealm(s) || Math.hypot(s.x - p.x, s.y - p.y) > .6) continue;
    s.hidden = true; hunt.got++; audio.fuse();
    world.lights = world.lights.filter(l => !(l.x === s.x && l.y === s.y));
  }
  if (hunt.got === 3) return endHunt();
  const inWing = p.x > 19, d = Math.hypot(w.x - p.x, w.y - p.y), seen = !away && inWing && world.sees(w.x, w.y);
  world.staticAmt = seen ? Math.max(.015, .13 - d * .018) : 0;
  audio.setStatic(world.staticAmt);
  if (seen) { hunt.stared += dt; return; }
  if (!inWing && !away) return;
  const target = away ? hunt.lastRed : p;
  hunt.repath -= dt;
  if (hunt.repath <= 0 || !hunt.step) { hunt.step = nextStep(w, target); hunt.repath = .2; }
  if (hunt.step) {
    const tx = hunt.step[0] + .5, ty = hunt.step[1] + .5, l = Math.hypot(tx - w.x, ty - w.y) || 1, v = (1.7 + hunt.got * .25) * dt;
    w.x += (tx - w.x) / l * Math.min(v, l); w.y += (ty - w.y) / l * Math.min(v, l);
  }
  if (!away && Math.hypot(w.x - p.x, w.y - p.y) < .55) {
    hunt.caught++; scare('watcher', hunt.caught === 1 ? 780 : 420); subtitle(story.watcher.caught, 0, true);
    Object.assign(p, { x: WING.x, y: WING.y }); w.x = w.home.x; w.y = w.home.y; hunt.step = null;
  }
}
function endHunt() {
  const { w, caught, stared } = hunt;
  w.hidden = true; world.staticAmt = 0; audio.setStatic(0);
  subtitle(story.watcher.gone, 4000);
  add(caught > 1 ? { fear: 2 } : caught ? { fear: 1 } : { control: 1 });
  if (stared > 25) add({ fear: 1 });
  run.flags.caught = caught; hunt = null;
  setTimeout(() => subtitle(story.watcher.done), 4200);
  completeTest();
}
// The opposite of the Watcher: it moves only while you look at it.
function updateReflection(dt) {
  if (world.realm !== 'other' || !run.flags.echoes.length || shifting) return;
  const p = world.p;
  if (!reflection) {
    reflection = world.sprites.find(s => s.id === 'reflection');
    if (!reflection) { reflection = { id: 'reflection', realm: 'other', sprite: 'reflection', scale: 1.3, glow: .02, hidden: true }; world.sprites.push(reflection); }
    reflection.hidden = true; reflection.wait = .6;
    if (run.flags.echoes.length >= 4) subtitle(story.shift.near);
  }
  // While you aren't looking, it repositions just out of sight, so it is always near.
  if (reflection.hidden || !world.sees(reflection.x, reflection.y)) {
    reflection.wait = (reflection.wait ?? 0) - dt;
    if (reflection.wait <= 0) {
      const spot = farCell(5) || farCell(3);
      reflection.wait = spot ? 5 : .4;
      if (spot) Object.assign(reflection, spot, { hidden: false, step: null, repath: 0 });
    }
    if (reflection.hidden) return;
  }
  const r = reflection, seen = world.sees(r.x, r.y);
  world.staticAmt = seen ? .05 : (hunt ? world.staticAmt : 0);
  if (seen) {
    r.flip = (r.flip || 0) + dt; r.sprite = Math.floor(r.flip * 7) % 2 ? 'reflection2' : 'reflection';
    r.repath -= dt;
    if (r.repath <= 0 || !r.step) { r.step = nextStep(r, p, 'other', 0); r.repath = .2; }
    if (r.step) {
      const tx = r.step[0] + .5, ty = r.step[1] + .5, l = Math.hypot(tx - r.x, ty - r.y) || 1, v = (run.flags.echoes.length >= 3 ? 1.7 : 2.3) * dt;
      r.x += (tx - r.x) / l * Math.min(v, l); r.y += (ty - r.y) / l * Math.min(v, l);
    }
  }
  if (Math.hypot(r.x - p.x, r.y - p.y) < .6) {
    scare('mirror'); r.hidden = true; reflection = null; world.staticAmt = 0;
    world.setRealm('red'); audio.setDrone(.09);
    if (!world.canBe('red', p.x, p.y)) placeSpawn('hub');
    if (hunt) { hunt.lastRed = null; hunt.step = null; hunt.w.hidden = false; }
    subtitle(story.shift.thrown, 0, true);
  }
}
function farCell(min) {
  const p = world.p, sx = p.x | 0, sy = p.y | 0, seen = new Set([sy * 64 + sx]), q = [[sx, sy, 0]];
  const out = [];
  for (let i = 0; i < q.length; i++) {
    const [x, y, d] = q[i];
    if (d >= min && !world.sees(x + .5, y + .5)) out.push({ x: x + .5, y: y + .5 });
    if (d > min + 4) continue;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (y + b) * 64 + x + a;
      if (!seen.has(k) && !world.solidIn('other', x + a, y + b)) { seen.add(k); q.push([x + a, y + b, d + 1]); }
    }
  }
  return out[Math.random() * out.length | 0];
}
/* ---------- scares: each one fires once per attempt, when you walk into its spot ---------- */
const SCARES = [
  { id: 'paper', x: 7.5, y: 12.5, realm: 'red', after: r => r.doors.includes('2') },
  { id: 'dark', x: 14.5, y: 5.5, realm: 'red', after: r => r.doors.includes('3') },
  { id: 'face', x: 14.5, y: 17.5, realm: 'red', after: r => r.doors.includes('4') },
  { id: 'paper2', x: 9.5, y: 3.5, realm: 'other', after: () => true },
];
function scare(kind, ms) {
  audio.scream(); const was = mode; mode = 'scare'; keys.clear();
  screamer(kind, ms).then(() => { if (mode === 'scare') { mode = was; last = performance.now(); } });
}
function updateScares(dt) {
  const p = world.p;
  if (lurch) {
    lurch.t += dt;
    lurch.s.scale = Math.min(1, lurch.t * 9);
    if (lurch.t > .2) lurch = null;
  }
  if (scareT > 0) { scareT -= dt; world.dark = scareT > 0 ? .12 : (run.flags.echoes.length ? 1.05 : .78); }
  for (const c of SCARES) {
    const done = run.flags.scares ||= [];
    if (done.includes(c.id) || c.realm !== world.realm || !c.after(run) || Math.hypot(c.x - p.x, c.y - p.y) > .9) continue;
    done.push(c.id); save.write();
    if (c.id.startsWith('paper')) {
      audio.pop();
      const spot = { realm: world.realm, ang: p.a + Math.PI, x: p.x + Math.cos(p.a) * 1.1, y: p.y + Math.sin(p.a) * 1.1 };
      const s = { id: 'cutout', sprite: 'cutout', plane: true, scale: .01, ...spot };
      world.sprites.push(s); lurch = { t: 0, s };
      (run.flags.cutouts ||= []).push(spot); save.write();
    } else if (c.id === 'dark') { scareT = 2.2; audio.steps(); }
    else scare('watcher', 380);
  }
}
function updateGhost(dt) {
  if (run.q !== 2 || run.stage !== 'query' || run.flags.ghost) { if (ghost) ghost.hidden = true; return; }
  if (!ghost) { ghost = { id: 'ghost', realm: 'red', sprite: 'watcher', x: 16.5, y: 8.5, scale: 1.05 }; world.sprites.push(ghost); }
  if (world.realm === 'red' && Math.hypot(ghost.x - world.p.x, ghost.y - world.p.y) < 2.2) {
    ghost.hidden = true; run.flags.ghost = true; save.write(); scare('watcher');
  }
}
function completeTest() {
  run.q++; run.stage = run.q >= 4 ? 'done' : 'query'; save.write();
}

/* ---------- stations ---------- */
function setMode(m) {
  mode = m; keys.clear();
  if (m !== 'world' && m !== 'outside' && m !== 'brief' && document.pointerLockElement) document.exitPointerLock();
  $('prompt').textContent = '';
  game.hidden = m !== 'game';
  $('note').hidden = m !== 'note';
  if (m !== 'terminal') term.hide();
}
const backToWorld = () => { setMode('world'); game.innerHTML = ''; $('lockhint').hidden = false; };
async function station(id) {
  const want = { erase: 1, obey: 2, trust: 3 }[id];
  if (run.q !== want || run.stage !== 'test') return subtitle('It is switched off.', 2000);
  setMode('game');
  await brief(game, story.briefs[id], story.briefStart);
  if (id === 'erase') {
    const a = run.answers[1]; const r = await erase(game, story.erase, story.erase.sets[a] || story.erase.sets.a, audio);
    add(r.refused ? { care: 3 } : r.erased >= 4 ? { control: 2 } : { void: 1 });
  } else if (id === 'obey') {
    const r = await obey(game, story.obey, audio);
    add(r.pressed ? { care: 2 } : { control: 1, void: 1 });
    if (r.fails > 2) add({ fear: 1 });
  } else {
    const r = await trust(game, story.trust, save.data.meta.lastTrust, audio);
    save.data.meta.lastTrust = r.choices;
    add(r.took >= 3 ? { control: 2 } : r.took === 0 ? { care: 2 } : { fear: 1 });
  }
  completeTest(); backToWorld();
}
async function secret() {
  if (run.inventory.includes('key') || run.flags.keyFound) return subtitle('Nothing else is here.', 2000);
  const from = mode; setMode('game');
  const r = await dungeon(game, story.dungeon, audio);
  game.innerHTML = '';
  if (r.found) { run.flags.keyFound = true; run.inventory.push('key'); save.write(); }
  if (from === 'terminal') openTerminal(); else backToWorld();
}
function interact() {
  if (mode === 'note') { setMode('world'); return; }
  if (mode !== 'world') return;
  const n = nearest(); if (!n) return;
  if (n.id === 'exit') { audio.shift(); shifting = { t: 0, to: 'other', swapped: true, leaving: true }; return; }
  if (n.id === 'terminal') { if (world.realm === 'other') return subtitle(story.shift.dead, 2200); openTerminal(); }
  else if (n.id === 'echo') {
    run.flags.echoes.push(n.echo); n.hidden = true; audio.star();
    const c = story.stars[run.flags.echoes.length - 1];
    world.lights = world.lights.filter(l => !(l.x === n.x && l.y === n.y));
    $('note').classList.add('memory'); $('noteTitle').textContent = `Memory ${run.flags.echoes.length} of ${STARS}`; $('noteText').textContent = `${c.memory}\n\n${c.power}`; setMode('note');
    applyStars();
    if (run.flags.echoes.length === 1) subtitle(story.shift.reflection);
    if (run.flags.echoes.length === STARS) { openExit(); subtitle(story.shift.exit); }
    save.write();
  }
  else if (n.id === 'note') { $('note').classList.remove('memory'); const c = story.notes[n.note]; $('noteTitle').textContent = c.title; $('noteText').textContent = c.text; setMode('note'); }
  else if (n.id === 'pixel') secret();
  else station(n.id);
}

/* ---------- terminal ---------- */
const askQuery = () => {
  const q = story.queries[run.q];
  term.print(`\n${q.label}:\n${q.text}`, 'q');
  Object.entries(q.options).forEach(([k, o]) => term.print(`${k}) ${o.text}`));
};
function openTerminal() {
  setMode('terminal'); term.show(); audio.setDrone(.05);
  if (!run.flags.booted) {
    run.flags.booted = true;
    const lines = save.data.meta.runs > 1 ? story.terminal.bootReturning : story.terminal.boot;
    lines.forEach(l => term.print(l.replace('{runs}', save.data.meta.runs), 'sys'));
    term.print('... ');
  }
  if (rootMode) return;
  if (run.stage === 'query') askQuery();
  else if (run.stage === 'test') term.print(story.terminal.goTest);
  else if (run.stage === 'done') term.print(story.terminal.ready, 'sys');
}
const leaveTerminal = () => { audio.setDrone(.09); setMode('world'); $('lockhint').hidden = false; };
function command(raw) {
  const cmd = raw.toLowerCase().replace(/\s+/g, ' ');
  run.history.push(cmd); term.echo(raw);
  if (rootMode) return rootCommand(cmd);
  const t = story.terminal;
  if (cmd === 'help') return t.help.forEach(l => term.print(l));
  if (cmd === 'look') return term.print(t.look);
  if (cmd === 'whoami') { const n = run.flags.echoes.length; return term.print(n ? story.whoamiStars[n - 1] : t.whoami); }
  if (cmd === 'exit' || cmd === 'leave') return leaveTerminal();
  if (cmd === 'clear') return term.clear();
  if (cmd === 'history') return term.print(run.history.join('\n'));
  if (cmd === 'inventory') return term.print(run.inventory.length ? run.inventory.join('\n') : t.emptyInv);
  if (cmd === 'status') return term.print(`Queries answered: ${run.answers.filter(Boolean).length} of 4\nDeviations: recorded\nTime subject undetected: ${Math.round(run.flags.unseen || 0)} s\nAttempt: ${save.data.meta.runs}`);
  if (cmd === 'root' || cmd === 'sudo su') return term.print(t.root);
  if (cmd === 'use key') {
    if (!run.inventory.includes('key')) return term.print("You don't have a key.");
    rootMode = true;
    audio.melody(); story.root.open.forEach(l => term.print(l, 'root'));
    return term.print(story.root.help, 'root');
  }
  if (cmd === 'result') {
    if (run.stage !== 'done') return term.print(t.lockedResult);
    return finish(pickEnding());
  }
  const a = cmd.replace(/^answer /, '').replace(/\)$/, '');
  if (/^[abcd]$/.test(a) && run.stage === 'query') return answer(a);
  if (/^[abcd]$/.test(a)) return term.print(run.stage === 'test' ? t.goTest : t.ready);
  term.print(t.unknown);
}
async function answer(a) {
  const q = story.queries[run.q], o = q.options[a];
  run.answers[run.q] = a; add(o.score);
  term.print(o.reply);
  term.print('... ');
  term.print(q.after, 'sys');
  run.stage = 'test'; openDoor(q.door); save.write();
}
function rootCommand(cmd) {
  const r = story.root;
  if (cmd === 'help') return term.print(r.help, 'root');
  if (cmd === 'whoami') return term.print(story.terminal.whoamiRoot, 'root');
  if (cmd === 'ls') return term.print(r.ls, 'root');
  if (cmd === 'ls subjects' || cmd === 'ls subjects/' || cmd === 'cat subjects') return term.print(r.lsSubjects.replace('{runs}', String(410 + save.data.meta.runs).padStart(4, '0')), 'root');
  if (cmd === 'cat door.sys') return term.print(r.catDoor, 'root');
  if (cmd === 'cat vera.core') return term.print(r.catCore, 'root');
  if (cmd === 'open door') { term.print(r.openDoor, 'root'); return setTimeout(goOutside, 1800); }
  if (cmd === 'rm vera.core' || cmd === 'rm vera') {
    if (!confirmRm) { confirmRm = true; return term.print(r.plead, 'sys'); }
    return finish('inversion');
  }
  term.print('Not found. Type help.', 'root');
}
function goOutside() {
  world.load(story.maps.outside, true); world.sprites = []; world.lights = [];
  world.dark = 1; world.falloff = .03; placeSpawn('outside'); setMode('outside');
  $('lockhint').hidden = false; audio.setDrone(0); audio.play('good');
  world.moon = new Image(); world.moon.src = 'img/moon.png';
  subtitle('Walk.', 3000);
}
function pickEnding() {
  const s = run.score, top = Object.entries(s).sort((a, b) => b[1] - a[1])[0][0];
  return { control: 'candidate', care: 'knight', fear: 'kitten', void: 'null' }[top];
}

/* ---------- endings ---------- */
function finish(id) {
  const e = story.endings[id], score = { ...run.score };
  save.unlock(id); setMode('ending'); term.hide(); $('gear').hidden = true; $('settings').hidden = true; if (document.pointerLockElement) document.exitPointerLock();
  $('stage').hidden = true; audio.setDrone(0); audio.setStatic(0);
  audio.play(e.music, e.vol);
  const el = $('ending'); el.hidden = false; el.classList.toggle('noart', !e.art);
  const max = Math.max(1, ...Object.values(score));
  const rows = Object.keys(story.reportLabels).map(k => `<dt>${story.reportLabels[k]}</dt><dd>${'█'.repeat(Math.round(score[k] / max * 12)) || '·'}</dd>`).join('');
  const found = ENDINGS.map(k => save.data.meta.endings.includes(k) ? `<span>${story.endings[k].title}</span>` : '???').join(', ');
  el.innerHTML = `${e.art ? `<div class="art ${e.art.includes('moon') ? 'moon' : ''}" style="background-image:url(${e.art})"></div>` : ''}
    <div class="body"><h2>${e.title}</h2><p class="text"></p>
    <dl hidden>${rows}</dl><p class="found" hidden>Endings found: ${found}</p>
    <div hidden class="again"><button id="again">Wake up again</button></div></div>`;
  const text = el.querySelector('.text'); let i = 0;
  const tick = () => {
    i += 1; text.textContent = e.text.slice(0, i);
    if (i < e.text.length) return void setTimeout(tick, e.text[i - 1] === '\n' ? 400 : 34);
    el.querySelectorAll('[hidden]').forEach(n => { n.hidden = false; });
    el.querySelector('#again').onclick = () => location.reload();
  };
  tick();
}

/* ---------- input ---------- */
addEventListener('keydown', e => {
  if (e.code === 'KeyM' && mode !== 'terminal' && mode !== 'game') audio.toggleMute();
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) { if (mode === 'world') { e.preventDefault(); startShift(); } return; }
  if ((e.key === '[' || e.key === ']') && (mode === 'world' || mode === 'outside')) { setSens(sens + (e.key === ']' ? .1 : -.1)); return subtitle(`Mouse sensitivity ${sens.toFixed(1)}x`, 1400); }
  if (mode === 'world' || mode === 'outside' || mode === 'note') {
    if (e.code === 'KeyE') { e.preventDefault(); interact(); } else if (!shifting) keys.add(e.code);
    if (e.code.startsWith('Arrow')) e.preventDefault();
  }
  if (mode === 'terminal' && e.key === 'Escape') leaveTerminal();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
canvas.addEventListener('click', () => { if (mode === 'world' || mode === 'outside') canvas.requestPointerLock?.()?.catch?.(() => {}); });
document.addEventListener('pointerlockchange', () => {
  const on = document.pointerLockElement === canvas; $('gear').hidden = on; if (on) { $('lockhint').hidden = true; $('settings').hidden = true; }
  else if (mode === 'world' || mode === 'outside') $('lockhint').hidden = false;
});
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas || mode === 'brief') return;
  world.p.a += e.movementX * SENS * sens;
  world.p.pitch = Math.max(-45, Math.min(45, world.p.pitch - e.movementY * .22 * sens));
});
$('pixel').addEventListener('click', secret);
function setSens(v) {
  sens = Math.round(Math.min(3, Math.max(.2, v)) * 10) / 10;
  $('sens').value = sens; $('sensValue').textContent = `${sens.toFixed(1)}x`;
  try { localStorage.setItem(SENS_KEY, sens); } catch { /* storage blocked */ }
}
const toggleSettings = open => { $('settings').hidden = !open; };
$('gear').addEventListener('click', () => toggleSettings($('settings').hidden));
$('settingsDone').addEventListener('click', () => toggleSettings(false));
$('sens').addEventListener('input', e => setSens(+e.target.value));
setSens(sens);
term.onCommand = command;

function loop(t) {
  const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
  updateMessages(t); updateObjective();
  if (mode === 'world' || mode === 'outside') { update(dt); world.render(t / 1000); }
  else if (mode === 'note' || mode === 'brief' || mode === 'scare') world.render(t / 1000);
  requestAnimationFrame(loop);
}

/* ---------- title ---------- */
function begin(fresh) {
  audio.start();
  run = fresh || !save.data.run ? save.newRun() : save.data.run;
  $('title').hidden = true; $('settings').hidden = true; $('gear').hidden = false; loadHub(); placeSpawn('hub'); setMode('world');
  $('lockhint').hidden = false;
  const lines = save.data.meta.runs > 1 ? [story.returning, story.wake[2]] : story.wake;
  lines.forEach(l => subtitle(l));
  if (run.q === 0 && run.stage === 'query') subtitle(story.hints.move);
}
const logo = $('logo'), NAME = 'NULLPOINT';
function resolveLogo() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { logo.textContent = NAME; return; }
  let f = 0;
  const id = setInterval(() => {
    f++;
    logo.textContent = [...NAME].map((c, i) => f / 4 > i ? c : RUNES[Math.random() * RUNES.length | 0]).join('');
    if (f / 4 > NAME.length) clearInterval(id);
  }, 55);
}
logo.addEventListener('mouseenter', () => { logo.textContent = [...NAME].map((_, i) => RUNES[i * 2]).join(''); });
logo.addEventListener('mouseleave', resolveLogo);
setTimeout(resolveLogo, 500);
const acts = $('titleActions');
const btn = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; acts.append(b); };
if (save.data.run) { btn('Continue', () => begin(false)); btn('Start over', () => begin(true)); }
else btn('Wake up', () => begin(true));
btn('Settings', () => { $('settings').hidden = !$('settings').hidden; });
requestAnimationFrame(loop);

if (new URLSearchParams(location.search).has('dev')) {
  window.NP = { startShift, get sens() { return sens; }, world, story, save, get run() { return run; }, get mode() { return mode; }, get hunt() { return hunt; }, finish, secret, command };
}

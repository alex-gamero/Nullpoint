import { World } from './world.js';
import { Terminal } from './terminal.js';
import { audio } from './audio.js';
import { save } from './save.js';
import { erase } from './games/erase.js';
import { obey } from './games/obey.js';
import { trust } from './games/trust.js';
import { dungeon } from './games/dungeon.js';

const $ = id => document.getElementById(id);
const story = await (await fetch('data/story.json')).json();
const canvas = $('view'), world = new World(canvas);
const term = new Terminal($('terminal'), () => audio.key());
const game = $('game');
const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛋᛏᛒᛖᛗᛚᛜ';
const SPEED = 2.5, TURN = 2.2, SENS = .0026;
const WING = { x: 20.5, y: 12.5 }; // the first cell past the east door
const ENDINGS = Object.keys(story.endings);

let run, mode = 'title', keys = new Set(), last = 0, stepT = 0, activeNote = null, rootMode = false, confirmRm = false;
let hunt = null, ghost = null;

/* ---------- world setup ---------- */
const subtitle = (text, ms = 4500) => {
  const el = $('subtitle'); el.textContent = text; clearTimeout(subtitle.t);
  if (ms) subtitle.t = setTimeout(() => { el.textContent = ''; }, ms);
};
const SPR = { O: ['obey', 'station'], E: ['erase', 'station'], R: ['trust', 'station'] };
function loadHub() {
  world.load(story.maps.hub);
  world.sprites = []; world.lights = [];
  world.rows.forEach((r, y) => r.forEach((c, x) => {
    const at = { x: x + .5, y: y + .5 };
    if (c === 'T') { world.sprites.push({ ...at, id: 'terminal', sprite: 'terminal', block: true, glow: .15 }); world.lights.push({ ...at, i: .55, k: .55 }); }
    if (SPR[c]) { world.sprites.push({ ...at, id: SPR[c][0], sprite: 'station', block: true, glow: .1 }); world.lights.push({ ...at, i: .3, k: .8 }); }
    if ('nmp'.includes(c)) world.sprites.push({ ...at, id: 'note', note: c, sprite: 'note', scale: .6 });
    if (c === 'G') world.sprites.push({ ...at, id: 'pixel', sprite: 'pixel', scale: .5 });
    if (c === 'F') world.sprites.push({ ...at, id: 'fuse', sprite: 'fuse', scale: .45, hidden: true, glow: .9 });
    if (c === 'W') world.sprites.push({ ...at, id: 'watcher', sprite: 'watcher', hidden: true, scale: 1.05, home: at });
    if (c !== '#' && !'1234'.includes(c)) r[x] = '.';
  }));
  run.doors.forEach(d => world.open(d));
  world.dark = .78; world.falloff = .7; world.sky = false;
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
    if (s.hidden || !['terminal', 'erase', 'obey', 'trust', 'note', 'pixel'].includes(s.id)) continue;
    const d = Math.hypot(s.x - p.x, s.y - p.y);
    if (d < bd && world.sees(s.x, s.y)) { bd = d; best = s; }
  }
  return best;
}
function update(dt) {
  const p = world.p;
  if (keys.has('ArrowLeft')) p.a -= TURN * dt;
  if (keys.has('ArrowRight')) p.a += TURN * dt;
  let f = 0, r = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) f++;
  if (keys.has('KeyS') || keys.has('ArrowDown')) f--;
  if (keys.has('KeyD')) r++;
  if (keys.has('KeyA')) r--;
  if (f || r) {
    const l = Math.hypot(f, r), c = Math.cos(p.a), s = Math.sin(p.a), v = SPEED * dt / l;
    world.move((c * f - s * r) * v, (s * f + c * r) * v);
    p.bob += dt * 9; stepT -= dt;
    if (stepT <= 0) { audio.step(); stepT = .42; }
  }
  if (mode === 'outside') {
    if (p.y < 6) finish('good');
    return;
  }
  if (run.q === 0 && run.stage === 'test' && !hunt && p.x > 19.2) startHunt();
  if (hunt) updateHunt(dt);
  updateGhost(dt);
  const n = nearest();
  $('prompt').innerHTML = n ? `<kbd>E</kbd>${story.prompts[n.id]}` : '';
}

/* ---------- test one: the Watcher, played in the world itself ---------- */
function startHunt() {
  const w = world.sprites.find(s => s.id === 'watcher');
  hunt = { w, got: 0, caught: 0, stared: 0, path: null, repath: 0 };
  w.hidden = false; w.x = w.home.x; w.y = w.home.y;
  world.sprites.filter(s => s.id === 'fuse').forEach(s => { s.hidden = false; world.lights.push({ x: s.x, y: s.y, i: .22, k: 1.4 }); });
  subtitle(story.watcher.start, 6000);
  $('hud').textContent = '0 of 3';
}
function nextStep(from, to) {
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
      if (nx >= 19 && !world.solid(nx, ny) && !prev.has(key(nx, ny))) { prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); }
    }
  }
  return null;
}
function updateHunt(dt) {
  const { w } = hunt, p = world.p;
  // fuses
  for (const s of world.sprites) {
    if (s.id !== 'fuse' || s.hidden || Math.hypot(s.x - p.x, s.y - p.y) > .6) continue;
    s.hidden = true; hunt.got++; audio.fuse();
    world.lights = world.lights.filter(l => !(l.x === s.x && l.y === s.y));
    $('hud').textContent = `${hunt.got} of 3`;
    subtitle(story.watcher.fuse.replace('{n}', hunt.got), 2200);
  }
  if (hunt.got === 3) return endHunt();
  const inWing = p.x > 19, d = Math.hypot(w.x - p.x, w.y - p.y), seen = inWing && world.sees(w.x, w.y);
  world.staticAmt = seen ? Math.max(.015, .13 - d * .018) : 0;
  audio.setStatic(world.staticAmt);
  if (seen) { hunt.stared += dt; return; }
  if (!inWing) return;
  hunt.repath -= dt;
  if (hunt.repath <= 0 || !hunt.step) { hunt.step = nextStep(w, p); hunt.repath = .2; }
  if (hunt.step) {
    const tx = hunt.step[0] + .5, ty = hunt.step[1] + .5, l = Math.hypot(tx - w.x, ty - w.y) || 1, v = (1.7 + hunt.got * .25) * dt;
    w.x += (tx - w.x) / l * Math.min(v, l); w.y += (ty - w.y) / l * Math.min(v, l);
  }
  if (Math.hypot(w.x - p.x, w.y - p.y) < .55) {
    hunt.caught++; audio.sting(); subtitle(story.watcher.caught, 3500);
    Object.assign(p, { x: WING.x, y: WING.y }); w.x = w.home.x; w.y = w.home.y; hunt.step = null;
  }
}
function endHunt() {
  const { w, caught, stared } = hunt;
  w.hidden = true; world.staticAmt = 0; audio.setStatic(0); $('hud').textContent = '';
  subtitle(story.watcher.gone, 4000);
  add(caught > 1 ? { fear: 2 } : caught ? { fear: 1 } : { control: 1 });
  if (stared > 25) add({ fear: 1 });
  run.flags.caught = caught; hunt = null;
  setTimeout(() => subtitle(story.watcher.done), 4200);
  completeTest();
}
function updateGhost(dt) {
  if (run.q !== 2 || run.stage !== 'query' || run.flags.ghost) return;
  if (!ghost) { ghost = { id: 'ghost', sprite: 'watcher', x: 16.5, y: 8.5, scale: 1.05, seen: 0 }; world.sprites.push(ghost); }
  if (world.sees(ghost.x, ghost.y)) ghost.seen += dt;
  else if (ghost.seen > .6) { ghost.hidden = true; run.flags.ghost = true; audio.step(); }
}
function completeTest() {
  run.q++; run.stage = run.q >= 4 ? 'done' : 'query'; save.write();
}

/* ---------- stations ---------- */
function setMode(m) {
  mode = m; keys.clear();
  if (m !== 'world' && m !== 'outside' && document.pointerLockElement) document.exitPointerLock();
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
  if (n.id === 'terminal') openTerminal();
  else if (n.id === 'note') { const c = story.notes[n.note]; $('noteTitle').textContent = c.title; $('noteText').textContent = c.text; setMode('note'); }
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
  if (run.stage === 'care') {
    if (cmd === 'back') { run.stage = 'query'; term.clear(); askQuery(); }
    else term.print(story.careful.lines[5]);
    return;
  }
  const t = story.terminal;
  if (cmd === 'help') return t.help.forEach(l => term.print(l));
  if (cmd === 'look') return term.print(t.look);
  if (cmd === 'whoami') return term.print(t.whoami);
  if (cmd === 'exit' || cmd === 'leave') return leaveTerminal();
  if (cmd === 'clear') return term.clear();
  if (cmd === 'history') return term.print(run.history.join('\n'));
  if (cmd === 'inventory') return term.print(run.inventory.length ? run.inventory.join('\n') : t.emptyInv);
  if (cmd === 'status') return term.print(`Queries answered: ${run.answers.length} of 4\nDeviations: recorded\nAttempt: ${save.data.meta.runs}`);
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
  if (o.care) {
    run.stage = 'care'; term.clear();
    story.careful.lines.forEach(l => term.print(l, 'sys'));
    return;
  }
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
  if (cmd === 'cat alice.core') return term.print(r.catAlice, 'root');
  if (cmd === 'open door') { term.print(r.openDoor, 'root'); return setTimeout(goOutside, 1800); }
  if (cmd === 'rm alice.core' || cmd === 'rm alice') {
    if (!confirmRm) { confirmRm = true; return term.print(r.plead, 'sys'); }
    return finish('inversion');
  }
  term.print('Not found. Type help.', 'root');
}
function goOutside() {
  world.load(story.maps.outside, true); world.sprites = []; world.lights = [];
  world.dark = 1; world.falloff = .03; placeSpawn('outside'); setMode('outside');
  $('lockhint').hidden = false; audio.setDrone(0); audio.play('music/good_ending.mp3', .55);
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
  save.unlock(id); setMode('ending'); term.hide();
  $('stage').hidden = true; audio.setDrone(0); audio.setStatic(0);
  if (e.music) audio.play(e.music, e.vol);
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
  if (mode === 'world' || mode === 'outside' || mode === 'note') {
    if (e.code === 'KeyE') { e.preventDefault(); interact(); } else keys.add(e.code);
    if (e.code.startsWith('Arrow')) e.preventDefault();
  }
  if (mode === 'terminal' && e.key === 'Escape') leaveTerminal();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
canvas.addEventListener('click', () => { if (mode === 'world' || mode === 'outside') canvas.requestPointerLock?.()?.catch?.(() => {}); });
document.addEventListener('pointerlockchange', () => {
  const on = document.pointerLockElement === canvas; if (on) $('lockhint').hidden = true;
  else if (mode === 'world' || mode === 'outside') $('lockhint').hidden = false;
});
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  world.p.a += e.movementX * SENS;
  world.p.pitch = Math.max(-45, Math.min(45, world.p.pitch - e.movementY * .22));
});
$('pixel').addEventListener('click', secret);
term.onCommand = command;

function loop(t) {
  const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
  if (mode === 'world' || mode === 'outside') { update(dt); world.render(t / 1000); }
  else if (mode === 'note') world.render(t / 1000);
  requestAnimationFrame(loop);
}

/* ---------- title ---------- */
function begin(fresh) {
  audio.start();
  run = fresh || !save.data.run ? save.newRun() : save.data.run;
  $('title').hidden = true; loadHub(); placeSpawn('hub'); setMode('world');
  $('lockhint').hidden = false;
  const lines = save.data.meta.runs > 1 ? [story.returning, story.wake[2]] : story.wake;
  lines.forEach((l, i) => setTimeout(() => subtitle(l, 2800), 300 + i * 3000));
  setTimeout(() => { if (mode === 'world' && run.q === 0 && run.stage === 'query') subtitle(story.hints.move, 6000); }, 300 + lines.length * 3000);
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
requestAnimationFrame(loop);

if (new URLSearchParams(location.search).has('dev')) {
  window.NP = { world, story, save, get run() { return run; }, get mode() { return mode; }, get hunt() { return hunt; }, finish, secret, command };
}

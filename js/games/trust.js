// Iterated dilemma. The other subject replays your last attempt; on a first run it mirrors you, then turns.
const ROUNDS = 5;
const wait = ms => new Promise(r => setTimeout(r, ms));
const bar = n => '█'.repeat(Math.max(0, n)) + '░'.repeat(Math.max(0, 12 - n));
export function trust(el, story, past, audio) {
  el.innerHTML = `<p class="say">${story.intro}</p><div class="air"><span>You</span><span class="me"></span><span>Subject 00</span><span class="them"></span></div><p class="log"></p><div class="choices"><button data-c="s">S: ${story.names.s}</button><button data-c="t">T: ${story.names.t}</button></div><p class="small"></p>`;
  const $ = q => el.querySelector(q);
  let me = 6, them = 6, pick = null;
  const draw = () => { $('.me').textContent = bar(me); $('.them').textContent = bar(them); };
  const key = e => { const k = e.key.toLowerCase(); if (k === 's' || k === 't') pick?.(k); };
  addEventListener('keydown', key);
  el.querySelectorAll('.choices button').forEach(b => b.addEventListener('click', () => pick?.(b.dataset.c)));
  return (async () => {
    const mine = [];
    for (let r = 0; r < ROUNDS; r++) {
      draw(); $('.small').textContent = `Round ${r + 1} of ${ROUNDS}`;
      const c = await new Promise(res => { pick = v => { pick = null; res(v); }; });
      const other = past?.[r] ?? (r === 3 ? 't' : r === 0 ? 's' : mine[r - 1]);
      mine.push(c);
      audio.rune(c === 's' ? 2 : 0);
      const [a, b] = c + other === 'ss' ? [1, 1] : c + other === 'st' ? [-2, 3] : c + other === 'ts' ? [3, -2] : [-2, -2];
      me += a; them += b; draw();
      $('.log').textContent = story.outcome[c + other];
      await wait(1100);
    }
    removeEventListener('keydown', key);
    $('.choices').remove(); $('.small').textContent = '';
    $('.say').textContent = past ? story.reveal.past : story.reveal.first;
    audio.sting();
    await wait(6500);
    return { choices: mine, took: mine.filter(c => c === 't').length };
  })();
}

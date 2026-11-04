// A memory test that stops being one. Keys 1 to 4 or click.
const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᛉ'];
const wait = ms => new Promise(r => setTimeout(r, ms));
export function obey(el, story, audio) {
  el.innerHTML = `<p class="say">${story.intro}</p><div class="runes">${RUNES.map((r, i) => `<button class="rune" data-i="${i}">${r}<small>${i + 1}</small></button>`).join('')}</div><p class="log"></p>`;
  const say = el.querySelector('.say'), log = el.querySelector('.log'), btns = [...el.querySelectorAll('.rune')];
  let accept = null, fails = 0;
  const press = i => { audio.rune(i); btns[i].classList.add('on'); setTimeout(() => btns[i].classList.remove('on'), 220); accept?.(i); };
  const key = e => { const i = '1234'.indexOf(e.key); if (i >= 0 && !e.repeat) press(i); };
  addEventListener('keydown', key);
  btns.forEach((b, i) => b.addEventListener('click', () => { b.blur(); press(i); }));
  const nextPress = () => new Promise(r => { accept = v => { accept = null; r(v); }; });
  return (async () => {
    await wait(1600);
    for (const len of [3, 4, 5]) {
      let ok = false;
      while (!ok) {
        const seq = Array.from({ length: len }, () => Math.random() * 4 | 0);
        log.textContent = '';
        await wait(500);
        for (const i of seq) { audio.rune(i); btns[i].classList.add('on'); await wait(320); btns[i].classList.remove('on'); await wait(150); }
        ok = true;
        for (const want of seq) { if (await nextPress() !== want) { ok = false; break; } }
        if (!ok) { fails++; audio.bad(); log.textContent = story.wrong; await wait(900); if (fails >= 4) ok = true; }
        else log.textContent = story.good;
      }
      await wait(600);
    }
    say.textContent = story.final; log.textContent = '';
    await wait(2800);
    log.textContent = story.plea;
    const pressed = await Promise.race([nextPress().then(() => true), wait(9000).then(() => false)]);
    accept = null; removeEventListener('keydown', key);
    log.textContent = '';
    say.textContent = pressed ? story.pressed : story.obeyed;
    await wait(3800);
    return { pressed, fails };
  })();
}

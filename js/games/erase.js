// Type a memory before it decays. Whatever you type no longer happened.
export function erase(el, story, set, audio) {
  const lines = set.lines, GLYPH = '▓▒░#%&';
  el.innerHTML = `<p class="say">Memory 1 of ${lines.length}</p><div class="frag"></div><div class="bar"><span></span></div><p class="small">Esc to refuse</p>`;
  const frag = el.querySelector('.frag'), bar = el.querySelector('.bar span'), say = el.querySelector('.say');
  return new Promise(resolve => {
    let n = 0, typed = 0, left = 1, erased = 0, last = performance.now(), raf, done = false, corrupt = new Set();
    const draw = () => {
      const s = lines[n];
      frag.textContent = '';
      const b = document.createElement('b'); b.textContent = s.slice(0, typed);
      const rest = document.createElement('span');
      rest.textContent = [...s.slice(typed)].map((c, i) => corrupt.has(i + typed) && c !== ' ' ? GLYPH[i % GLYPH.length] : c).join('');
      frag.append(b, rest);
      bar.style.width = `${left * 100}%`;
    };
    const next = () => {
      n++; typed = 0; left = 1; corrupt = new Set();
      if (n >= lines.length) finish(false); else { say.textContent = `Memory ${n + 1} of ${lines.length}`; draw(); }
    };
    const finish = refused => {
      done = true; cancelAnimationFrame(raf); removeEventListener('keydown', key);
      frag.textContent = ''; el.querySelector('.bar').remove(); el.querySelector('.small').remove();
      say.textContent = refused
        ? story.refused.replace('{n}', n + 1)
        : story.done.replace('{n}', erased).replace('{total}', lines.length);
      setTimeout(() => resolve({ erased, refused }), 3600);
    };
    const key = e => {
      if (done) return;
      if (e.key === 'Escape') return finish(true);
      if (e.key.length !== 1) return;
      e.preventDefault();
      const want = lines[n][typed];
      if (corrupt.has(typed) || e.key.toLowerCase() === want) {
        typed++; audio.key();
        if (typed === lines[n].length) { erased++; audio.fuse(); next(); return; }
      } else audio.bad();
      draw();
    };
    addEventListener('keydown', key);
    const tick = t => {
      if (done) return;
      const dt = (t - last) / 1000; last = t;
      left -= dt / 13;
      if (Math.random() < dt * 1.4) corrupt.add(typed + (Math.random() * (lines[n].length - typed) | 0));
      if (left <= 0) next(); else draw();
      if (!done) raf = requestAnimationFrame(tick);
    };
    draw(); raf = requestAnimationFrame(tick);
  });
}

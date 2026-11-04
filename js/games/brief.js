// Instruction card shared by every test. Nothing starts until the player says so.
export function brief(el, b, startLabel) {
  el.innerHTML = '';
  const box = document.createElement('div'); box.className = 'brief';
  const h = document.createElement('h2'); h.textContent = b.title;
  const v = document.createElement('p'); v.className = 'voice'; v.textContent = b.voice;
  const ul = document.createElement('ul');
  b.how.forEach(line => { const li = document.createElement('li'); li.textContent = line; ul.append(li); });
  const go = document.createElement('button'); go.textContent = startLabel;
  box.append(h, v, ul, go); el.append(box);
  return new Promise(resolve => {
    const done = e => {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); removeEventListener('keydown', done); el.innerHTML = ''; resolve();
    };
    addEventListener('keydown', done);
    go.addEventListener('click', done);
  });
}

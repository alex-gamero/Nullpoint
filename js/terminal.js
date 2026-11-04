// The A.L.I.C.E. console: typed output with skip, a plain input line, a command callback.
export class Terminal {
  constructor(root, onKey) {
    this.root = root; this.out = root.querySelector('#out'); this.input = root.querySelector('#in');
    this.queue = Promise.resolve(); this.skip = false; this.pending = 0; this.onCommand = () => {}; this.onKey = onKey;
    root.querySelector('#line').addEventListener('submit', e => {
      e.preventDefault();
      const v = this.input.value.trim(); this.input.value = '';
      if (!v) { this.skip = true; return; }
      this.skip = true; this.fast = this.pending > 0; this.onCommand(v);
    });
    this.input.addEventListener('keydown', e => { if (e.key.length === 1) this.onKey?.(); });
    root.addEventListener('click', e => { if (e.target.id !== 'pixel') this.input.focus(); });
  }
  show() { this.root.hidden = false; this.input.focus(); }
  hide() { this.root.hidden = true; this.input.blur(); }
  clear() { this.out.textContent = ''; }
  echo(cmd) { this.pending++; this.queue = this.queue.then(() => { this.add(`\n> ${cmd}\n`, 'me'); this.settle(); }); }
  settle() { if (--this.pending === 0) this.fast = false; }
  add(text, cls) {
    const s = document.createElement('span'); if (cls) s.className = cls; s.textContent = text;
    this.out.append(s); this.out.scrollTop = this.out.scrollHeight; return s;
  }
  // Queued so that several prints always read in order. A later Enter finishes the line at once.
  print(text, cls) {
    this.pending++;
    this.queue = this.queue.then(() => new Promise(done => {
      const s = this.add('', cls); let i = 0; this.skip = false;
      const tick = () => {
        if (this.skip || this.fast || matchMedia('(prefers-reduced-motion: reduce)').matches) i = text.length; else i += 1;
        s.textContent = text.slice(0, i); this.out.scrollTop = this.out.scrollHeight;
        if (i < text.length) setTimeout(tick, 16);
        else { s.textContent += '\n'; this.out.scrollTop = this.out.scrollHeight; this.settle(); done(); }
      };
      tick();
    }));
    return this.queue;
  }
}

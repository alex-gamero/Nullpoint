const KEY = 'nullpoint.v2';
const blank = () => ({ meta: { runs: 0, endings: [], lastTrust: null }, run: null });
let data = blank();
try { data = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* private window */ }
export const save = {
  data,
  write() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage blocked */ } },
  newRun() {
    data.meta.runs++;
    data.run = { q: 0, stage: 'query', score: { control: 0, care: 0, fear: 0, void: 0 }, answers: [],
      inventory: [], history: [], doors: [], flags: {}, x: null };
    this.write();
    return data.run;
  },
  unlock(id) { if (!data.meta.endings.includes(id)) data.meta.endings.push(id); data.run = null; this.write(); },
};

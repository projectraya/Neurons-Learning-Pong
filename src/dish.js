// ==SIM-START==
const W = 640, H = 400, PH = 72, BR = 6, PX = W - 24;
let LR = 30;
const NS = 9, NM = 12, WSUM = 1.6;
const rnd = Math.random;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 0.7071; };

class Dish {
  constructor() { this.reset(); }
  reset() {
    this.w = []; this.e = [];
    for (let j = 0; j < 2 * NM; j++) {
      this.w.push(Array.from({ length: NS }, () => 0.05 + 0.3 * rnd()));
      this.e.push(new Array(NS).fill(0));
    }
    this.norm();
    this.v = new Array(2 * NM).fill(0); this.pj = new Array(2 * NM).fill(0.1);
    this.spk = new Array(2 * NM).fill(0);
    this.s = new Array(NS).fill(0);
    this.rU = 0; this.rD = 0; this.drive = 0;
    this.paddle = H / 2;
    this.hits = 0; this.misses = 0; this.history = [];
    this.fb = 0; this.fbType = null; this.frozen = false;
    this.t = 0; this.events = [];
    this.serve();
  }
  // each electrode has a fixed amount of synaptic strength to share between the 24 motor cells
  norm() {
    for (let i = 0; i < NS; i++) {
      let sum = 0;
      for (let j = 0; j < 2 * NM; j++) { this.w[j][i] = Math.max(0.01, this.w[j][i]); sum += this.w[j][i]; }
      for (let j = 0; j < 2 * NM; j++) this.w[j][i] *= 2 * NM * 0.2 / sum;
    }
  }
  serve() {
    this.bx = 40; this.by = 60 + rnd() * (H - 120);
    this.vx = 4.2; this.vy = (rnd() * 2 - 1) * 3.2;
    this.frozen = false;
  }
  learn(hit, err) {
    // outcome relative to what the cells expected: a hit beats expectation, a miss falls short
    this.base = this.base === undefined ? -0.3 : this.base;
    // a bigger miss means a bigger shock: reward is +1 for a hit, negative in proportion to how far the ball was missed
    const r = hit ? 1 : -Math.min(err / 100, 1.5);
    this.hr = this.hr === undefined ? 0.15 : this.hr + 0.03 * ((hit ? 1 : 0) - this.hr);
    const settle = Math.max(0.06, (1 - this.hr) * (1 - this.hr)); // calmer, smaller changes once things are working
    const delta = (r - this.base) * settle;
    this.base += 0.05 * (r - this.base);
    for (let j = 0; j < 2 * NM; j++) {
      for (let i = 0; i < NS; i++) {
        this.w[j][i] += LR * delta * this.e[j][i] + (hit ? 0 : 0.012 * Math.min(1, -r * 0.7) * settle * gauss());
        this.e[j][i] = 0;
      }
    }
    this.norm();
  }
  outcome(hit, err) {
    this.history.push(hit ? 1 : 0);
    if (hit) this.hits++; else this.misses++;
    this.learn(hit, err);
    this.fb = hit ? 36 : 48; this.fbType = hit ? 'hit' : 'miss';
    this.events.push(hit ? 'hit' : 'miss');
  }
  step() {
    this.t++;
    const o = clamp((this.by - this.paddle) / 150, -1, 1);
    for (let i = 0; i < NS; i++) {
      const c = -1 + i * 0.25, d = o - c;
      this.s[i] = rnd() < 0.45 * Math.exp(-d * d / 0.08) ? 1 : 0;
    }
    let nU = 0, nD = 0;
    for (let j = 0; j < 2 * NM; j++) {
      let I = 0;
      for (let i = 0; i < NS; i++) if (this.s[i]) I += this.w[j][i];
      if (this.fb > 0) {
        if (this.fbType === 'hit') { if (this.fb % 6 === 0) I += 0.9; }
        else if (rnd() < 0.35) I += 0.2 + 1.2 * rnd();
      }
      this.v[j] = this.v[j] * 0.7 + I + 0.12 * gauss();
      const sp = this.v[j] > 1 ? 1 : 0;
      if (sp) this.v[j] = 0;
      this.spk[j] = sp; this.pj[j] += 0.02 * (sp - this.pj[j]);
      if (sp) { if (j < NM) nU++; else nD++; }
      if (this.fb === 0) for (let i = 0; i < NS; i++) this.e[j][i] = this.e[j][i] * 0.985 + 0.015 * this.s[i] * (sp - this.pj[j]);
    }
    this.rU = this.rU * 0.8 + nU; this.rD = this.rD * 0.8 + nD;
    this.drive = Math.tanh(3 * (this.rU - this.rD) / (this.rU + this.rD + 1.5));
    this.paddle = clamp(this.paddle - this.drive * 6, PH / 2, H - PH / 2);
    if (this.fb > 0) { this.fb--; if (this.fb === 0 && this.frozen) this.serve(); }
    if (this.frozen) return;
    this.bx += this.vx; this.by += this.vy;
    if (this.by < BR) { this.by = BR; this.vy = -this.vy; }
    if (this.by > H - BR) { this.by = H - BR; this.vy = -this.vy; }
    if (this.bx < BR) { this.bx = BR; this.vx = Math.abs(this.vx); }
    if (this.vx > 0 && this.bx >= PX - BR) {
      if (Math.abs(this.by - this.paddle) <= PH / 2 + BR) {
        this.vx = -this.vx; this.bx = PX - BR;
        this.vy = clamp(this.vy + (this.by - this.paddle) / (PH / 2) * 1.5, -4.5, 4.5);
        this.outcome(true, 0);
      } else if (this.bx > W) { this.frozen = true; this.outcome(false, Math.abs(this.by - this.paddle) - PH / 2); }
    }
  }
  rate(n) { const h = this.history.slice(-n); return h.length ? h.reduce((a, b) => a + b, 0) / h.length : 0; }
}
// ==SIM-END==
if (typeof module !== 'undefined') module.exports = { Dish, setLR: v => { LR = v; } };

const { Dish, setLR } = require('./src/dish.js');
const N = +process.argv[3] || 3000;
setLR(+process.argv[2] || 0.15);
for (let run = 0; run < 4; run++) {
  const d = new Dish(); let out = [];
  while (d.history.length < N) d.step();
  const B = N / 6;
  for (let k = 0; k < N; k += B) { const h = d.history.slice(k, k + B); out.push((100 * h.reduce((a, b) => a + b, 0) / h.length).toFixed(0) + '%'); }
  console.log('run', run, out.join(' '));
}

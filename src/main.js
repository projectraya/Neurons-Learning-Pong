
const $ = id => document.getElementById(id);
const dish = new Dish();
const gc = $('game'), g = gc.getContext('2d');
const dc = $('dish'), dg = dc.getContext('2d');
const cc = $('chart'), cg = cc.getContext('2d');
function fit(c){const r=window.devicePixelRatio||1,w=c.width,h=c.height;if(!c._fit){c._fit=1;c._w=w;c._h=h;c.width=w*r;c.height=h*r;c.getContext('2d').scale(r,r);}}
[gc,dc,cc].forEach(fit);

const TR = 240, trV = new Float32Array(TR), trT = new Uint8Array(TR); let trI = 0;
const glowS = new Array(NS).fill(0), glowM = new Array(2*NM).fill(0);
let speed = 1, acc = 0, last = 0, lastSnd = 0;

/* sound */
let ac = null, soundOn = false;
function tone(f, at, dur, gain, type){const o=ac.createOscillator(),v=ac.createGain();o.type=type;o.frequency.value=f;v.gain.setValueAtTime(gain,at);v.gain.exponentialRampToValueAtTime(0.0001,at+dur);o.connect(v);v.connect(ac.destination);o.start(at);o.stop(at+dur+0.02);}
function playHit(){const t=ac.currentTime;for(let k=0;k<6;k++)tone(440,t+k*0.1,0.12,0.08,'sine');}
function playMiss(){const t=ac.currentTime;for(let k=0;k<14;k++)tone(90+Math.random()*1100,t+Math.random()*0.6,0.05,0.05,Math.random()<.5?'sawtooth':'square');}

function run(n){
  for(let i=0;i<n;i++){
    dish.step();
    let tot=0;for(let j=0;j<2*NM;j++){tot+=dish.spk[j];glowM[j]=Math.max(dish.spk[j],glowM[j]*0.82);}
    for(let k=0;k<NS;k++)glowS[k]=Math.max(dish.s[k],glowS[k]*0.8);
    trV[trI]=tot;trT[trI]=dish.fb>0?(dish.fbType==='hit'?1:2):0;trI=(trI+1)%TR;
    while(dish.events.length){
      const ev=dish.events.shift();
      if(soundOn&&ac&&speed<=5&&performance.now()-lastSnd>350){lastSnd=performance.now();ev==='hit'?playHit():playMiss();}
    }
  }
}

function drawGame(){
  const d=dish;g.fillStyle='#1b1838';g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(200,195,255,.15)';g.setLineDash([8,10]);g.beginPath();g.moveTo(W/2,0);g.lineTo(W/2,H);g.stroke();g.setLineDash([]);
  const calm=d.fb>0&&d.fbType==='hit',chaos=d.fb>0&&d.fbType==='miss';
  if(calm){const p=((6-(d.fb%6))%6)/6;g.strokeStyle='rgba(79,216,208,'+(1-p).toFixed(2)+')';g.lineWidth=3;g.beginPath();g.arc(PX,d.paddle,14+p*70,0,6.283);g.stroke();g.lineWidth=1;}
  if(chaos){for(let k=0;k<110;k++){g.fillStyle=Math.random()<.6?'rgba(255,106,77,.55)':'rgba(255,255,255,.4)';g.fillRect(Math.random()*W,Math.random()*H,2+Math.random()*7,2+Math.random()*3);}}
  g.fillStyle=calm?'#4fd8d0':chaos?'#ff6a4d':'#e9e6ff';
  g.fillRect(PX-5,d.paddle-PH/2,10,PH);
  if(!d.frozen){g.fillStyle='#fff';g.beginPath();g.arc(d.bx,d.by,BR,0,6.283);g.fill();}
}

function drawDish(){
  const w=dc._w,h=dc._h,d=dish;dg.fillStyle='#1b1838';dg.fillRect(0,0,w,h);
  dg.font='12px "IBM Plex Sans",system-ui,sans-serif';dg.fillStyle='rgba(220,216,255,.7)';
  dg.fillText('Sensory electrodes: where the ball is',10,16);
  for(let i=0;i<NS;i++){const x=24+i*(w-48)/(NS-1),a=glowS[i];dg.fillStyle='rgba(169,155,255,'+(0.15+0.85*a).toFixed(2)+')';dg.beginPath();dg.arc(x,38,5+a*3,0,6.283);dg.fill();}
  dg.fillStyle='rgba(220,216,255,.7)';dg.fillText('Cells that push the paddle up',10,74);dg.fillText('Cells that push it down',10,154);
  for(let j=0;j<2*NM;j++){const pool=j<NM?0:1,k=j%NM,x=30+(k%6)*((w-60)/5),y=(pool?174:94)+Math.floor(k/6)*26,a=glowM[j];
    dg.fillStyle='rgba(235,80,140,'+(0.18+0.82*a).toFixed(2)+')';dg.beginPath();dg.arc(x,y,6+a*3,0,6.283);dg.fill();}
  // drive bar
  dg.fillStyle='rgba(255,255,255,.12)';dg.fillRect(10,222,w-20,4);dg.fillStyle='#ffd166';dg.fillRect(w/2,220,-d.drive*(w/2-12),8);
  dg.fillStyle='rgba(220,216,255,.7)';dg.fillText('up',10,246);dg.fillText('down',w-34,246);
  // activity trace
  dg.fillStyle='rgba(220,216,255,.7)';dg.fillText('Activity',10,264);
  const y0=292,sx=(w-20)/TR;
  for(let k=1;k<TR;k++){const a=(trI+k-1)%TR,b=(trI+k)%TR;dg.strokeStyle=trT[b]===1?'#4fd8d0':trT[b]===2?'#ff6a4d':'rgba(200,195,255,.55)';dg.lineWidth=1.5;
    dg.beginPath();dg.moveTo(10+(k-1)*sx,y0-Math.min(trV[a],14)*1.6);dg.lineTo(10+k*sx,y0-Math.min(trV[b],14)*1.6);dg.stroke();}
}

function drawChart(){
  const w=cc._w,h=cc._h,hs=dish.history,n=hs.length;cg.clearRect(0,0,w,h);
  const css=getComputedStyle(document.documentElement),ink=css.getPropertyValue('--muted').trim(),acc=css.getPropertyValue('--accent').trim(),ln=css.getPropertyValue('--line').trim();
  cg.font='12px "IBM Plex Sans",system-ui,sans-serif';cg.fillStyle=ink;
  const L=34,R=8,T=8,B=20,pw=w-L-R,ph=h-T-B;
  cg.strokeStyle=ln;cg.lineWidth=1;for(const v of[0,.5,1]){const y=T+ph*(1-v);cg.beginPath();cg.moveTo(L,y);cg.lineTo(w-R,y);cg.stroke();cg.fillText(Math.round(v*100)+'%',2,y+4);}
  if(n<5){cg.fillText('Waiting for the first rallies',L+10,T+ph/2);return;}
  const pre=[0];for(let i=0;i<n;i++)pre.push(pre[i]+hs[i]);
  const pts=Math.min(n,260);cg.beginPath();
  for(let p=0;p<pts;p++){const idx=Math.floor((p+1)*n/pts)-1,s=Math.max(0,idx-19),v=(pre[idx+1]-pre[s])/(idx+1-s);const x=L+pw*(p/Math.max(1,pts-1)),y=T+ph*(1-v);p?cg.lineTo(x,y):cg.moveTo(x,y);}
  cg.strokeStyle=acc;cg.lineWidth=2.5;cg.stroke();
  cg.fillStyle=ink;cg.fillText('rally 1',L,h-5);cg.textAlign='right';cg.fillText('rally '+n,w-R,h-5);cg.textAlign='left';
}

function stats(){
  const d=dish,n=d.history.length;$('sRal').textContent=n;
  $('s20').textContent=n?Math.round(100*d.rate(20))+'%':'–';$('s100').textContent=n?Math.round(100*d.rate(100))+'%':'–';
  const s=$('status');if(d.fb>0&&d.fbType==='hit'){s.textContent='Calm steady beat';s.className='hit';}else if(d.fb>0){s.textContent='Random noise burst';s.className='miss';}else{s.textContent='Playing';s.className='';}
}

let chartTick=0;
function frame(t){
  const dt=Math.min(50,t-last);last=t;acc+=dt/16.667*speed;let n=Math.floor(acc);acc-=n;run(Math.min(n,600));
  drawGame();drawDish();stats();if(++chartTick%6===0)drawChart();
  requestAnimationFrame(frame);
}

document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{speed=+b.dataset.speed;document.querySelectorAll('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',x===b));}));
$('reset').addEventListener('click',()=>{dish.reset();trV.fill(0);trT.fill(0);glowS.fill(0);glowM.fill(0);drawChart();});
$('snd').addEventListener('click',e=>{soundOn=!soundOn;if(soundOn&&!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(_){soundOn=false;}}
  e.target.setAttribute('aria-pressed',soundOn);e.target.textContent=soundOn?'Sound on':'Sound off';});
requestAnimationFrame(frame);

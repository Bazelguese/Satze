import React, { useEffect, useRef } from 'react';

/**
 * HUD cosmico del duello.
 *
 * Ogni pannello reale (stats, Anteprima, insegna di conquista, tabellone,
 * log/FC, pannello campo, round, uscita) riceve un proprio <canvas> come
 * figlio, dietro al contenuto: così eredita trasformazioni 2.5D, respiro,
 * dissolvenze e flip del pannello senza calcoli. Un solo contesto WebGL
 * fuori schermo disegna, pannello per pannello, una finestra sul cosmo
 * (nebulosa e tre livelli di stelle in parallasse col mouse, bordo di luce,
 * costola d'accento) e la copia nel canvas del pannello.
 *
 * Il pannello campo al centro è un portale: ellisse con l'anteprima del campo,
 * cornice di anelli in rotazione continua e anello di avanzamento del round.
 * Il fondo di ogni pannello è spazio profondo sempre in moto: banchi di
 * nebulosa che scorrono e stelle che vengono incontro, come oltre un portale.
 * Sui box PV/FC corre un flusso di luce lungo il bordo, veloce per chi sta
 * agendo e lento per l'altro: a ogni PV perso si glitcha, e a soglie di PV (18, 12, 6) diventa
 * sempre più rosso, spezzato e corrotto. Altri effetti: cosmo che si spegne
 * coi PV, impulso sugli FC spesi, sigillo runico sul campo conquistato (canvas sopra le righe del
 * tabellone), stella nel log a ogni evento, lampo e onda d'urto allo scontro
 * (canvas 2D a tutta scena).
 */

const W = 1920;
/** durata dell'apertura del portale (s): uguale all'animazione CSS bf-portal-open */
const PORTAL_INTRO_S = 0.9;
const H = 1080;
const PAD = 28; // alone fuori dal pannello
const SC = 0.75; // risoluzione del disegno rispetto ai px CSS

// argento freddo: il colore nel duello resta alle due armate (box PV/FC, sigilli, lampo)
const SILVER = '#b4bfd0';

// kind: 0 pannello · 1 stats · 2 log · 3 portale (pannello campo con .satze-bf-portal-disc)
const PANEL_DEFS = [
  { sel: '.satze-stats-panel--enemy', acc: 'enemy', cut: 12, kind: 1, side: 0, seed: 0 },
  { sel: '.satze-stats-panel--player', acc: 'player', cut: 12, kind: 1, side: 1, seed: 1 },
  { sel: '.imp-preview', acc: SILVER, cut: 30, kind: 0, seed: 2 },
  { sel: '.imp-topbar', acc: SILVER, cut: 30, kind: 0, seed: 3 },
  { sel: '.imp-board', acc: SILVER, cut: 30, kind: 0, seed: 4 },
  { sel: '.satze-panel-flip-container', acc: SILVER, cut: 30, kind: 2, seed: 5 },
  { sel: '.satze-battlefield-panel', acc: SILVER, cut: 26, kind: 0, seed: 6, portal: true },
  { sel: '.hud-round', acc: SILVER, cut: 10, kind: 0, seed: 7 },
  { sel: '.hud-exit', acc: SILVER, cut: 8, kind: 0, seed: 8 },
];

const VS = 'attribute vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }';

const FS = `
precision highp float;
uniform float uScale; uniform float uVH; uniform float uPad;
uniform float uMode;            // 0 finestra cosmica · 1 sigilli sul tabellone
uniform vec2 uSize; uniform float uSeed;
uniform vec3 uAcc; uniform float uCut; uniform float uKind;
uniform float uTime; uniform vec2 uLook;
uniform float uLum; uniform float uHitT; uniform float uFcT; uniform float uCor; uniform float uHead;
uniform vec3 uStar; uniform vec3 uCircle; uniform vec3 uEll;   // uEll: semiasse y, avanzamento, apertura
uniform vec4 uRow[5]; uniform float uSealB[5]; uniform float uSealW[5];
uniform vec3 uColP; uniform vec3 uColE;

const vec3 ICE=vec3(.78,.86,.98);   // bianco freddo per stelle e scintille

float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.03+17.1; a*=.5; } return v; }
float fbm3(vec2 p){ float v=0., a=.5; for(int i=0;i<3;i++){ v+=a*noise(p); p=p*2.07+11.3; a*=.5; } return v; }
float shapeD(vec2 q, vec2 s, float c){
  float d=min(min(q.x,q.y),min(s.x-q.x,s.y-q.y));
  d=min(d,(q.x+q.y-c)*.7071);
  d=min(d,((s.x-q.x)+(s.y-q.y)-c*.4)*.7071);
  return d; }
vec3 starLayer(vec2 p, float sc, float dens, float seed){
  vec2 g=floor(p/sc); vec2 f=fract(p/sc); float h=hash(g+seed); if(h>dens) return vec3(0.);
  vec2 c=vec2(hash(g+3.1+seed),hash(g+5.7+seed)); vec2 dv=(f-c)*sc; float d=length(dv);
  float tw=.5+.5*sin(uTime*(1.2+h*3.)+h*50.);
  float core=smoothstep(1.4,0.,d);
  float flare=step(h,dens*.12)*smoothstep(1.2,0.,min(abs(dv.x),abs(dv.y)))*smoothstep(sc*.35,0.,d)*.8;
  vec3 tint=mix(vec3(1.),vec3(.82,.89,1.),step(dens*.5,h));
  return tint*(core+flare)*tw; }
vec3 nebula(vec2 p, float seed){
  vec2 w=vec2(fbm3(p*.003+seed),fbm3(p*.003+seed+9.));
  float n=fbm(p*.0045+w*1.8+seed+uTime*.02);
  float n2=fbm3(p*.009-w+seed*2.+uTime*.03);
  // nebulosa grigio-acciaio: toni freddi e quasi desaturati
  vec3 c=vec3(.07,.085,.11)*smoothstep(.3,.8,n);
  c+=vec3(.26,.30,.37)*smoothstep(.55,.9,n)*.9;
  c+=vec3(.70,.76,.86)*smoothstep(.78,.98,n)*.4;
  c+=vec3(.45,.58,.72)*smoothstep(.72,.95,n2)*.12;
  return c; }
// finestra sullo spazio profondo, sempre in moto: due banchi di nebulosa che
// scorrono a velocità diverse (profondità) e stelle che vengono incontro
// in un risucchio continuo, come oltre un portale
vec3 portal(vec2 q, vec2 s, float seed, float lum){
  vec2 d=q-s*.5+uLook*vec2(14.,10.);
  float t=uTime;
  // nei pannelli piccoli (stats, round) il cosmo resta un fondo discreto
  float big=smoothstep(60.,260.,min(s.x,s.y));
  float gi=mix(.35,1.,big);
  vec2 dir=vec2(cos(seed*2.1+.6),sin(seed*2.1+.6));
  vec3 col=vec3(.008,.010,.016);
  col+=nebula(d+dir*t*9.+seed*300.,seed)*gi;
  col+=nebula(d*.6-dir*t*24.+seed*170.,seed+4.)*.5*gi;
  col*=lum;
  for(int i=0;i<3;i++){
    float fi=float(i);
    float ph=fract(t*.035+fi/3.);
    float z=mix(.3,2.4,ph*ph);
    float fade=smoothstep(0.,.2,ph)*smoothstep(1.,.75,ph);
    col+=starLayer(d/z+seed*50.,14.+fi*9.,.07,seed*7.+fi*3.)*fade*(.7+fi*.25)*lum;
  }
  col+=starLayer(d-uLook*6.,9.,.04,seed+11.)*.25*lum;
  return col; }

void main(){
  // coordinate locali del pannello in px CSS (0,0 = angolo alto sinistro)
  vec2 q=vec2(gl_FragCoord.x, uVH-gl_FragCoord.y)/uScale-uPad;
  vec3 col=vec3(0.); float alpha=0.;

  if(uMode<.5 && uKind>2.5){
    // portale del campo: ellisse (coperta dall'anteprima), cornice di anelli e
    // anello di avanzamento del round in cinque tratti. L'anello di rune che
    // gira sta nel DOM (SVG), tra il filo del bordo e le tacche.
    // uEll.z = apertura 0→1: l'ellisse cresce dal centro all'inizio del round
    float op=clamp(uEll.z,0.,1.2);
    vec2 s=uSize; vec2 c=uCircle.xy; vec2 ab=vec2(uCircle.z,uEll.x)*max(op,.001);
    vec2 dd=q-c; float t=uTime;
    vec2 pn=dd/ab; float k0=length(pn);
    float r=(k0-1.)*k0/max(length(dd/(ab*ab)),1e-4);   // distanza (px) dal bordo
    float an=atan(pn.y,pn.x)/6.2831853+.5;
    float top=fract(atan(pn.x,-pn.y)/6.2831853+1.);   // 0 in alto, cresce in senso orario
    float fade=smoothstep(0.,.35,op);
    vec3 cs=portal(q,s,uSeed,1.);
    float disc=smoothstep(.5,-1.,r);
    float band=smoothstep(-2.,1.,r)*smoothstep(33.,29.,r);
    vec3 lc=vec3(.82,.87,.95);
    float l1=smoothstep(1.6,0.,abs(r-1.));                                    // filo sul bordo
    float l3=smoothstep(3.2,0.,abs(r-15.))*step(.78,fract(an*72.-t*.05));      // tacche, senso antiorario
    // anello di avanzamento: binario tenue, tratto pieno fino a uEll.y, testa luminosa (solo sull'anello)
    float prog=clamp(uEll.y,0.,1.);
    float ring=smoothstep(2.4,0.,abs(r-24.));
    float gap=smoothstep(.004,.012,abs(fract(top*5.+.5)-.5)/5.);
    float fill=step(top,prog)*gap;
    float head=exp(-abs(top-prog)*140.)*step(.001,prog)*smoothstep(8.,0.,abs(r-24.));
    float track=ring*gap*.28;
    float nodes=0.;
    for(int k=0;k<3;k++){
      float ang=t*.5+float(k)*2.0944;
      nodes+=exp(-length(q-(c+vec2(cos(ang),sin(ang))*(ab+8.)))*.32);
    }
    float halo=exp(-max(0.,r-24.)*.1)*step(24.,r)*.2;
    col=cs*(disc+band*.85)+lc*(l1*1.2+l3*.7+track+halo)+ICE*(ring*fill*1.5+head*2.5)+ICE*nodes*1.3;
    alpha=max(max(disc*.94,band*.85),max(max(l1,l3),track));
    alpha=max(alpha,max(ring*fill,max(min(1.,nodes+head),halo)))*fade;
    gl_FragColor=vec4(col*alpha,alpha); return;
  }
  if(uMode<.5){
    vec2 s=uSize; float cut=uCut;
    bool stats=uKind>.5 && uKind<1.5;
    float hitB=exp(-uHitT*4.);   // raffica al colpo
    float cor=uCor;              // corruzione permanente, cresce a soglie di PV
    float comet=0., th=0.; vec3 fc=uAcc;
    if(stats){
      // strappi orizzontali: forti al colpo, intermittenti con la corruzione
      float tick=floor(uTime*(10.+30.*cor));
      float on=step(hash(vec2(tick,7.)),.12+.5*cor);
      float band=floor(q.y/(3.+5.*hash(vec2(tick,floor(q.y/11.)))));
      q.x+=(hash(vec2(band,tick))-.5)*(26.*hitB+12.*cor*on);
      // flusso di luce che corre lungo il bordo
      vec2 cq=(q-s*.5)/s; th=atan(cq.y,cq.x)/6.2831853+.5;
      float head=fract(uHead);   // fase calcolata in JS: veloce per chi agisce, lenta per l'altro
      float f1=fract(head-th), f2=fract(head+.5-th);
      comet=exp(-f1*5.)+exp(-f2*5.)*.65;
      fc=mix(uAcc,vec3(1.,.1,.14),smoothstep(0.,1.,cor)*.92);
      fc=mix(fc,vec3(1.,.96,1.),hitB*.6*step(.5,hash(vec2(floor(uTime*25.),1.))));
    }
    float d=shapeD(q,s,cut);
    if(d<0.){
      float g=smoothstep(24.,0.,-d)*.35;
      vec3 gc=uAcc*g*.6; float ga=g*.6;
      if(stats){
        float gl=smoothstep(18.,0.,-d)*(comet*1.1+.14)*(1.+hitB);
        gc=fc*gl; ga=min(1.,gl);
      }
      gl_FragColor=vec4(gc,ga); return;
    }
    vec3 pc=portal(q,s,uSeed,uLum);
    float depth=smoothstep(0.,min(46.,min(s.x,s.y)*.35),d);
    float a=mix(.55,.93,depth);
    float rim=smoothstep(1.3,0.,d);
    pc+=mix(vec3(.82,.86,.94),uAcc,.5)*rim*1.1+uAcc*exp(-d*.09)*.16;
    float sx=q.x-max(0.,cut-q.y);
    float spine=smoothstep(3.,1.5,sx)*step(0.,sx);
    pc+=uAcc*spine*1.1;
    a=max(a,max(rim,spine));

    if(stats){
      // bordo: base che pulsa + comete; con la corruzione si spezza e sdoppia i canali
      float seg=step(cor*.35+hitB*.5,hash(vec2(floor(th*48.),floor(uTime*(4.+10.*cor)))));
      float off=1.5*cor+3.*hitB;
      float edge=smoothstep(3.2,0.,d)*seg;
      float base=.3+.2*sin(th*18.85-uTime*2.);
      pc+=fc*edge*(comet*2.8+base*.6);
      pc.r+=smoothstep(2.4,0.,abs(d-off))*seg*comet*(cor+hitB)*.9;
      pc.gb+=smoothstep(2.4,0.,abs(d-off*2.))*seg*comet*(cor+hitB)*vec2(.5,.6);
      a=max(a,edge*min(1.,comet*1.5+.4));
      // cosmo che vira al rosso
      pc=mix(pc,pc*vec3(1.35,.42,.5),cor*.7);
      // blocchi corrotti e buchi neri
      vec2 bl=floor(q/vec2(9.,5.)); float bt=floor(uTime*(7.+14.*cor));
      float bh=hash(bl+bt*1.7);
      if(bh<.05*cor+.28*hitB) pc=mix(pc,hash(bl+3.)>.5?vec3(1.,.1,.2):ICE*.75,.75);
      else if(bh>1.-.05*cor) pc*=.12;
      // sfarfallio a corruzione alta
      a*=1.-cor*.25*step(.8,hash(vec2(floor(uTime*18.),5.)));
      pc+=ICE*exp(-uFcT*3.)*.5*smoothstep(0.,20.,d);
    }
    if(uKind>1.5 && uStar.z>=0.){
      float age=uTime-uStar.z; vec2 dv=q-uStar.xy; float fl=exp(-age*2.2);
      float core=smoothstep(3.,0.,length(dv))*fl;
      float cross=smoothstep(1.5,0.,min(abs(dv.x),abs(dv.y)))*smoothstep(26.*(.4+fl),0.,length(dv))*fl;
      pc+=ICE*(core*2.+cross*1.6);
    }
    col=pc; alpha=a;
  } else {
    // sigilli runici sulle righe conquistate del tabellone
    for(int k=0;k<5;k++){
      if(uSealB[k]<0.) continue;
      vec4 rr=uRow[k];
      if(rr.z<1.) continue;
      float age=uTime-uSealB[k]; vec3 wc=uSealW[k]>0.?uColP:uColE;
      vec2 dv=q-(rr.xy+vec2(rr.z-22.,rr.w*.5)); float rd=length(dv); float an=atan(dv.y,dv.x);
      float R=min(16.,rr.w*.42)*(1.-exp(-age*9.)); float rot=an+age*.8;
      float g=max(max(smoothstep(1.3,.2,abs(rd-R)),smoothstep(1.,.2,abs(rd-R*.66))),
                  smoothstep(1.1,.3,abs(rd-R*.83))*step(.55,fract(rot*6./3.14159)));
      g=max(g,step(rd,R*.5)*smoothstep(.12,0.,abs(fract((an-age*.5)*4./6.28318)-.5)*rd/R*.9-.02));
      float disc=step(rd,R)*.55;
      float sw=smoothstep(2.5,0.,abs(rd-age*170.))*exp(-age*2.5);
      col=mix(col,vec3(.02,.01,.04),disc*(1.-g))+wc*(g*1.3+sw*1.5);
      alpha=max(alpha,max(disc,max(g,sw)));
    }
  }
  gl_FragColor=vec4(col*alpha,alpha);
}
`;

function hexToRgb(hex, fallback = [0.75, 0.15, 0.83]) {
  if (!hex || typeof hex !== 'string') return fallback;
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return fallback;
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

/** soglie di corruzione del box PV/FC: integro sopra 18, poi ≤18, ≤12, ≤6 */
function corruptionStage(hp, max) {
  const f = (hp ?? max) / max;
  if (f <= 0.24) return 3;
  if (f <= 0.48) return 2;
  if (f <= 0.72) return 1;
  return 0;
}

/** posizione di layout (senza trasformazioni) di el rispetto a un antenato */
function layoutOffset(el, root) {
  let x = 0;
  let y = 0;
  let n = el;
  while (n && n !== root) {
    x += n.offsetLeft || 0;
    y += n.offsetTop || 0;
    const next = n.offsetParent;
    if (!next || next === root || !root.contains(next)) break;
    n = next;
  }
  return [x, y];
}

/** canvas figlio del pannello, dietro al contenuto (o sopra, per i sigilli) */
function ensurePanelCanvas(el, key, z) {
  let cv = el[key];
  if (cv && cv.parentNode === el) return cv;
  cv = document.createElement('canvas');
  cv.className = 'cosmo-panel-canvas';
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, {
    position: 'absolute',
    left: `${-PAD}px`,
    top: `${-PAD}px`,
    width: `calc(100% + ${PAD * 2}px)`,
    height: `calc(100% + ${PAD * 2}px)`,
    pointerEvents: 'none',
    zIndex: String(z),
  });
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.classList.add('cosmo-host');
  el.appendChild(cv);
  el[key] = cv;
  return cv;
}

export function DuelCosmicHud({
  playerHP,
  enemyHP,
  playerFocus,
  enemyFocus,
  conqueredFields,
  playerColor,
  enemyColor,
  gamePhase,
  duelPhase,
  battleResult,
  eventsCount = 0,
  maxHP = 25,
  /** 'player' | 'enemy' | null — chi sta agendo (come il badge "Tocca a te") */
  turnSide = null,
}) {
  const hostRef = useRef(null);
  const stateRef = useRef({
    hitAt: [-99, -99],
    fcAt: [-99, -99],
    sealAt: [-1, -1, -1, -1, -1],
    sealWho: [0, 0, 0, 0, 0],
    starAt: -99,
    flash: [0, 0, -99, 0],
  });
  const propsRef = useRef({});
  const t0Ref = useRef(performance.now());
  const now = () => (performance.now() - t0Ref.current) / 1000;

  propsRef.current = { playerHP, enemyHP, playerColor, enemyColor, maxHP, turnSide };

  // PV persi → raffica di glitch sul box di chi è colpito
  const prevHp = useRef({ p: playerHP, e: enemyHP });
  useEffect(() => {
    const st = stateRef.current;
    const add = (side) => { st.hitAt[side] = now(); };
    if (playerHP < prevHp.current.p) add(1);
    if (enemyHP < prevHp.current.e) add(0);
    prevHp.current = { p: playerHP, e: enemyHP };
  }, [playerHP, enemyHP]);

  // FC spesi → impulso sul pannello stats
  const prevFc = useRef({ p: playerFocus, e: enemyFocus });
  useEffect(() => {
    const st = stateRef.current;
    if (playerFocus < prevFc.current.p) st.fcAt[1] = now();
    if (enemyFocus < prevFc.current.e) st.fcAt[0] = now();
    prevFc.current = { p: playerFocus, e: enemyFocus };
  }, [playerFocus, enemyFocus]);

  // campo conquistato → sigillo runico sulla riga del tabellone
  useEffect(() => {
    const st = stateRef.current;
    for (let i = 0; i < 5; i++) {
      const c = conqueredFields?.[i];
      const who = c ? (typeof c === 'object' ? (c.winner === 'player' ? 1 : c.winner === 'enemy' ? -1 : 0) : 0) : 0;
      if (c && st.sealAt[i] < 0) { st.sealAt[i] = now(); st.sealWho[i] = who; }
      if (!c) { st.sealAt[i] = -1; st.sealWho[i] = 0; }
    }
  }, [conqueredFields]);

  // nuovo evento nel log → stella
  const prevEvents = useRef(eventsCount);
  useEffect(() => {
    if (eventsCount > prevEvents.current) stateRef.current.starAt = now();
    prevEvents.current = eventsCount;
  }, [eventsCount]);

  // scontro (fase 4) → lampo e onda d'urto nel colore di chi vince
  useEffect(() => {
    if (gamePhase === 'result' && duelPhase === 4 && battleResult) {
      const w = battleResult.winner === 'player' ? 1 : battleResult.winner === 'enemy' ? -1 : 0;
      stateRef.current.flash = [W / 2 - 120, H / 2, now(), w];
    }
  }, [gamePhase, duelPhase, battleResult]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const scene = host.parentElement;

    // lampo dello scontro: canvas 2D a tutta scena
    const flashCv = document.createElement('canvas');
    flashCv.width = Math.round(W * 0.5);
    flashCv.height = Math.round(H * 0.5);
    Object.assign(flashCv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
    host.appendChild(flashCv);
    const fctx = flashCv.getContext('2d');

    // contesto WebGL unico, fuori dal DOM
    const glCv = document.createElement('canvas');
    let glW = 640;
    let glH = 960;
    glCv.width = glW;
    glCv.height = glH;
    const gl = glCv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false });
    if (!gl) { flashCv.remove(); return undefined; }
    let dead = false;
    let raf = 0;
    const onLost = (e) => { e.preventDefault(); dead = true; cancelAnimationFrame(raf); };
    glCv.addEventListener('webglcontextlost', onLost);

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[DuelCosmicHud]', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { flashCv.remove(); return undefined; }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[DuelCosmicHud]', gl.getProgramInfoLog(prog));
      flashCv.remove();
      return undefined;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aL = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(aL);
    gl.vertexAttribPointer(aL, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    ['uScale', 'uVH', 'uPad', 'uMode', 'uSize', 'uSeed', 'uAcc', 'uCut', 'uKind', 'uTime', 'uLook',
      'uLum', 'uHitT', 'uFcT', 'uCor', 'uHead', 'uCircle', 'uEll', 'uStar', 'uRow', 'uSealB', 'uSealW', 'uColP', 'uColE']
      .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    gl.clearColor(0, 0, 0, 0);
    gl.uniform1f(U.uScale, SC);
    gl.uniform1f(U.uPad, PAD);

    let look = [0, 0];
    let target = [0, 0];
    let lastMove = -10;
    const onMove = (e) => {
      const r = scene.getBoundingClientRect();
      target = [((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2];
      lastMove = now();
    };
    window.addEventListener('pointermove', onMove);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const cor = [0, 0];
    const spd = [0.18, 0.18];
    const head = [0, 0.37];
    let lastT = now();
    const hosts = new Set();

    // disegna una regione (cw × ch) nel contesto GL e la copia nel canvas del pannello
    const blit = (cv, cw, ch) => {
      if (cv.width !== cw) cv.width = cw;
      if (cv.height !== ch) cv.height = ch;
      if (cw > glW || ch > glH) {
        glW = Math.max(glW, cw);
        glH = Math.max(glH, ch);
        glCv.width = glW;
        glCv.height = glH;
      }
      gl.viewport(0, 0, cw, ch);
      gl.uniform1f(U.uVH, ch);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(glCv, 0, glCv.height - ch, cw, ch, 0, 0, cw, ch);
    };

    const frame = () => {
      if (dead) return;
      const t = now();
      const st = stateRef.current;
      const pr = propsRef.current;
      const colP = hexToRgb(pr.playerColor, [0.635, 0.533, 0.984]);
      const colE = hexToRgb(pr.enemyColor, [0.984, 0.569, 0.176]);
      const mh = Math.max(1, pr.maxHP || 25);
      const dt = Math.min(0.1, t - lastT);
      lastT = t;
      const lumOf = (hp) => 0.35 + 0.65 * Math.max(0, Math.min(1, (hp ?? mh) / mh));

      if (t - lastMove > 3) target = [Math.cos(t * 0.2) * 0.6, Math.sin(t * 0.27) * 0.5];
      look = [look[0] + (target[0] - look[0]) * 0.06, look[1] + (target[1] - look[1]) * 0.06];

      gl.uniform1f(U.uTime, reduce ? 0 : t);
      gl.uniform2f(U.uLook, look[0], look[1]);
      gl.uniform3f(U.uColP, colP[0], colP[1], colP[2]);
      gl.uniform3f(U.uColE, colE[0], colE[1], colE[2]);

      PANEL_DEFS.forEach((def) => {
        const el = scene.querySelector(def.sel);
        if (!el) return;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w < 3 || h < 3) return;
        hosts.add(el);
        const cv = ensurePanelCanvas(el, '__cosmoBg', -1);
        const cw = Math.round((w + PAD * 2) * SC);
        const ch = Math.round((h + PAD * 2) * SC);
        const acc = def.acc === 'player' ? colP : def.acc === 'enemy' ? colE : hexToRgb(def.acc);

        gl.uniform1f(U.uMode, 0);
        gl.uniform2f(U.uSize, w, h);
        gl.uniform1f(U.uSeed, def.seed);
        gl.uniform3f(U.uAcc, acc[0], acc[1], acc[2]);
        gl.uniform1f(U.uCut, def.cut);
        let kind = def.kind;
        if (def.portal && !el.querySelector('.satze-bf-portal-disc')) {
          // pannello campo senza portale (fine partita, passaggi di fase): niente riquadro
          const ctx = cv.getContext('2d');
          ctx.clearRect(0, 0, cv.width, cv.height);
          return;
        }
        if (def.portal) {
          const disc = el.querySelector('.satze-bf-portal-disc');
          if (disc && disc.offsetWidth > 10) {
            const [dx, dy] = layoutOffset(disc, el);
            gl.uniform3f(U.uCircle, dx + disc.offsetWidth / 2, dy + disc.offsetHeight / 2, disc.offsetWidth / 2);
            // l'anello di avanzamento scorre verso il valore nuovo invece di saltare
            const target = parseFloat(disc.dataset.progress) || 0;
            const cur = el.__cosmoProg ?? target;
            el.__cosmoProg = target < cur - 0.3 ? target : cur + (target - cur) * 0.08;
            // apertura del portale a inizio round: parte quando cambia data-intro
            if (el.__cosmoIntro !== disc.dataset.intro) {
              el.__cosmoIntro = disc.dataset.intro;
              el.__cosmoIntroAt = t;
            }
            const u = Math.min(1, (t - (el.__cosmoIntroAt ?? -9)) / PORTAL_INTRO_S);
            const back = 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2); // ease-out con leggero rimbalzo
            gl.uniform3f(U.uEll, disc.offsetHeight / 2, el.__cosmoProg, reduce ? 1 : back);
            kind = 3;
          }
        }
        gl.uniform1f(U.uKind, kind);
        if (def.kind === 1) {
          gl.uniform1f(U.uLum, lumOf(def.side === 1 ? pr.playerHP : pr.enemyHP));
          gl.uniform1f(U.uHitT, t - st.hitAt[def.side]);
          gl.uniform1f(U.uFcT, t - st.fcAt[def.side]);
          const hp = def.side === 1 ? pr.playerHP : pr.enemyHP;
          const stage = corruptionStage(hp, mh);
          cor[def.side] += (stage / 3 - cor[def.side]) * 0.04;
          gl.uniform1f(U.uCor, cor[def.side]);
          // luce sul bordo: veloce per chi sta agendo, lenta per l'altro; il colpo la strattona
          const turn = pr.turnSide == null ? -1 : pr.turnSide === 'player' ? 1 : 0;
          const base = turn === def.side ? 0.62 : turn === -1 ? 0.2 : 0.12;
          spd[def.side] += (base * (1 - 0.35 * cor[def.side]) - spd[def.side]) * 0.06;
          const jolt = 0.9 * Math.exp(-(t - st.hitAt[def.side]) * 4) + 0.06 * cor[def.side] * Math.sin(t * 7);
          head[def.side] = (head[def.side] + dt * (spd[def.side] + jolt)) % 1;
          gl.uniform1f(U.uHead, head[def.side]);
          // anche il testo del box sente il colpo e la corruzione (vedi CSS)
          if (el.dataset.cosmoStage !== String(stage)) el.dataset.cosmoStage = String(stage);
          el.classList.toggle('cosmo-hit', t - st.hitAt[def.side] < 0.5);
        } else {
          gl.uniform1f(U.uLum, 1);
          gl.uniform1f(U.uHitT, 99);
          gl.uniform1f(U.uFcT, 99);
          gl.uniform1f(U.uCor, 0);
        }
        gl.uniform3f(U.uStar, 22, 18, def.kind === 2 && t - st.starAt < 6 ? st.starAt : -1);
        blit(cv, cw, ch);

        // i campi conquistati hanno il sigillo di ceralacca in DOM (WaxSeal)
      });

      // lampo dello scontro
      const fa = t - st.flash[2];
      fctx.clearRect(0, 0, flashCv.width, flashCv.height);
      if (fa >= 0 && fa < 3) {
        const k = flashCv.width / W;
        const x = st.flash[0] * k;
        const y = st.flash[1] * k;
        const wc = st.flash[3] > 0.5 ? colP : st.flash[3] < -0.5 ? colE : [1, 1, 1];
        const rgb = (c, a) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
        const f1 = Math.exp(-fa * 5) * 0.9;
        if (f1 > 0.01) {
          const g = fctx.createRadialGradient(x, y, 0, x, y, 900 * k);
          g.addColorStop(0, `rgba(255,242,255,${f1})`);
          g.addColorStop(1, 'rgba(255,242,255,0)');
          fctx.fillStyle = g;
          fctx.fillRect(0, 0, flashCv.width, flashCv.height);
        }
        const f2 = Math.exp(-fa * 1.8) * 1.2;
        if (f2 > 0.01) {
          fctx.strokeStyle = rgb(wc, Math.min(1, f2));
          fctx.lineWidth = 10 * k;
          fctx.shadowColor = rgb(wc, Math.min(1, f2));
          fctx.shadowBlur = 24 * k;
          fctx.beginPath();
          fctx.arc(x, y, fa * 900 * k, 0, Math.PI * 2);
          fctx.stroke();
          fctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      glCv.removeEventListener('webglcontextlost', onLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      flashCv.remove();
      hosts.forEach((el) => {
        el.__cosmoBg?.remove();
        el.__cosmoTop?.remove();
        el.__cosmoBg = null;
        el.__cosmoTop = null;
        el.classList.remove('cosmo-host', 'cosmo-hit');
        delete el.dataset.cosmoStage;
      });
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="duel-cosmic-hud-host"
      aria-hidden
      style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none', zIndex: 30 }}
    />
  );
}

export default DuelCosmicHud;

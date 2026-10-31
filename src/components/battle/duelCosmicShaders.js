// Shader dello sfondo cosmico del duello (DuelCosmicHud).
// Modulo a parte: il riscaldamento all'avvio li compila prima che serva il duello.

export const COSMO_VS = 'attribute vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }';

export const COSMO_FS = `
precision highp float;
uniform float uScale; uniform float uVH; uniform float uPad;
uniform float uMode;            // 0 finestra cosmica ┬À 1 sigilli sul tabellone
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
// scorrono a velocit├á diverse (profondit├á) e stelle che vengono incontro
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
    // uEll.z = apertura 0ÔåÆ1: l'ellisse cresce dal centro all'inizio del round
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

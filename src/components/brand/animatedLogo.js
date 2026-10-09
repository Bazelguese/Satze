import {drawPortal,drawBlade} from './portal-fx.js';
// SATZE v4: fixed portal geometry, staged insertion, blade-local glint.
export const logoCSS=`
:host{display:block;width:100%;color:#f3e8d8}*{box-sizing:border-box}
.stage{position:relative;aspect-ratio:3/2;isolation:isolate;overflow:hidden}
.layer{position:absolute;inset:0;pointer-events:none}img,canvas{display:block;width:100%;height:100%;object-fit:contain}
img{user-select:none;-webkit-user-drag:none}.spiral canvas{display:none}
.atmosphere{inset:15% 12%;background:radial-gradient(ellipse,#7c13722b,transparent 67%);filter:blur(14px)}
.void{inset:25% 27%;background:radial-gradient(ellipse,#05020b 20%,#090212 53%,#40125780 80%,transparent 100%);border-radius:50%;opacity:0}
.letters img{transform:scale(.87)}.letters{filter:drop-shadow(0 4px 5px #000c)}
.sword{transform-origin:50% 34%;will-change:transform;opacity:0}.sword-art{position:absolute;inset:0;transform:scale(.78,.88);transform-origin:50% 48%}
.sword-art img,.blade-fx{position:absolute;inset:0}.sword-art img{filter:drop-shadow(0 2px 4px #0009)}
.hit{position:absolute;left:46%;top:11%;width:8%;height:79%;min-width:32px;padding:0;border:0;background:transparent;touch-action:manipulation;pointer-events:auto;color:inherit;cursor:pointer}
.fallback{display:none}
.hit:focus-visible{outline:1px solid #e2bfd6;outline-offset:4px;border-radius:40%}
:host([layer="spiral"]) .letters,:host([layer="spiral"]) .sword,:host([layer="spiral"]) .hit{visibility:hidden}
:host([layer="letters"]) .spiral,:host([layer="letters"]) .portal-fx,:host([layer="letters"]) .sword,:host([layer="letters"]) .atmosphere,:host([layer="letters"]) .void,:host([layer="letters"]) .hit{visibility:hidden}
:host([layer="sword"]) .spiral,:host([layer="sword"]) .portal-fx,:host([layer="sword"]) .letters,:host([layer="sword"]) .atmosphere,:host([layer="sword"]) .void{visibility:hidden}
`;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export class SatzeLogo extends HTMLElement{
 static get observedAttributes(){return ['paused','strength','speed','glow','formation','layer','reduced-motion'];}
 constructor(){super();this.attachShadow({mode:'open'});this.clock=0;this.last=0;this.raf=0;this.pulseAt=-1e8;this.visible=true;this.swordOverride=null;this.assetsReady=false;this.generation=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');}
 connectedCallback(){
  if(!this.shadowRoot.firstChild){
   const assets=this.assets||Object.fromEntries(['spiral','letters','sword'].map(n=>[n,this.getAttribute(n+'-src')]));
   this.shadowRoot.innerHTML=`<style>${logoCSS}</style><div class="stage" role="group" aria-label="Logo SATZE: portale e spada">
    <div class="layer atmosphere"></div><div class="layer void"></div>
    <div class="layer spiral"><img alt="" draggable="false"><canvas width="1152" height="768" aria-hidden="true"></canvas></div>
    <canvas class="layer portal-fx" width="1536" height="1024" aria-hidden="true"></canvas>
    <div class="layer letters"><img alt="" draggable="false"></div>
    <div class="layer sword"><div class="sword-art"><img alt="" draggable="false"><canvas class="blade-fx" width="1536" height="1024" aria-hidden="true"></canvas></div></div>
    <img class="layer fallback" alt="SATZE">
    <button class="hit" type="button" aria-label="Fai luccicare la lama"></button></div>`;
   for(const n of ['spiral','letters','sword'])this.shadowRoot.querySelector('.'+n+' img').src=assets[n];
   this.el=Object.fromEntries(['spiral','sword','letters','atmosphere','void','hit'].map(n=>[n,this.shadowRoot.querySelector('.'+n)]));
   this.portalCtx=this.shadowRoot.querySelector('.portal-fx').getContext('2d');this.bladeCtx=this.shadowRoot.querySelector('.blade-fx').getContext('2d');
   this.el.hit.addEventListener('click',()=>this.flash());
   this.el.hit.addEventListener('pointerenter',()=>{if(this.clock>=4500)this.flash(.55);});
  }
  const generation=++this.generation;
  this.assetsReady=false;
  this.initSpiral();
  const images=['spiral','letters','sword'].map(n=>this.shadowRoot.querySelector('.'+n+' img'));
  Promise.all(images.map(img=>img.decode())).then(()=>{
   if(!this.isConnected||generation!==this.generation)return;
   this.assetsReady=true;this.last=0;this.start();
  }).catch(()=>{
   if(!this.isConnected||generation!==this.generation)return;
   this.failed=true;this.disposeSpiral?.();
   for(const layer of this.shadowRoot.querySelectorAll('.layer'))layer.style.display='none';
   const fallback=this.shadowRoot.querySelector('.fallback');fallback.src=this.getAttribute('fallback-src')||'';fallback.style.display='block';this.el.hit.disabled=true;
  });
  this.onVisibility=()=>{this.last=0;if(!document.hidden)this.start();};document.addEventListener('visibilitychange',this.onVisibility);
  this.onReduced=()=>{this.last=0;this.start();};this.reduced.addEventListener('change',this.onReduced);
  this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.last=0;if(this.visible)this.start();});this.observer.observe(this);
  this.start();
 }
 disconnectedCallback(){this.generation++;this.assetsReady=false;this.last=0;cancelAnimationFrame(this.raf);this.raf=0;this.disposeSpiral?.();this.observer?.disconnect();document.removeEventListener('visibilitychange',this.onVisibility);this.reduced.removeEventListener('change',this.onReduced);}
 attributeChangedCallback(){if(this.isConnected){this.last=0;this.start();}}
 number(name,fallback,min,max){const v=this.getAttribute(name),n=v===null?fallback:Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
 replay(){this.clock=0;this.swordOverride=null;this.pulseAt=-1e8;this.last=0;this.removeAttribute('formation');this.removeAttribute('paused');this.start();}
 insert(){this.clock=6000;this.swordOverride=0;this.pulseAt=-1e8;this.last=0;this.removeAttribute('formation');this.removeAttribute('paused');this.start();}
 flash(strength=1){this.pulseAt=performance.now();this.flashStrength=strength;this.start();this.dispatchEvent(new CustomEvent('satze-flash',{bubbles:true,composed:true}));}
 start(){if(!this.raf&&this.isConnected)this.raf=requestAnimationFrame(t=>this.frame(t));}
 initSpiral(){
  const canvas=this.shadowRoot.querySelector('.spiral canvas'),img=this.el.spiral.querySelector('img');
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false});if(!gl){this.renderSpiral=p=>{img.style.opacity=smooth(p);};return;}
  const shader=(kind,source)=>{const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  try{
   const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}');
   const fs=shader(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 uv;uniform sampler2D picture;uniform float formed;
    void main(){
     // Fixed UVs: no rotation, twist, expansion, or central hole.
     vec4 c=texture2D(picture,uv);
     float fiber=max(c.r,max(c.g*.85,c.b*.82));
     float threshold=pow(1.-formed,1.65)*.91-.075;
     float growth=smoothstep(threshold-.035,threshold+.035,fiber);
     if(formed<.001)growth=0.;c.a*=growth;gl_FragColor=c;
    }`);
   const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
   const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const param of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,param,gl.CLAMP_TO_EDGE);for(const param of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,param,gl.LINEAR);
   gl.uniform1i(gl.getUniformLocation(program,'picture'),0);const formed=gl.getUniformLocation(program,'formed');
   const upload=()=>{if(!this.isConnected)return;gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);this.renderSpiral=p=>{gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(formed,p);gl.drawArrays(gl.TRIANGLES,0,6);};this.renderSpiral(0);img.style.display='none';canvas.style.display='block';this.start();};
   if(img.complete&&img.naturalWidth)upload();else img.addEventListener('load',upload,{once:true});
   const lost=e=>{e.preventDefault();canvas.style.display='none';img.style.display='block';this.renderSpiral=p=>{img.style.opacity=smooth(p);};};const restored=()=>{this.disposeSpiral?.();this.initSpiral();};canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
   this.disposeSpiral=()=>{this.renderSpiral=null;img.removeEventListener('load',upload);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);};
  }catch(e){canvas.style.display='none';img.style.display='block';this.renderSpiral=p=>{img.style.opacity=smooth(p);};}
 }
 frame(now){
  this.raf=0;if(!this.visible||document.hidden||!this.assetsReady||this.failed)return;
  const reduced=this.reduced.matches||this.hasAttribute('reduced-motion'),manual=this.hasAttribute('formation'),paused=this.hasAttribute('paused'),speed=this.number('speed',1,.2,3),glow=this.number('glow',1,0,2);
  const delta=this.last?Math.min(100,now-this.last):0;this.last=now;
  if(!paused&&!manual&&!reduced){this.clock=Math.min(6000,this.clock+delta*speed);if(this.swordOverride!==null)this.swordOverride=Math.min(3000,this.swordOverride+delta*speed);}
  let time=reduced?6:manual?this.number('formation',1,0,1)*6:this.clock/1000;
  const material=smooth((time-1.3)/1.75);
  this.renderSpiral?.(material);this.el.void.style.opacity=smooth((time-1.15)/.85)*.7;this.el.atmosphere.style.opacity=.2+material*.8;
  let st=this.swordOverride!==null?this.swordOverride/1000+.15:time-2.35;if(reduced)st=4;
  let y=-270,tilt=-4,visible=smooth(st/.3);
  if(st<.5){y=-270-8*Math.sin(clamp(st/.5)*Math.PI);}
  else if(st<1.10){const p=clamp((st-.5)/.6);y=-270+280*p*p*p;tilt=-4*(1-p);}
  else if(st<1.36){const p=(st-1.10)/.26;y=10*(1-smooth(p));tilt=0;}
  else{y=0;tilt=0;}
  this.el.sword.style.opacity=visible;this.el.sword.style.transform=`translateY(${y/10.24}%) rotate(${tilt}deg)`;
  this.el.letters.style.opacity=smooth((time-3.55)/.65);this.el.hit.disabled=paused||visible<.95||st<1.36;
  const impactAge=st-1.1;
  drawPortal(this.portalCtx,time,this.number('strength',1,0,2),reduced,impactAge);
  const manualAge=(now-this.pulseAt)/1000;
  let age=manualAge>=0&&manualAge<1.6?manualAge:impactAge;
  let intensity=manualAge>=0&&manualAge<1.6?(this.flashStrength||1):1;
  drawBlade(this.bladeCtx,reduced&&age>=0&&age<1.6?.24:age,glow*intensity);
  this.state={time,material,swordProgress:st,swordY:y,glintAge:age};
  const running=!paused&&!manual&&!reduced&&(this.clock<6000||(this.swordOverride!==null&&this.swordOverride<3000));
  if(running||(manualAge>=0&&manualAge<1.6))this.start();
 }
}
if(!customElements.get('satze-logo'))customElements.define('satze-logo',SatzeLogo);

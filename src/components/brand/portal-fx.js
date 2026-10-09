// Game effects drawn in source-image coordinates, 1536 × 1024.
export function drawPortal(ctx,t,intensity=1,reduced=false,impactAge=t-3.45){
  const W=1536,H=1024;ctx.clearRect(0,0,W,H);if(reduced)return;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const progress=clamp((t-.25)/1.85),built=clamp((t-1.9)/1.1);
  if(progress<=0)return;
  const cx=768,cy=490,rx=358,ry=239;
  const alpha=(1-built*.88)*intensity;
  const ringPoint=(a,k=0)=>({x:cx+Math.cos(a)*(rx+k),y:cy+Math.sin(a)*(ry+k*.7)});
  ctx.save();ctx.globalCompositeOperation='lighter';
  // Two fronts grow from the top and meet below. Their geometry never rotates.
  for(const direction of [-1,1]){
    for(let strand=0;strand<7;strand++){
      const local=clamp(progress-strand*.017),end=-Math.PI/2+direction*Math.PI*local;
      if(local<=0)continue;
      const points=[];
      for(let i=0;i<=110;i++){
        const a=-Math.PI/2+(end+Math.PI/2)*i/110;
        const offset=(strand-3)*3.2+Math.sin(a*17+strand*3.4)*2.2+Math.sin(a*39+strand)*1.1;
        points.push(ringPoint(a,offset));
      }
      for(const [width,color,opacity] of [[12,'#790fff',.10],[4,'#ce2cff',.34],[1.25,strand%2?'#ffa1d6':'#f5d8ff',.9]]){
        ctx.globalAlpha=alpha*opacity;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
      }
    }
    if(progress<1){
      const a=-Math.PI/2+direction*Math.PI*progress,p=ringPoint(a);
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,33);g.addColorStop(0,'#fff1ed');g.addColorStop(.08,'#ffc3fb');g.addColorStop(.22,'#b23eff');g.addColorStop(1,'#ae22ff00');ctx.globalAlpha=.95*intensity;ctx.fillStyle=g;ctx.fillRect(p.x-34,p.y-34,68,68);
      // Sparks leave the two growing tips, along deterministic curved trajectories.
      for(let i=0;i<20;i++){
        const age=((t*1.9+i*.137)%1),backA=a-direction*age*.32,q=ringPoint(backA,age*(12+(i%4)*8));
        ctx.globalAlpha=(1-age)*.85*intensity;ctx.strokeStyle=i%3?'#d85eff':'#ffe5f6';ctx.lineWidth=i%4===0?2:1;
        ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x+Math.cos(backA)*age*11,q.y+Math.sin(backA)*age*11);ctx.stroke();
      }
    }
  }
  // Short impact ripples stay where the descending blade crosses the portal.
  const impact=impactAge;
  if(impact>=0&&impact<.65){const p=impact/.65;ctx.globalAlpha=(1-p)*.6*intensity;ctx.strokeStyle='#f9a5df';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(768,618,24+p*122,6+p*23,0,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}

export function drawBlade(ctx,age,intensity=1){
  ctx.clearRect(0,0,1536,1024);if(age<0||age>1.6||intensity<=0)return;
  const clamp=x=>Math.max(0,Math.min(1,x)),p=clamp(age/1.35),life=Math.pow(Math.sin(Math.PI*p),.7);
  ctx.save();ctx.globalCompositeOperation='lighter';
  // This conservative polygon lies INSIDE the red blade, below the crossguard.
  ctx.save();ctx.beginPath();ctx.moveTo(757,403);ctx.lineTo(780,403);ctx.lineTo(787,565);ctx.lineTo(779,650);ctx.lineTo(768,970);ctx.lineTo(755,650);ctx.lineTo(748,565);ctx.closePath();ctx.clip();
  const y=395+p*552;ctx.translate(768,y);ctx.rotate(-.32);
  const strip=ctx.createLinearGradient(0,-27,0,27);strip.addColorStop(0,'#fff9eb00');strip.addColorStop(.40,'#ffdae74a');strip.addColorStop(.48,'#fff9ef');strip.addColorStop(.52,'#ffffff');strip.addColorStop(.60,'#ffc3e24a');strip.addColorStop(1,'#fff9eb00');
  ctx.globalAlpha=Math.min(1,life*intensity);ctx.fillStyle=strip;ctx.fillRect(-90,-28,180,56);ctx.restore();
  // A fine, four-point glint rides the blade's edge instead of washing the emblem.
  const edge=14*(1-clamp((y-570)/400))+3,x=768+edge;
  const star=(sx,sy,long,short,a)=>{ctx.save();ctx.translate(sx,sy);ctx.globalAlpha=Math.min(1,a*intensity);ctx.fillStyle='#fff7ed';ctx.shadowColor='#ffb4d9';ctx.shadowBlur=5;ctx.beginPath();ctx.moveTo(0,-long);ctx.lineTo(short*.34,-short*.34);ctx.lineTo(long*.6,0);ctx.lineTo(short*.34,short*.34);ctx.lineTo(0,long);ctx.lineTo(-short*.34,short*.34);ctx.lineTo(-long*.6,0);ctx.lineTo(-short*.34,-short*.34);ctx.closePath();ctx.fill();ctx.restore();};
  star(x,y,17+life*9,5,life*.95);
  // The gem flashes first, then gives way to the travelling reflection.
  const gem=Math.max(0,1-age/.48);if(gem>0){
    const g=ctx.createRadialGradient(768,320,0,768,320,22);g.addColorStop(0,'#fff6e6');g.addColorStop(.12,'#ffd9f6');g.addColorStop(.35,'#fb569ab0');g.addColorStop(1,'#fb569a00');ctx.globalAlpha=gem*.9*intensity;ctx.fillStyle=g;ctx.fillRect(746,298,44,44);star(768,320,20,6,gem);
  }
  ctx.restore();
}

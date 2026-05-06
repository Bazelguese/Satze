// CosmicBackground.jsx — starfield + vignette + animated particle layer
function CosmicBackground({ children }) {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const particles = Array.from({length: 60}, () => ({
      x: Math.random()*canvas.width,
      y: canvas.height + Math.random()*40,
      size: Math.random()*2.5 + 0.5,
      vy: -(Math.random()*0.7 + 0.2),
      vx: (Math.random()-0.5)*0.25,
      life: Math.random()*400,
      max: Math.random()*300 + 200,
      color: Math.random() > 0.6 ? '#fbbf24' : Math.random() > 0.3 ? '#38bdf8' : '#fff',
    }));
    const stars = Array.from({length: 120}, () => ({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height*0.7,
      r: Math.random()*1.2 + 0.2,
      tw: Math.random()*Math.PI*2,
    }));
    let raf;
    const tick = (t) => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // stars
      stars.forEach(s => {
        const a = 0.4 + 0.5*Math.sin(t*0.0015 + s.tw);
        ctx.globalAlpha = a; ctx.fillStyle = '#cfe8ff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
      });
      // embers
      particles.forEach(p => {
        p.life++;
        if (p.life > p.max || p.y < -20) { p.y = canvas.height+20; p.x = Math.random()*canvas.width; p.life = 0; }
        p.y += p.vy; p.x += p.vx;
        const r = p.life/p.max;
        const o = r<0.15 ? r/0.15 : r>0.8 ? (1-r)/0.2 : 1;
        ctx.globalAlpha = o*0.9; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{position:'relative', width:'100%', height:'100%', overflow:'hidden',
      background:'radial-gradient(ellipse at 50% 40%, #0a1628 0%, #050608 55%, #000 100%)'}}>
      {/* distant battle silhouette */}
      <div style={{position:'absolute', left:0, right:0, bottom:0, height:'36%',
        background:'linear-gradient(to top, #1a0e08 0%, #1a1410 30%, transparent 100%)'}} />
      <div style={{position:'absolute', left:0, right:0, bottom:0, height:'28%',
        background:'radial-gradient(ellipse at 50% 100%, #c2410c33 0%, transparent 60%)'}} />
      <canvas ref={canvasRef} style={{position:'absolute', inset:0, width:'100%', height:'100%'}} />
      {/* vignette */}
      <div style={{position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
        animation:'vignettePulse 8s ease-in-out infinite'}} />
      <style>{`@keyframes vignettePulse { 0%,100%{opacity:.85} 50%{opacity:1} }`}</style>
      <div style={{position:'relative', zIndex:2, width:'100%', height:'100%'}}>{children}</div>
    </div>
  );
}

window.CosmicBackground = CosmicBackground;

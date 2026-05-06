// LoadingScreen.jsx — tactical HUD splash with faux-terminal lines
function LoadingScreen({ progress = 72 }) {
  const lines = [
    '> SAT.EXE  /v0.1-alpha — boot',
    '> load: /sys/armate ................ [OK]',
    '> load: /sys/tabellone ............. [OK]',
    '> load: /sys/glossario ............. [OK]',
    '> sync: /nebula.core .............. [....]',
  ];
  return (
    <div style={{position:'relative', width:'100%', height:'100%',
      background:'radial-gradient(ellipse at 50% 40%, #0a1628 0%, #050608 70%, #000 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:40,
      color:'#e8eaed', overflow:'hidden'}}>
      {/* scanline */}
      <div style={{position:'absolute', inset:0, background:'repeating-linear-gradient(to bottom, transparent 0, transparent 3px, rgba(56,189,248,0.02) 3px, rgba(56,189,248,0.02) 4px)', pointerEvents:'none'}}/>
      <SatzeWordmark size={72}/>
      <div style={{width:'min(560px, 80%)', padding:'18px 22px',
        background:'rgba(5,6,8,0.8)', border:'1.5px solid #334155',
        boxShadow:'inset 0 0 40px rgba(0,0,0,0.6)'}}>
        {lines.map((l,i) => (
          <div key={i} style={{fontFamily:'Share Tech Mono', fontSize:12,
            color: i < lines.length-1 ? '#38bdf8' : '#fbbf24', letterSpacing:'0.05em',
            marginBottom:4, opacity: 0.55 + i*0.11}}>{l}</div>
        ))}
        <div style={{marginTop:12, height:6, background:'rgba(56,189,248,0.1)', border:'1px solid #334155'}}>
          <div style={{width:`${progress}%`, height:'100%',
            background:'linear-gradient(90deg, #38bdf8, #0891b2)',
            boxShadow:'0 0 10px #38bdf8',
            transition:'width 0.4s linear'}}/>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:8,
          fontFamily:'Share Tech Mono', fontSize:10, color:'#94a3b8', letterSpacing:'0.15em'}}>
          <span>CARICAMENTO</span><span>{progress.toFixed(0)}%</span>
        </div>
      </div>
      <div style={{position:'absolute', bottom:18, fontFamily:'Share Tech Mono', fontSize:10,
        color:'#475569', letterSpacing:'0.25em'}}>[ v0.1 ALPHA · NON DISTRIBUIRE ]</div>
    </div>
  );
}

window.LoadingScreen = LoadingScreen;

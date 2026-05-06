// StatOrb.jsx — circular stat pod used on card corners and HUD chrome
function StatOrb({ value, label, tone = 'gold', size = 44 }) {
  const tones = {
    gold:  { c:'#fbbf24' },
    blood: { c:'#dc2626' },
    cyan:  { c:'#38bdf8' },
    fire:  { c:'#f97316' },
    purple:{ c:'#a78bfa' },
  };
  const t = tones[tone] || tones.gold;
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:'rgba(0,0,0,0.78)',
      border:`1.5px solid ${t.c}`,
      boxShadow:`0 0 10px ${t.c}88, inset 0 0 10px rgba(0,0,0,0.8)`,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      color:'#fff',
    }}>
      <div style={{fontFamily:'Share Tech Mono', fontSize: Math.round(size*0.4), lineHeight:1, color:t.c}}>{value}</div>
      <div style={{fontFamily:'Chakra Petch', fontSize: Math.round(size*0.18),
        color:'#94a3b8', letterSpacing:'0.12em', textTransform:'uppercase', marginTop:2}}>{label}</div>
    </div>
  );
}

window.StatOrb = StatOrb;

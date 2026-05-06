// SatzeWordmark.jsx — the logo treatment
function SatzeWordmark({ size = 96 }) {
  return (
    <div style={{textAlign:'center', userSelect:'none'}}>
      <div style={{
        fontFamily:'Cinzel, serif', fontWeight:900, fontSize:size,
        letterSpacing:'0.35em', textTransform:'uppercase',
        color:'#e8eaed', lineHeight:1, marginLeft:'0.35em',
        textShadow:'0 0 30px rgba(56,189,248,0.35), 0 4px 12px rgba(0,0,0,0.9)',
        animation:'titleEnter 1.2s ease-out',
      }}>Satze</div>
      <div style={{
        width: size*1.6, height:1, margin:'10px auto',
        background:'linear-gradient(90deg, transparent, #38bdf8, transparent)',
      }}/>
      <div style={{
        fontFamily:'Cinzel, serif', fontStyle:'italic',
        fontSize: Math.round(size*0.16), letterSpacing:'0.3em',
        textTransform:'uppercase', color:'#94a3b8',
      }}>La Grande Guerra</div>
      <style>{`@keyframes titleEnter { from{opacity:0; transform:translateY(-16px)} to{opacity:1;transform:none} }`}</style>
    </div>
  );
}

window.SatzeWordmark = SatzeWordmark;

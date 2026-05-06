// HudPanel.jsx — clipped-corner tactical panel
function HudPanel({ title, tag, tone='cyan', children, style = {} }) {
  const tones = { cyan:'#38bdf8', gold:'#d4af37', fire:'#f97316', blood:'#dc2626' };
  const c = tones[tone] || tones.cyan;
  return (
    <div style={{
      position:'relative',
      background:'linear-gradient(135deg, rgba(10,22,40,0.92), rgba(5,6,8,0.95))',
      border:`1.5px solid ${c}`,
      boxShadow:`0 0 18px ${c}33, inset 0 0 40px rgba(0,0,0,0.55)`,
      clipPath:'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
      padding:'14px 18px',
      ...style,
    }}>
      {(title || tag) && (
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
          <div style={{fontFamily:'Chakra Petch', fontWeight:600, fontSize:12,
            letterSpacing:'0.2em', textTransform:'uppercase', color:c}}>{title}</div>
          {tag && <div style={{fontFamily:'Share Tech Mono', fontSize:10,
            color:'#94a3b8', letterSpacing:'0.1em'}}>{tag}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

window.HudPanel = HudPanel;

// MissionCard.jsx — campaign mission card with mission type tag
const MISSION_TAGS = {
  ASS: {label:'ASS', full:'Assalto',     color:'#f97316'},
  DIF: {label:'DIF', full:'Difesa',      color:'#38bdf8'},
  DOM: {label:'DOM', full:'Dominio',     color:'#d4af37'},
  ANN: {label:'ANN', full:'Annichilimento', color:'#dc2626'},
  SPC: {label:'SPC', full:'Speciale',    color:'#a78bfa'},
};

function MissionCard({ mission, onClick }) {
  const [hover, setHover] = React.useState(false);
  const tag = MISSION_TAGS[mission.tag];
  const completed = mission.status === 'completed';
  const locked = mission.status === 'locked';
  return (
    <button onClick={locked ? undefined : onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      disabled={locked}
      style={{
        position:'relative', width:300, padding:'16px 18px 18px',
        background:'linear-gradient(135deg, rgba(10,22,40,0.9), rgba(5,6,8,0.95))',
        border: `1.5px solid ${hover && !locked ? tag.color : '#334155'}`,
        cursor: locked ? 'not-allowed' : 'pointer',
        textAlign:'left', color:'#e8eaed',
        opacity: locked ? 0.45 : 1,
        boxShadow: hover && !locked ? `0 0 16px ${tag.color}55, inset 0 0 40px rgba(0,0,0,0.5)` : 'inset 0 0 40px rgba(0,0,0,0.45)',
        transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10}}>
        <div style={{fontFamily:'Share Tech Mono', fontSize:10, letterSpacing:'0.2em', color:'#64748b'}}>
          MIS {String(mission.id).padStart(3,'0')}
        </div>
        <div style={{padding:'3px 10px', border:`1px solid ${tag.color}`, color:tag.color,
          background:`${tag.color}22`, fontFamily:'Chakra Petch', fontSize:10,
          fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase'}}>{tag.label}</div>
      </div>
      <div style={{fontFamily:'Cinzel, serif', fontWeight:700, fontSize:17,
        letterSpacing:'0.14em', textTransform:'uppercase', color:'#e8eaed', marginBottom:6,
        textShadow:'0 2px 4px #000'}}>{mission.name}</div>
      <div style={{fontFamily:'Cinzel, serif', fontStyle:'italic', fontSize:12, color:'#94a3b8', lineHeight:1.4, marginBottom:12}}>
        "{mission.flavor}"
      </div>
      <div style={{display:'flex', gap:10, alignItems:'center', borderTop:'1px solid rgba(56,189,248,0.15)', paddingTop:10}}>
        <div style={{fontFamily:'Chakra Petch', fontSize:10, color:'#94a3b8', letterSpacing:'0.15em', textTransform:'uppercase'}}>
          vs <span style={{color: mission.enemyColor, fontWeight:600}}>{mission.enemy}</span>
        </div>
        <div style={{flex:1}}/>
        {completed && <div style={{fontFamily:'Chakra Petch', fontSize:10, color:'#10b981', letterSpacing:'0.2em', textTransform:'uppercase'}}>✓ Completato</div>}
        {locked && <div style={{fontFamily:'Chakra Petch', fontSize:10, color:'#64748b', letterSpacing:'0.2em', textTransform:'uppercase'}}>⟐ Bloccato</div>}
        {!locked && !completed && <div style={{fontFamily:'Chakra Petch', fontSize:10, color:tag.color, letterSpacing:'0.2em', textTransform:'uppercase'}}>▸ Avvia</div>}
      </div>
    </button>
  );
}

window.MissionCard = MissionCard;
window.MISSION_TAGS = MISSION_TAGS;

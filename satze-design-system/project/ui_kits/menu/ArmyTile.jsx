// ArmyTile.jsx — faction picker tile with mood background + glyph
const ARMIES = [
  {id:'orizzonte',      name:'Orizzonte',       color:'#a78bfa', motto:'La Cometa disse: "Presto."'},
  {id:'kethran',        name:'Kethran',         color:'#fbbf24', motto:'I templi cantano, la pietra ascolta.'},
  {id:'corte-rossa',    name:'Corte Rossa',     color:'#dc2626', motto:'Il sangue è un contratto.'},
  {id:'calibri-pesanti',name:'Calibri Pesanti', color:'#94a3b8', motto:'Il ferro non dimentica.'},
  {id:'orathai',        name:'Orathai',         color:'#14b8a6', motto:'La marea torna sempre.'},
  {id:'mounthborn',     name:'Mounthborn',      color:'#84cc16', motto:'La spora sogna al buio.'},
  {id:'enclave',        name:'Enclave',         color:'#ea580c', motto:'Il vulcano è paziente.'},
  {id:'ratti',          name:'Ratti',           color:'#10b981', motto:'La peste ha molti nomi.'},
];

function ArmyTile({ army, selected, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        position:'relative', width:220, height:300, padding:0,
        border: `1.5px solid ${selected ? army.color : hover ? army.color : '#334155'}`,
        background:'transparent', cursor:'pointer', overflow:'hidden',
        boxShadow: (selected||hover) ? `0 0 20px ${army.color}88, inset 0 0 40px rgba(0,0,0,0.6)` : 'inset 0 0 40px rgba(0,0,0,0.45)',
        transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        textAlign:'left',
      }}>
      <div style={{position:'absolute', inset:0,
        background:`url('../../assets/army-bg/${army.id}.png') center/cover`,
        filter: hover ? 'brightness(0.9)' : 'brightness(0.65)', transition:'filter 0.25s'}}/>
      <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)'}}/>
      <img src={`../../assets/armies/${army.id}.png`}
        style={{position:'absolute', top:20, left:'50%', transform:'translateX(-50%)',
          width:72, height:72, objectFit:'contain',
          filter:`drop-shadow(0 0 12px ${army.color})`,
          opacity: hover ? 1 : 0.85}}/>
      <div style={{position:'absolute', left:12, right:12, bottom:12, color:'#e8eaed'}}>
        <div style={{fontFamily:'Cinzel, serif', fontWeight:700, fontSize:15, letterSpacing:'0.18em', textTransform:'uppercase', color:army.color}}>
          {army.name}
        </div>
        <div style={{fontFamily:'Cinzel, serif', fontStyle:'italic', fontSize:11, color:'#cbd5e1', marginTop:4, lineHeight:1.35}}>
          {army.motto}
        </div>
      </div>
    </button>
  );
}

window.ArmyTile = ArmyTile;
window.ARMIES = ARMIES;

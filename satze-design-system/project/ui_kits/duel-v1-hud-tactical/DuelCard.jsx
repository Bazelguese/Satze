// DuelCard.jsx — V2: accurate recreation based on actual Satze card layout
// Reference: "L'Eco del Primo Sole" card screenshot
// Structure (top to bottom):
//   [ Name (L) | Level pill (R) ] — on black bar
//   [ Portrait in inner rectangle — faction-colored artwork inside ]
//   [ Big POT (L) ······· Big DAN (R) ] — yellow, centered-ish below image
//   [ ⚡ POTERE — yellow icon ]
//   [ Turbo: +8 VA — body text ]
//   [ ▢ BONUS — green icon ]
//   [ -5 VA nem. (min 6) ]
//   [ Solid colored footer pill — "FIGLI DELL'ORIZZONTE" in UPPERCASE ]
//
// Card itself: black bg, thin cyan border + subtle cyan glow, NO rounded full-art.

const ARMY_DATA = {
  'orizzonte':       {c:'#a78bfa', name:'FIGLI DELL\u2019ORIZZONTE'},
  'kethran':         {c:'#fbbf24', name:'KETHRAN'},
  'corte-rossa':     {c:'#dc2626', name:'CORTE ROSSA'},
  'calibri-pesanti': {c:'#94a3b8', name:'CALIBRI PESANTI'},
  'orathai':         {c:'#14b8a6', name:'ORATHAI'},
  'mounthborn':      {c:'#84cc16', name:'MOUNTHBORN'},
  'enclave':         {c:'#ea580c', name:'ENCLAVE'},
  'ratti':           {c:'#10b981', name:'FIGLI DEI RATTI'},
};

function DuelCard({ agent, selected, used, onClick, small }) {
  const [hover, setHover] = React.useState(false);
  const army = ARMY_DATA[agent.army] || ARMY_DATA['orizzonte'];
  const W = small ? 150 : 230;
  const H = small ? 210 : 320;
  const disabled = !!used;
  const scale = selected ? 1.04 : hover && !disabled ? 1.03 : 1;

  // highlight color when selected/hovered: use subtle yellow for selected, cyan otherwise
  const borderC = selected ? '#fbbf24' : (hover && !disabled ? '#38bdf8' : '#38bdf8aa');
  const glow = selected
    ? `0 0 16px #fbbf2488, 0 0 32px #fbbf2444`
    : hover && !disabled
      ? `0 0 14px #38bdf866, 0 0 28px #38bdf833`
      : `0 0 8px #38bdf833`;

  // sizes
  const namePad = small ? 6 : 10;
  const imgH   = small ? 96 : 140;
  const statSz = small ? 22 : 34;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        position:'relative', width:W, height:H,
        background:'#0a0a0d',
        border:`1.5px solid ${borderC}`,
        boxShadow: `${glow}, 0 4px 16px rgba(0,0,0,0.9)`,
        transform: `scale(${scale})`,
        transition:'transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s, border-color 0.2s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display:'flex', flexDirection:'column', overflow:'hidden',
        fontFamily:'Chakra Petch, sans-serif',
      }}>

      {/* NAME ROW */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:`${namePad}px ${namePad+2}px`, flexShrink:0}}>
        <div style={{fontFamily:'Chakra Petch', fontWeight:700,
          fontSize: small?11:13, color:'#fff', letterSpacing:'0.02em',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          textShadow:'0 1px 2px #000'}}>
          {agent.name}
        </div>
        <div style={{fontFamily:'Chakra Petch', fontWeight:700,
          fontSize: small?9:11, color:'#cbd5e1', letterSpacing:'0.1em',
          padding: small?'2px 6px':'3px 10px',
          background:'#1a1a22', border:'1px solid #2a2a33',
          marginLeft:6}}>
          L{agent.league}
        </div>
      </div>

      {/* IMAGE */}
      <div style={{
        position:'relative',
        height: imgH, marginLeft: namePad+2, marginRight: namePad+2,
        background:`url('../../assets/cards/${agent.portrait}.png') center/cover`,
        flexShrink:0,
      }}/>

      {/* STATS row */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end',
        padding: small? '6px 14px 2px' : '10px 22px 4px', flexShrink:0}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'Chakra Petch', fontWeight:700, fontSize:statSz,
            color:'#fbbf24', lineHeight:1}}>{agent.pot_val ?? agent.va}</div>
          <div style={{fontFamily:'Chakra Petch', fontSize: small?8:9, letterSpacing:'0.12em',
            color:'#94a3b8', marginTop:1}}>↑ POT</div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'Chakra Petch', fontWeight:700, fontSize:statSz,
            color:'#fbbf24', lineHeight:1}}>{agent.dan_val ?? agent.dan}</div>
          <div style={{fontFamily:'Chakra Petch', fontSize: small?8:9, letterSpacing:'0.12em',
            color:'#94a3b8', marginTop:1}}>⇅ DAN</div>
        </div>
      </div>

      {/* ABILITIES (hidden on small hand cards) */}
      {!small && (
        <div style={{padding:'8px 12px 4px', flex:1, overflow:'hidden'}}>
          <div style={{display:'flex', alignItems:'center', gap:4, marginTop:2}}>
            <span style={{color:'#fbbf24', fontSize:11}}>⚡</span>
            <span style={{fontFamily:'Chakra Petch', fontWeight:700, fontSize:10,
              color:'#fbbf24', letterSpacing:'0.15em'}}>POTERE</span>
          </div>
          <div style={{fontFamily:'Chakra Petch', fontSize:11, color:'#e8eaed',
            marginTop:1, lineHeight:1.25}}>{agent.pot}</div>

          <div style={{display:'flex', alignItems:'center', gap:4, marginTop:6}}>
            <span style={{color:'#10b981', fontSize:11}}>▢</span>
            <span style={{fontFamily:'Chakra Petch', fontWeight:700, fontSize:10,
              color:'#10b981', letterSpacing:'0.15em'}}>BONUS</span>
          </div>
          <div style={{fontFamily:'Chakra Petch', fontSize:11, color:'#e8eaed',
            marginTop:1, lineHeight:1.25}}>{agent.bon}</div>
        </div>
      )}
      {small && <div style={{flex:1}}/>}

      {/* ARMY FOOTER PILL — solid colored */}
      <div style={{
        background: army.c, color:'#0a0a0d',
        padding: small?'4px 6px':'6px 8px',
        textAlign:'center', flexShrink:0,
        fontFamily:'Chakra Petch', fontWeight:800,
        fontSize: small?8:10, letterSpacing:'0.12em',
        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
      }}>
        {army.name}
      </div>

      {used && (
        <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.65)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'Chakra Petch', fontSize:13, letterSpacing:'0.25em',
          color:'#dc2626', textTransform:'uppercase', fontWeight:700}}>Usata</div>
      )}
    </div>
  );
}

window.DuelCard = DuelCard;
window.ARMY_DATA = ARMY_DATA;

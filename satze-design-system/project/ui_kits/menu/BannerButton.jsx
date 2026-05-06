// BannerButton.jsx — the trapezoid/banner-shaped menu button
// shape: rectangle with clipped bottom corners, thin inner frame, glow on hover
function BannerButton({ label, tag, tone = 'cyan', disabled, onClick }) {
  const tones = {
    cyan:   { c:'#38bdf8', bg:'rgba(56,189,248,0.08)'},
    gold:   { c:'#d4af37', bg:'rgba(212,175,55,0.10)'},
    fire:   { c:'#f97316', bg:'rgba(249,115,22,0.10)'},
    blood:  { c:'#dc2626', bg:'rgba(220,38,38,0.10)'},
  };
  const t = tones[tone] || tones.cyan;
  const [hover, setHover] = React.useState(false);
  const clip = 'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px))';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      disabled={disabled}
      style={{
        position:'relative', minWidth:280, padding:'18px 36px 22px',
        background: hover ? `linear-gradient(180deg, ${t.bg} 0%, rgba(0,0,0,0.4) 100%)` : 'linear-gradient(180deg, rgba(5,6,8,0.7) 0%, rgba(0,0,0,0.6) 100%)',
        border:'none', color:'#e8eaed', cursor: disabled?'not-allowed':'pointer',
        fontFamily:'Cinzel, serif', fontWeight:700, fontSize:18,
        letterSpacing:'0.25em', textTransform:'uppercase',
        clipPath: clip,
        outline: hover ? `1.5px solid ${t.c}` : '1.5px solid #334155',
        outlineOffset:-1.5,
        boxShadow: hover ? `0 0 24px ${t.c}66, 0 0 48px ${t.c}33` : 'none',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* dashed inner frame */}
      <div style={{position:'absolute', inset:8, border:`1px dashed ${hover? t.c : '#475569'}`,
        clipPath: clip, pointerEvents:'none', opacity:0.7}}/>
      {tag && <div style={{fontFamily:'Share Tech Mono', fontSize:10, letterSpacing:'0.25em',
        color: hover ? t.c : '#64748b', marginBottom:4}}>{tag}</div>}
      <div style={{position:'relative', zIndex:1, textShadow: hover ? `0 0 10px ${t.c}` : '0 2px 4px #000'}}>{label}</div>
    </button>
  );
}

window.BannerButton = BannerButton;

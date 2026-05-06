// TurnLog.jsx — scrolling combat log, monospace tactical feed
function TurnLog({ lines }) {
  const scrollRef = React.useRef(null);
  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [lines]);
  return (
    <div ref={scrollRef} style={{
      height: 170, overflow:'auto',
      fontFamily:'Share Tech Mono', fontSize:11, letterSpacing:'0.03em',
      lineHeight:1.65, color:'#94a3b8',
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{color: l.tone === 'pos' ? '#10b981' : l.tone === 'neg' ? '#dc2626' : l.tone==='act' ? '#38bdf8' : '#94a3b8'}}>
          <span style={{color:'#475569'}}>[T{String(l.turn).padStart(2,'0')}]</span> {l.text}
        </div>
      ))}
    </div>
  );
}

window.TurnLog = TurnLog;

import React, { useState, useEffect, useRef } from 'react';
import MenuV5PersonaCosmic from './MenuV5PersonaCosmic.jsx';
import DeckBuilderCosmic from './DeckBuilderCosmic.jsx';
import DeckSelectCosmic from './DeckSelectCosmic.jsx';
import './cosmic-transitions.css';

/**
 * CosmicFlow
 * Top-level scene orchestrator with the magenta sweep transition.
 * Drop into any route or app shell as <CosmicFlow/>.
 *
 * Scenes: 'menu' | 'builder' | 'select'
 * The MenuShell intercepts clicks on the V5 menu and routes them:
 *   PARTITA / CAMPAGNA / MULTIPLAYER  → 'select'
 *   GESTIONE MAZZI / GALLERIA         → 'builder'
 */

function MenuShell({ onPick }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    function handler(e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      const labelEl = btn.querySelector('div[style*="Cinzel"]');
      if (!labelEl) return;
      const label = (labelEl.textContent || '').trim().toUpperCase();
      btn.classList.add('pressing');
      setTimeout(() => btn.classList.remove('pressing'), 320);
      if (label.startsWith('PARTITA') || label.startsWith('CAMPAGNA') || label.startsWith('MULTIPLAYER')) {
        e.preventDefault();
        onPick({ to: 'select', from: 'menu', label });
      } else if (label.startsWith('GESTIONE') || label.startsWith('GALLERIA')) {
        e.preventDefault();
        onPick({ to: 'builder', from: 'menu', label });
      } else if (label.startsWith('TUTORIAL') || label.startsWith('STRUMENTI')) {
        e.preventDefault();
      }
    }
    root.addEventListener('click', handler, true);
    return () => root.removeEventListener('click', handler, true);
  }, [onPick]);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
      <MenuV5PersonaCosmic/>
    </div>
  );
}

function SideMenuItem({ item, index, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={(e) => {
        e.currentTarget.classList.add('pressing');
        setTimeout(() => e.currentTarget.classList.remove('pressing'), 320);
        onClick();
      }}
      style={{
        position: 'relative',
        marginLeft: hover ? 14 : 0,
        padding: 0,
        background: 'transparent', border: 'none',
        cursor: 'pointer',
        transition: 'margin-left 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
        animation: `p5-slide-in 0.45s ${index * 0.07}s backwards ease-out`,
      }}>
      <div style={{
        position: 'relative', height: 64,
        background: hover
          ? `linear-gradient(90deg, ${item.accent} 0%, ${item.accent}dd 60%, ${item.accent}88 100%)`
          : 'linear-gradient(90deg, #1a0d24 0%, #0a0510 100%)',
        clipPath: 'polygon(0 0, 100% 0, calc(100% - 30px) 100%, 0 100%)',
        transform: 'skewX(-12deg)',
        boxShadow: hover ? `6px 6px 0 ${item.accent}, 0 0 28px ${item.accent}66` : '4px 4px 0 rgba(0,0,0,0.6)',
        transition: 'background 0.18s',
      }}>
        <div style={{ position:'absolute', top:5, bottom:5, left:6, right:50,
          border: `1.5px solid ${hover ? '#06030a' : '#3a2a44'}`, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:0, bottom:0, right:0, width:12,
          background: item.accent, boxShadow: 'inset 2px 0 0 #06030a' }}/>
      </div>
      <div style={{
        position:'absolute', top:0, bottom:0, left:24, right:64,
        display:'flex', alignItems:'center',
        color: hover ? '#06030a' : '#f5f3eb', pointerEvents:'none', textAlign:'left',
      }}>
        <div>
          <div style={{ fontFamily:'Cinzel, serif', fontWeight:900, fontSize:18,
            letterSpacing:'0.18em', lineHeight:1,
            textShadow: hover ? '2px 2px 0 #f5f3eb' : `2px 2px 0 ${item.accent}` }}>{item.label}</div>
          <div style={{ fontFamily:'Share Tech Mono, monospace', fontSize:8,
            letterSpacing:'0.35em', marginTop:4,
            color: hover ? '#06030a' : '#94a3b8' }}>{item.sub} · {item.meta}</div>
        </div>
      </div>
      <div style={{
        position:'absolute', top:'50%', right:12, transform:'translateY(-50%)',
        fontFamily:'Cinzel, serif', fontWeight:900, fontSize:22,
        color: hover ? '#06030a' : item.accent, pointerEvents:'none',
      }}>‹</div>
    </button>
  );
}

function SideMenu({ scene, onGo }) {
  const HEAT = '#ec4899';
  const VIOLET = '#a78bfa';
  const ACCENT = '#c026d3';
  const items = scene === 'builder' ? [
    { id:'select', label:'SCHIERA',         sub:'PRE-DUELLO',  accent:HEAT,   meta:'SCEGLI IL TUO MAZZO', to:'select' },
    { id:'menu',   label:'MENU PRINCIPALE', sub:'INDIETRO',    accent:VIOLET, meta:'TORNA AL MENU',        to:'menu'   },
  ] : [
    { id:'builder',label:'MODIFICA',        sub:'COSTRUZIONE', accent:ACCENT, meta:'EDITA IL TUO MAZZO',   to:'builder'},
    { id:'menu',   label:'MENU PRINCIPALE', sub:'INDIETRO',    accent:VIOLET, meta:'TORNA AL MENU',        to:'menu'   },
  ];
  return (
    <div style={{
      position:'absolute', bottom:56, left:0, zIndex:40,
      display:'flex', flexDirection:'column', gap:10, width:360,
    }}>
      {items.map((item, i) => (
        <SideMenuItem key={item.id} item={item} index={i}
          onClick={() => onGo({ from: scene, to: item.to, label: item.label })}/>
      ))}
    </div>
  );
}

export default function CosmicFlow() {
  const [scene, setScene] = useState('menu');
  const [transition, setTransition] = useState(null);
  const [outgoing, setOutgoing] = useState(null);

  function go({ to, from, label }) {
    if (transition) return;
    setOutgoing(from);
    setTransition({ from, to, label });
    setTimeout(() => setScene(to), 290);
    setTimeout(() => { setOutgoing(null); setTransition(null); }, 740);
  }

  const showMenu    = scene === 'menu'    || outgoing === 'menu';
  const showSelect  = scene === 'select'  || outgoing === 'select';
  const showBuilder = scene === 'builder' || outgoing === 'builder';

  function classFor(name) {
    if (!transition) return '';
    if (outgoing === name) return 'scene--exit';
    if (scene === name && transition) return 'scene--enter';
    return '';
  }

  return (
    <div className="stage" style={{ position:'absolute', inset:0,
      background:'#06030a', color:'#f5f3eb',
      fontFamily:'Chakra Petch, sans-serif', overflow:'hidden' }}>
      {showMenu && (
        <div className={`scene ${classFor('menu')}`}
          style={{ position:'absolute', inset:0, zIndex: scene === 'menu' ? 2 : 1 }}>
          <MenuShell onPick={go}/>
        </div>
      )}
      {showSelect && (
        <div className={`scene ${classFor('select')}`}
          style={{ position:'absolute', inset:0, zIndex: scene === 'select' ? 2 : 1 }}>
          <DeckSelectCosmic/>
          <SideMenu scene="select" onGo={go}/>
        </div>
      )}
      {showBuilder && (
        <div className={`scene ${classFor('builder')}`}
          style={{ position:'absolute', inset:0, zIndex: scene === 'builder' ? 2 : 1 }}>
          <DeckBuilderCosmic/>
          <SideMenu scene="builder" onGo={go}/>
        </div>
      )}
      {transition && (
        <React.Fragment>
          <div className="stage-backdrop"/>
          <div style={{ position:'absolute', inset:0, zIndex:100, pointerEvents:'none', overflow:'hidden' }}>
            <div className="sweep-panel sweep-panel--a"/>
            <div className="sweep-panel sweep-panel--b"/>
            <div className="flash-bloom"/>
            <div className="glitch-line" style={{ top:'20%', animationDelay:'0.04s' }}/>
            <div className="glitch-line" style={{ top:'55%', animationDelay:'0.14s' }}/>
            <div className="glitch-line" style={{ top:'78%', animationDelay:'0.24s' }}/>
            <div className="load-text">
              {transition.to === 'menu' ? 'INDIETRO'
                : transition.to === 'select' ? 'SCHIERA · MAZZO'
                : 'ARSENALE · MAZZO'}
            </div>
            <div className="load-sub">
              {transition.label ? `> ${transition.label}` : '> CARICAMENTO'}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

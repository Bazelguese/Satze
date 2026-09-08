import React, { useEffect, useId, useRef } from 'react';

export function CampaignDialog({ title, onClose, children }) {
  const ref = useRef(null), titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.querySelector('button').focus();
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const items = [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('keydown', handleKey);
    return () => { dialog.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [onClose]);
  return <div className="cs-dialog-shade" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={ref} className="cs-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header><div><p className="cs-kicker">RICOGNIZIONE</p><h2 id={titleId}>{title}</h2></div><button onClick={onClose}>Chiudi</button></header>
      {children}
    </section>
  </div>;
}

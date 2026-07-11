import React, { useRef, useEffect } from 'react';
import { PALETTE, HUD_ORATORIO_FONT_UI } from '../../theme/hudOratorioPalette';
import { resolvePublicAssetUrl } from '../../utils/preloadAssets';

/** Rimuove emoji dal testo - preserva cifre (\\p{Emoji} può matchare digits in alcuni engine) */
const stripEmoji = (str, keep = false) => {
  if (keep || typeof str !== 'string') return str;
  return str.replace(/\p{Emoji}/gu, (m) => (/\p{N}/u.test(m) ? m : '')).replace(/^\s+/, '');
};

/** Colori fissi per PV, FC, VA, POT, DAN */
const LOG_COLORS = {
  pv: { color: '#22c55e' },
  fc: { color: '#FFB347' },
  va: { color: '#a78bfa' },
  stat: { color: '#94a3b8' },
};

/** Converte hex in rgba con opacità */
const hexToRgba = (hex, alpha = 0.28) => {
  if (!hex || typeof hex !== 'string') return `rgba(148, 163, 184, ${alpha})`;
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return `rgba(148, 163, 184, ${alpha})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
};

/** Esclude nomi in parentesi che non sono agenti */
const isAgentName = (s) => {
  const t = (s || '').trim();
  return t.length > 4 && !/^(post|min|copiato|immune)$/i.test(t);
};

/** Formatta una riga di log con sfondi e colori per player, IA, agenti, PV, FC */
function formatLogLine(str, lineKey, playerColor = '#4FD1C5', enemyColor = '#D946EF') {
  if (typeof str !== 'string') return str;
  const player = { bg: hexToRgba(playerColor), color: playerColor };
  const enemy = { bg: hexToRgba(enemyColor), color: enemyColor };
  const parts = [];
  const isPvContext = /PV|iniziali|perde|PV\)/.test(str) && !/FC\s+disponibili|investi|investe/.test(str.slice(0, 50));
  const isFcContext = /FC|investi|investe|disponibili/.test(str);
  const re = /(TU)\s*\(([^)]+)\)|(IA)\s*\(([^)]+)\)|(TU)\s+schieri:\s*([^\n(]+)|(L'IA|l'IA|IA)\s+schiera:\s*([^\n(]+)|(L'IA|l'IA|IA)\s+sceglie:\s*([^\n(]+)|(Tu):\s*([^(]+?)(?=\s*\()|(IA):\s*([^(]+?)(?=\s*\()|(Tu):\s*(\d+)\s*→\s*(\d+)(?=\s*\|)|(IA):\s*(\d+)\s*→\s*(\d+)(?=\s*\|)|Tu\s+(\d+)(?=\s*\|)|IA\s+(\d+)(?=\s*[\|\)]|$)|((\d+)\s*→\s*)?(\d+)\s*(PV)|((\d+)\s*→\s*)?(\d+)\s*(FC)|(\bTU\b|\bTu\b|\bTe\b|\bTuo\b|\bTua\b)|(\bIA\b|L'IA|l'IA)|(\bavversario\b)|(\bVA\b)|(\bPOT\b)|(\bDAN\b)|(\bPV\b)|(\bFC\b)/gi;
  let lastIndex = 0;
  let match;
  let partKey = 0;
  const span = (content, style, key) => <span key={key} className={style?.backgroundColor ? 'px-0.5 rounded' : ''} style={style || undefined}>{content}</span>;
  while ((match = re.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={`${lineKey}-${partKey++}`}>{str.slice(lastIndex, match.index)}</React.Fragment>);
    }
    if (match[1] && match[2] && isAgentName(match[2])) {
      parts.push(span(match[1], { backgroundColor: player.bg, color: player.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(' (', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[2], { backgroundColor: player.bg, color: player.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(')', null, `${lineKey}-${partKey++}`));
    } else if (match[3] && match[4] && isAgentName(match[4])) {
      parts.push(span(match[3], { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(' (', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[4], { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(')', null, `${lineKey}-${partKey++}`));
    } else if (match[5] && match[6]) {
      parts.push(span(match[5], { backgroundColor: player.bg, color: player.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(' schieri: ', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[6].trim(), { backgroundColor: player.bg, color: player.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[7] && match[8]) {
      parts.push(span(match[7], { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(' schiera: ', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[8].trim(), { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[9] && match[10]) {
      parts.push(span(match[9], { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(' sceglie: ', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[10].trim(), { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[11] && match[12]) {
      parts.push(span(match[11], { backgroundColor: player.bg, color: player.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(': ', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[12].trim(), { backgroundColor: player.bg, color: player.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[13] && match[14]) {
      parts.push(span(match[13], { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(': ', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[14].trim(), { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[15] && match[16] !== undefined && match[17] !== undefined) {
      parts.push(span(match[15], { backgroundColor: player.bg, color: player.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(': ', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[16], { color: LOG_COLORS.fc.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(' → ', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[17], { color: LOG_COLORS.fc.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[18] && match[19] !== undefined && match[20] !== undefined) {
      parts.push(span(match[18], { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(': ', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[19], { color: LOG_COLORS.fc.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(' → ', null, `${lineKey}-${partKey++}`));
      parts.push(span(match[20], { color: LOG_COLORS.fc.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[21] !== undefined) {
      const col = isPvContext ? LOG_COLORS.pv.color : LOG_COLORS.fc.color;
      parts.push(span('Tu ', { backgroundColor: player.bg, color: player.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(match[21], { color: col, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[22] !== undefined) {
      const col = isPvContext ? LOG_COLORS.pv.color : LOG_COLORS.fc.color;
      parts.push(span('IA ', { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
      parts.push(span(match[22], { color: col, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[23] !== undefined || match[24] !== undefined || match[25] !== undefined || match[26] !== undefined) {
      parts.push(span(match[0], { color: LOG_COLORS.pv.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[27] !== undefined || match[28] !== undefined || match[29] !== undefined || match[30] !== undefined) {
      parts.push(span(match[0], { color: LOG_COLORS.fc.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[31] !== undefined) {
      parts.push(span(match[0], { backgroundColor: player.bg, color: player.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[32] !== undefined || match[33] !== undefined) {
      parts.push(span(match[0], { backgroundColor: enemy.bg, color: enemy.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[34] !== undefined) {
      parts.push(span(match[0], { color: LOG_COLORS.va.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[35] !== undefined || match[36] !== undefined) {
      parts.push(span(match[0], { color: LOG_COLORS.stat.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    } else if (match[37] !== undefined || match[38] !== undefined) {
      parts.push(span(match[0], { color: match[37] ? LOG_COLORS.pv.color : LOG_COLORS.fc.color, fontWeight: 600 }, `${lineKey}-${partKey++}`));
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(<React.Fragment key={`${lineKey}-${partKey++}`}>{str.slice(lastIndex)}</React.Fragment>);
  }
  return parts.length ? parts : str;
}

/**
 * Componente pannello log di battaglia
 * Mostra i log delle azioni durante il duello con scroll automatico.
 * Durante la fase risultato mantiene le emoji per un riepilogo più leggibile e affidabile.
 * Stile HUD cosmico (palette Oratorio).
 */
export const LogPanel = ({ logs = [], gamePhase, className = '', playerColor = '#4FD1C5', enemyColor = '#D946EF' }) => {
  const keepEmojis = gamePhase === 'result';
  const maxLogs = keepEmojis ? 200 : 150;
  const logRef = useRef(null);
  
  // Scroll automatico in cima (ultimi eventi) quando arrivano nuovi log.
  // La prima riga (inizio battaglia) è in basso; scrollando verso il basso la si porta in cima.
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [logs]);
  
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl p-2 satze-hide-scrollbar ${
        gamePhase === 'result' ? 'animate-fade-out-panels' : ''
      } ${className}`}
      style={{
        ...(gamePhase === 'result' ? { pointerEvents: 'auto' } : {}),
        background: `linear-gradient(135deg, ${PALETTE.deepVoid}dd 0%, ${PALETTE.nebula}cc 100%), url(${resolvePublicAssetUrl('/Immagini_bg/CampoLOG_bg.webp')}) center/cover no-repeat`,
        border: `1.5px solid ${PALETTE.slate}`,
        boxShadow: `0 2px 8px #000`,
        fontFamily: HUD_ORATORIO_FONT_UI,
      }}
    >
      <div
        className="text-center text-sm font-bold uppercase tracking-[0.15em]"
        style={{
          color: PALETTE.textPrimary,
          textShadow: `0 0 20px ${PALETTE.amber}44, 0 2px 4px #000`,
        }}
      >
        LOG BATTAGLIA
      </div>
      <div
        className="w-full my-1.5"
        style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent 0%, ${PALETTE.slate}88 20%, ${PALETTE.amber}66 50%, ${PALETTE.slate}88 80%, transparent 100%)`,
          boxShadow: `0 0 6px ${PALETTE.amber}22`,
        }}
      />
      <div
        ref={logRef}
        className="flex min-h-0 flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto text-xs"
        style={{ color: PALETTE.textSecondary }}
      >
        <div className="pb-[100vh]">
          {[...logs.slice(-maxLogs)].reverse().map((log, i) => (
            <p key={i} className="leading-relaxed whitespace-pre-wrap">
              {formatLogLine(stripEmoji(log, keepEmojis), i, playerColor, enemyColor)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

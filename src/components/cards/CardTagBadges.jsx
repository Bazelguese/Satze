import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { PALETTE } from "../menu";
import { getCardTags, shouldShowTagAsRole, TAG_TOOLTIPS } from "../../data/cardTags";

/**
 * Badge singolo (grigio o rosso per Ruolo). Tooltip via portal.
 * Usato in deck builder e galleria.
 */
export function TagBadge({ tag, compact, title, showAsRole }) {
  const [hovered, setHovered] = useState(false);
  const [rect, setRect] = useState(null);
  const badgeRef = useRef(null);
  const tooltipText = title || TAG_TOOLTIPS[tag] || tag;

  const handleMouseEnter = () => {
    setHovered(true);
    if (badgeRef.current) setRect(badgeRef.current.getBoundingClientRect());
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setRect(null);
  };

  return (
    <>
      <span
        ref={badgeRef}
        style={{ position: "relative", display: "inline-block" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span
          style={{
            fontSize: compact ? 9 : 13,
            fontWeight: compact ? 600 : 700,
            letterSpacing: compact ? "normal" : "0.02em",
            color: showAsRole ? "#ef4444" : "#94a3b8",
            background: showAsRole ? "#ef444420" : "#64748b30",
            padding: compact ? "1px 5px" : "4px 10px",
            borderRadius: compact ? 4 : 5,
            border: `1px solid ${showAsRole ? "#ef444440" : "#64748b40"}`,
            whiteSpace: "nowrap",
          }}
        >
          {tag}
        </span>
      </span>
      {hovered && tooltipText && rect &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: rect.left + rect.width / 2,
              bottom: window.innerHeight - rect.top + 8,
              transform: "translateX(-50%)",
              padding: "10px 14px",
              background: `linear-gradient(180deg, ${PALETTE.deepVoid} 0%, ${PALETTE.nebula}dd 100%)`,
              border: `1.5px solid ${PALETTE.amber}`,
              borderRadius: 0,
              boxShadow: `0 0 16px ${PALETTE.amber}30, 0 4px 12px #000`,
              fontFamily: "'Cinzel', 'Georgia', serif",
              fontSize: 12,
              color: PALETTE.textPrimary,
              maxWidth: 220,
              whiteSpace: "normal",
              lineHeight: 1.4,
              zIndex: 10003,
              pointerEvents: "none",
            }}
          >
            <div style={{ fontWeight: 700, color: PALETTE.amber, marginBottom: 4, letterSpacing: "0.05em" }}>{tag}</div>
            <div style={{ color: PALETTE.textSecondary, fontSize: 11 }}>{tooltipText}</div>
          </div>,
          document.body
        )}
    </>
  );
}

const tagRowStyle = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 6,
  width: "100%",
};

/**
 * Tag per carta (id gioco).
 * @param {boolean} splitRoleRows - se true (galleria): prima riga grigi, seconda ruoli rossi. Se false: una riga come in deck builder.
 */
export function CardTagsRow({ cardId, compact = true, className = "", style = {}, splitRoleRows = false }) {
  const tags = getCardTags(cardId);
  if (!tags?.length) return null;
  const unique = [...new Set(tags)];

  if (!splitRoleRows) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: compact ? 4 : 6,
          justifyContent: "center",
          width: "100%",
          ...style,
        }}
      >
        {unique.map((t) => (
          <TagBadge key={`${cardId}-${t}`} tag={t} compact={compact} showAsRole={shouldShowTagAsRole(t, tags)} />
        ))}
      </div>
    );
  }

  const greyTags = unique.filter((t) => !shouldShowTagAsRole(t, tags));
  const redTags = unique.filter((t) => shouldShowTagAsRole(t, tags));

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: redTags.length && greyTags.length ? 8 : 0,
        width: "100%",
        ...style,
      }}
    >
      {greyTags.length > 0 && (
        <div style={tagRowStyle}>
          {greyTags.map((t) => (
            <TagBadge key={`${cardId}-g-${t}`} tag={t} compact={compact} showAsRole={false} />
          ))}
        </div>
      )}
      {redTags.length > 0 && (
        <div style={tagRowStyle}>
          {redTags.map((t) => (
            <TagBadge key={`${cardId}-r-${t}`} tag={t} compact={compact} showAsRole />
          ))}
        </div>
      )}
    </div>
  );
}

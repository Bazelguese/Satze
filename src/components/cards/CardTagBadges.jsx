import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { PALETTE } from "../menu";
import {
  getCardDisplayLabels,
  LABEL_TOOLTIPS,
} from "../../data/cardArchetypes";

const VARIANT_STYLES = {
  archetype: {
    color: PALETTE.amber,
    background: `${PALETTE.amber}22`,
    border: `${PALETTE.amber}55`,
  },
  secondary: {
    color: "#cbd5e1",
    background: "#64748b28",
    border: "#94a3b850",
  },
  focus: {
    color: "#67e8f9",
    background: "rgba(103,232,249,0.12)",
    border: "rgba(103,232,249,0.4)",
  },
  scaling: {
    color: "#c084fc",
    background: "rgba(192,132,252,0.14)",
    border: "rgba(192,132,252,0.42)",
  },
};

/**
 * Badge singolo. kind: archetype | secondary | focus | scaling
 */
export function TagBadge({ tag, compact, title, showAsRole, variant, kind }) {
  const [hovered, setHovered] = useState(false);
  const [rect, setRect] = useState(null);
  const badgeRef = useRef(null);
  const resolvedKind = kind || variant || (showAsRole ? "archetype" : "secondary");
  const style = VARIANT_STYLES[resolvedKind] || VARIANT_STYLES.secondary;
  const tooltipText = title || LABEL_TOOLTIPS[tag] || tag;
  const displayText =
    resolvedKind === "secondary" && !String(tag).startsWith("/")
      ? `/ ${tag}`
      : tag;

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
            color: style.color,
            background: style.background,
            padding: compact ? "1px 5px" : "4px 10px",
            borderRadius: compact ? 4 : 5,
            border: `1px solid ${style.border}`,
            whiteSpace: "nowrap",
          }}
        >
          {displayText}
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
              maxWidth: 240,
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
 * Badge Archetipo [/ Secondario] · Focus · Scalante
 * @param {boolean} splitRoleRows - se true: riga archetipo(+secondario), poi qualificatori
 */
export function CardTagsRow({ cardId, compact = true, className = "", style = {}, splitRoleRows = false }) {
  const labels = getCardDisplayLabels(cardId);
  if (!labels.length) return null;

  const primary = labels.filter((l) => l.kind === "archetype" || l.kind === "secondary");
  const qualifiers = labels.filter((l) => l.kind === "focus" || l.kind === "scaling");

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
        {labels.map(({ text, kind, title }) => (
          <TagBadge key={`${cardId}-${kind}-${text}`} tag={text} compact={compact} kind={kind} title={title} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: primary.length && qualifiers.length ? 8 : 0,
        width: "100%",
        ...style,
      }}
    >
      {primary.length > 0 && (
        <div style={tagRowStyle}>
          {primary.map(({ text, kind, title }) => (
            <TagBadge key={`${cardId}-${kind}-${text}`} tag={text} compact={compact} kind={kind} title={title} />
          ))}
        </div>
      )}
      {qualifiers.length > 0 && (
        <div style={tagRowStyle}>
          {qualifiers.map(({ text, kind, title }) => (
            <TagBadge key={`${cardId}-${kind}-${text}`} tag={text} compact={compact} kind={kind} title={title} />
          ))}
        </div>
      )}
    </div>
  );
}

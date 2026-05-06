import { useState } from "react";
import { PALETTE } from "../../theme/hudOratorioPalette";

const MENU_DEFAULT_ACCENT = "#c026d3";

/** Card stile cosmic (menù ufficiale) per griglie armate / deck / difficoltà */
export function MenuCard({ children, onClick, accentColor, className = "" }) {
  const [hovered, setHovered] = useState(false);
  const color = accentColor || MENU_DEFAULT_ACCENT;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        position: "relative",
        padding: "1.25rem 1.5rem",
        background: hovered ? `${color}18` : `${color}0c`,
        border: `1.5px solid ${hovered ? color : PALETTE.slate}`,
        borderRadius: 0,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.25s ease",
        boxShadow: hovered ? `0 0 20px ${color}40, 0 4px 12px #000` : `0 2px 8px #000`,
        fontFamily: "'Cinzel', 'Georgia', serif",
      }}
    >
      {children}
    </button>
  );
}

/** Pulsante "Torna indietro" stile cosmico */
export function MenuBackButton({ children, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        marginTop: "2rem",
        padding: "0.75rem 1.5rem",
        background: hovered ? "#1a0d24" : "#110b20",
        border: `1.5px solid ${hovered ? "#ec4899" : PALETTE.slate}`,
        borderRadius: 0,
        color: hovered ? "#fdf4ff" : PALETTE.textSecondary,
        cursor: "pointer",
        fontFamily: "'Cinzel', 'Georgia', serif",
        fontWeight: 600,
        letterSpacing: "0.1em",
        transition: "all 0.25s ease",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <span>←</span> {children}
    </button>
  );
}

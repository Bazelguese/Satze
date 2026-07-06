/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./Codice/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Bridge verso i design token di src/styles/cosmic-tokens.css:
      // permette classi come bg-menu-void, text-accent-cyan, font-display.
      colors: {
        'bg-void': 'var(--bg-void)',
        'bg-night': 'var(--bg-night)',
        'bg-panel': 'var(--bg-panel)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-gold': 'var(--accent-gold)',
        'accent-fire': 'var(--accent-fire)',
        'accent-magenta': 'var(--accent-magenta)',
        // Identità menu cosmic: hex letterali (specchio dei token --menu-* in
        // cosmic-tokens.css) così funzionano i modificatori alpha (es. /80).
        'menu-void': '#06030a',
        'menu-panel': '#110b20',
        'menu-magenta': '#c026d3',
        'menu-pink': '#ec4899',
        'menu-text': '#f5f3eb',
      },
      fontFamily: {
        display: ['Cinzel', 'Times New Roman', 'serif'],
        ui: ['Chakra Petch', 'system-ui', 'sans-serif'],
        techmono: ['Share Tech Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}

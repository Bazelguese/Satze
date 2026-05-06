// Shell UI per anteprima Style Lab (merge in StatsPanel / box round) — non usato nel duello vero

export const STYLELAB_STATS_SHELL = {
  campaign: {
    background: 'linear-gradient(180deg, #0c1018 0%, #07090d 100%)',
    borderColor: '#1e3a4a',
    borderWidth: '1px',
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.12)',
  },
  tabletop: {
    background: 'linear-gradient(180deg, rgba(45,32,22,0.95) 0%, rgba(22,14,10,0.98) 100%)',
    borderColor: '#5c4030',
    borderWidth: '1px',
    boxShadow: 'inset 0 0 0 1px rgba(255,245,220,0.06), 0 10px 32px rgba(0,0,0,0.5)',
  },
  pergamena2: {
    background: 'linear-gradient(165deg, rgba(55,38,24,0.96) 0%, rgba(28,18,12,0.99) 100%)',
    borderColor: '#6b4c32',
    borderWidth: '2px',
    borderStyle: 'double',
    boxShadow: 'inset 0 -12px 24px rgba(0,0,0,0.35), 0 12px 36px rgba(0,0,0,0.55)',
  },
  hud: {
    background: 'linear-gradient(180deg, #0c1018 0%, #07090d 100%)',
    borderColor: '#1e3a4a',
    borderWidth: '1px',
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.12)',
  },
  hud_satze: {
    background: 'linear-gradient(180deg, #14101c 0%, #0c0a10 100%)',
    borderColor: '#3d2f55',
    borderWidth: '1px',
    boxShadow: '0 0 24px rgba(139, 92, 246, 0.15)',
  },
  forgia: {
    background: 'linear-gradient(165deg, rgba(40,32,24,0.96) 0%, rgba(18,14,10,0.99) 100%)',
    borderColor: 'rgba(200, 150, 70, 0.45)',
    borderWidth: '1px',
    boxShadow: '0 10px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,160,0.06)',
  },
};

export const STYLELAB_ROUND_BOX = {
  campaign: {
    background: 'rgba(7, 9, 13, 0.92)',
    border: '1px solid #1e3a4a',
    colorRound: '#38bdf8',
    colorSub: '#64748b',
    fontFamily: "'Chakra Petch', sans-serif",
  },
  tabletop: {
    background: 'rgba(25, 18, 12, 0.92)',
    border: '1px solid #5c4030',
    colorRound: '#e8c48a',
    colorSub: '#b89a78',
    fontFamily: "'Cinzel', Georgia, serif",
  },
  pergamena2: {
    background: 'rgba(35, 24, 16, 0.94)',
    border: '2px double #6b4c32',
    colorRound: '#f5e6c8',
    colorSub: '#c9a66b',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  hud: {
    background: '#07090d',
    border: '1px solid #1e3a4a',
    colorRound: '#38bdf8',
    colorSub: '#64748b',
    fontFamily: "'Chakra Petch', sans-serif",
  },
  hud_satze: {
    background: '#100e16',
    border: '1px solid #4a3568',
    colorRound: '#e9c46a',
    colorSub: '#7a8aaa',
    fontFamily: "'Rajdhani', sans-serif",
  },
  forgia: {
    background: 'rgba(28, 22, 16, 0.95)',
    border: '1px solid rgba(180, 140, 70, 0.4)',
    colorRound: '#f4d68a',
    colorSub: '#a89f90',
    fontFamily: "'Barlow Condensed', sans-serif",
  },
};

export const STYLELAB_STAGE_BG = {
  campaign: 'linear-gradient(180deg, #050608 0%, #0a0c10 100%)',
  tabletop: 'radial-gradient(ellipse at 50% 20%, rgba(90, 60, 35, 0.35) 0%, transparent 50%), #120a06',
  pergamena2: 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(90, 60, 35, 0.35) 0%, transparent 50%), #0d0805',
  hud: 'linear-gradient(180deg, #050608 0%, #0a0c10 100%)',
  hud_satze: 'linear-gradient(185deg, #07060c 0%, #120a18 40%, #06080e 100%)',
  forgia: 'radial-gradient(ellipse at 50% 0%, #1f1810 0%, #0f0d0a 55%, #0a0908 100%)',
};

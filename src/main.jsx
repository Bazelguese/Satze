import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './index-graphics-prova.css'
import './styles/satze-duello-2_5d.css'
import './styles/satze-eminenza.css'
import './styles/em-card-armate.css'
import './styles/em-card-cells.css'
import './styles/em-card-fenditura.css'
import './styles/em-card-ingressi.css'
import './styles/em-announce-vetro.css'
import './styles/satze-duello-animazioni.css'
import './styles/satze-duello-ingresso-carta.css'
import './styles/satze-duello-ingresso-carta-extra.css'
import './styles/satze-card-interaction.css'
import './styles/cosmic-tokens.css'
import './styles/satze-duello-cosmo.css'
import './lib/em-cells.js'

import { App } from './App'
import { bindAudioUnlock, unlockAudio } from './audio/soundBus'

// Grafica cosmica attiva di default
document.body.classList.add('graphics-prova')
bindAudioUnlock()
// Client desktop: niente gesto richiesto (switch autoplay in electron/main.cjs), quindi il
// dispositivo audio si apre ora, a schermata di caricamento, e non al primo tasto nel menù.
if (window.electronAPI) unlockAudio()

// ?manuale=stampa: solo le pagine del libretto, una per foglio. È la sorgente del PDF
// (scripts/manuale/build-pdf.mjs) e non avvia il gioco.
const isManualPrint = new URLSearchParams(window.location.search).get('manuale') === 'stampa'

if (isManualPrint) {
  document.documentElement.classList.add('satze-manual-print')
  document.getElementById('loading-initial')?.remove()
  import('./manual/ManualBook.jsx').then(({ ManualPrint }) => {
    ReactDOM.createRoot(document.getElementById('root')).render(<ManualPrint />)
  })
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

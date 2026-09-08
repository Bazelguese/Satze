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
import './styles/cosmic-tokens.css'
import './lib/em-cells.js'

import { App } from './App'
import { bindAudioUnlock } from './audio/soundBus'

// Grafica cosmica attiva di default
document.body.classList.add('graphics-prova')
bindAudioUnlock()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

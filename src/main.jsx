import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './index-graphics-prova.css'
import './styles/satze-duello-2_5d.css'
import './styles/satze-eminenza.css'
import './styles/satze-duello-animazioni.css'
import './styles/satze-duello-ingresso-carta.css'
import './styles/satze-duello-ingresso-carta-extra.css'
import './styles/cosmic-tokens.css'

import { App } from './App'

// Grafica cosmica attiva di default
document.body.classList.add('graphics-prova')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

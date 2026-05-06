import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './index-graphics-prova.css'

import { App } from './App'

// Grafica cosmica attiva di default
document.body.classList.add('graphics-prova')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

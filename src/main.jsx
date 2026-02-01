import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- 1. IMPORTANTE: Agregamos esto
import App from './App.jsx'

import './css/normalize.css'
import './css/styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      {/* 2. IMPORTANTE: Envolvemos App con BrowserRouter */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
)
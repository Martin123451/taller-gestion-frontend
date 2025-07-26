import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Importamos nuestro componente principal
import './styles/globals.css' // Importamos los estilos globales que configuraremos después

// Esta línea busca el <div id="root"></div> en tu index.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
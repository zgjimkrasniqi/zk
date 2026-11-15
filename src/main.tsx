import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Film } from './film/Film'
import { useStore } from './store'
import './index.css'

const film = new URLSearchParams(location.search).has('film')
if (film) useStore.setState({ film: true, modelSource: 'procedural' })

ReactDOM.createRoot(document.getElementById('root')!).render(
  film ? (
    <Film />
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ),
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppProvider } from './store/AppContext.jsx'
import { consumeAuthRedirect, watchAuthRedirect } from './supabase/authRedirect.js'
import './index.css'

// Invite / recovery links come back to the site ROOT carrying their payload in
// the URL fragment — which is the same place HashRouter keeps the route. That
// payload has to be read and the URL rewritten to a real route BEFORE the
// router mounts, or the router sees `#access_token=…` and renders Not Found.
watchAuthRedirect()
consumeAuthRedirect().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppProvider>
          <App />
        </AppProvider>
      </HashRouter>
    </React.StrictMode>,
  )
})

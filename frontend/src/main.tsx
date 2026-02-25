import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import { useAuthStore } from './store/authStore'
import App from './App'
import './style.css'

// Hydrate auth state from PocketBase persisted store
useAuthStore.getState().init()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>,
)

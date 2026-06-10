console.log('ENV CHECK', {
  supabase_url: import.meta.env.VITE_SUPABASE_URL,
  supabase_key: import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0,10),
  firebase_key: import.meta.env.VITE_FIREBASE_API_KEY?.slice(0,5),
})

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

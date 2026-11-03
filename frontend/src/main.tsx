import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './app/App'
import { AppProviders } from './app/providers'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find the root element in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)

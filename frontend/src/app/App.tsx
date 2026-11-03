import React from 'react'
import { AppRouter } from './router'

/**
 * Root Application Component.
 * Delegates view rendering to the role-based AppRouter.
 */
export const App: React.FC = () => {
  return <AppRouter />
}

export default App

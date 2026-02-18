import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { validateEnvironmentVariables } from './lib/security'
import { queryClient } from './lib/queryClient'

// Validate environment variables on startup
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('Environment validation failed:', error);
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

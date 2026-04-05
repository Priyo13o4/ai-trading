import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
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

if (typeof window !== 'undefined' && window.location.hostname === 'www.pipfactor.com') {
  const canonical = `https://pipfactor.com${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(canonical);
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Analytics />
    <SpeedInsights />
  </QueryClientProvider>
);

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { validateEnvironmentVariables } from './lib/security'

// Validate environment variables on startup
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('Environment validation failed:', error);
}

createRoot(document.getElementById("root")!).render(<App />);

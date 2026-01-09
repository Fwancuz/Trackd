import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthProvider from './AuthProvider.jsx'
import ThemeProvider from './ThemeContext.jsx'
import { ToastProvider } from './ToastContext.jsx'

// Global error interceptor for removeChild errors caused by aggressive tab freezing
window.addEventListener('error', (e) => {
  if (e.message?.includes('removeChild')) {
    e.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)

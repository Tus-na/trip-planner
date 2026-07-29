import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TripProvider } from './context/TripContext'; // Import TripProvider
import { ToastProvider } from './context/ToastContext'; // Import ToastProvider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TripProvider> {/* Wrap App with TripProvider */}
          <ToastProvider> {/* Wrap App with ToastProvider */}
            <App />
          </ToastProvider>
        </TripProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

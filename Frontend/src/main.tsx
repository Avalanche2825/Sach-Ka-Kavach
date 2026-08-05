import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/ToastProvider.tsx';
import './index.css';

// Intercept global fetch to prevent ECONNREFUSED logs in local dev mode when offline
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : (input instanceof URL ? input.href : (input as Request).url);
  if (url.startsWith("/api/") && localStorage.getItem("sach_offline_mode") === "true") {
    throw new Error("Offline mode bypass active. Skipping real API request.");
  }
  return originalFetch.apply(this, [input, init]);
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);

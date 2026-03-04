import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Defensive check for fetch to prevent "Cannot set property fetch of #<Window>" errors
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  try {
    // Some libraries try to overwrite window.fetch. 
    // If it's a getter-only property, this will fail.
    // We try to set it to itself to see if it's writable.
    // @ts-ignore
    window.fetch = originalFetch;
  } catch (e) {
    console.warn('window.fetch is read-only. Preventing potential overwrite attempts.');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

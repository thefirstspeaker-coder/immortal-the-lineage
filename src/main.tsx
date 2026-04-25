import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

console.log('[boot] main.tsx loaded', {
  path: window.location.pathname,
  hasRootElement: Boolean(rootElement),
  readyState: document.readyState,
});

if (!rootElement) {
  console.error('[boot] Could not find #root element. App cannot mount.');
  throw new Error('Missing #root element');
}

console.log('[boot] Mounting React app');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

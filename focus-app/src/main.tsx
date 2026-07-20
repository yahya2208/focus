import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('[FOCUS] main.tsx executing');

window.addEventListener('error', (event) => {
  console.error('[FOCUS GLOBAL ERROR]', event.message, '\nSource:', event.filename, '\nLine:', event.lineno, 'Col:', event.colno, '\nError:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[FOCUS UNHANDLED REJECTION]', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

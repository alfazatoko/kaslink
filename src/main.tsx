import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('main.tsx is running');
try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (e) {
  console.error('Render error:', e);
  document.getElementById('root')!.innerHTML = `<h1 style="color:red">Fatal Error: ${e}</h1>`;
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('SW registration failed: ', err);
    });
  });
}

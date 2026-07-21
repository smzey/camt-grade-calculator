import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { LanguageProvider } from './LanguageContext.jsx';
import '@camt/ui/styles.css'; // design-system tokens + component styles (load first)
import './styles.css'; // app-specific layout on top

// Standard Vite + React entry point: find the #root div and render <App> into it.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);

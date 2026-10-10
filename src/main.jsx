import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/common/Toast';
import { CRMProvider } from './context/CRMContext';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './index.css';

const basename =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/Dashboard')
    ? '/Dashboard'
    : '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <CRMProvider>
          <App />
        </CRMProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

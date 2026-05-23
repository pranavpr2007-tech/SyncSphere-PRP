import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            style: {
              background: '#166534',
              color: '#F0E8D0',
              border: '1px solid #22c55e',
            },
            iconTheme: { primary: '#22c55e', secondary: '#166534' },
          },
          error: {
            style: {
              background: '#7f1d1d',
              color: '#fef2f2',
              border: '1px solid #ef4444',
            },
            iconTheme: { primary: '#ef4444', secondary: '#7f1d1d' },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import './index.css';
import { router } from './app/router';
import { App } from './app/App';
import { seedDatabase } from './db/seeds';

// Seed dev data
if (import.meta.env.DEV) {
  void seedDatabase();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <RouterProvider router={router} />
  </StrictMode>,
);


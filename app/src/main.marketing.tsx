import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { marketingRouter } from './router.marketing';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={marketingRouter} />
  </StrictMode>,
);

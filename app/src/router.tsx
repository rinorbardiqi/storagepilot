import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useUrlState } from './hooks/useUrlState';
import { useKeyboard } from './hooks/useKeyboard';
import { useConnectionBootstrap } from './hooks/useConnectionBootstrap';

function AppLayout() {
  useUrlState();
  useKeyboard();
  useConnectionBootstrap();
  return <AppShell />;
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/gcs" replace /> },
  { path: '/:provider', element: <AppLayout /> },
  { path: '/:provider/:bucket/*', element: <AppLayout /> },
]);

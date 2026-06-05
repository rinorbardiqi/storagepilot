import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useUrlState } from './hooks/useUrlState';
import { useKeyboard } from './hooks/useKeyboard';
import { useConnectionBootstrap } from './hooks/useConnectionBootstrap';
import { useStoreHydration } from './hooks/useStoreHydration';
import { useNavigationSideEffects } from './hooks/useNavigationSideEffects';

function AppLayout() {
  const hydrated = useStoreHydration();
  useUrlState(hydrated);
  useKeyboard();
  useConnectionBootstrap(hydrated);
  useNavigationSideEffects();
  return <AppShell />;
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/gcs" replace /> },
  { path: '/:provider', element: <AppLayout /> },
  { path: '/:provider/:bucket/*', element: <AppLayout /> },
]);

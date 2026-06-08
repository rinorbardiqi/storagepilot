import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './features/layout/AppShell';
import { useUrlState } from './hooks/useUrlState';
import { useKeyboard } from './hooks/useKeyboard';
import { useConnectionBootstrap } from './hooks/useConnectionBootstrap';
import { useBucketSync } from './hooks/useBucketSync';
import { useStoreHydration } from './hooks/useStoreHydration';
import { useNavigationSideEffects } from './hooks/useNavigationSideEffects';

function AppLayout() {
  const hydrated = useStoreHydration();
  useUrlState(hydrated);
  useKeyboard();
  useConnectionBootstrap(hydrated);
  useBucketSync();
  useNavigationSideEffects();
  return <AppShell />;
}

/** Storage browser routes — used by Docker images and local dev (`pnpm run build`). */
export const appRouter = createBrowserRouter([
  { path: '/', element: <Navigate to="/gcs" replace /> },
  { path: '/:provider', element: <AppLayout /> },
  { path: '/:provider/:bucket/*', element: <AppLayout /> },
]);

import { createHashRouter, Navigate } from 'react-router-dom';
import { LandingPage } from './components/views/LandingPage';

/** Landing-only routes — built separately via `pnpm run build:marketing`. */
export const marketingRouter = createHashRouter([
  { path: '/', element: <LandingPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

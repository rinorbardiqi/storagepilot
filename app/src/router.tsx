import {
  createBrowserRouter,
  createHashRouter,
  Navigate,
} from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { LandingPage } from "./components/views/LandingPage";
import { IS_MARKETING_SITE } from "./lib/siteLinks";
import { useUrlState } from "./hooks/useUrlState";
import { useKeyboard } from "./hooks/useKeyboard";
import { useConnectionBootstrap } from "./hooks/useConnectionBootstrap";
import { useBucketSync } from "./hooks/useBucketSync";
import { useStoreHydration } from "./hooks/useStoreHydration";
import { useNavigationSideEffects } from "./hooks/useNavigationSideEffects";

function AppLayout() {
  const hydrated = useStoreHydration();
  useUrlState(hydrated);
  useKeyboard();
  useConnectionBootstrap(hydrated);
  useBucketSync();
  useNavigationSideEffects();
  return <AppShell />;
}

export const router = IS_MARKETING_SITE
  ? createHashRouter([
      { path: "/", element: <LandingPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ])
  : createBrowserRouter([
      { path: "/", element: <AppLayout /> },
      { path: "/:provider", element: <AppLayout /> },
      { path: "/:provider/:bucket/*", element: <AppLayout /> },
    ]);

import { RouterProvider } from 'react-router-dom';
import { appRouter } from './router.app';

export function App() {
  return <RouterProvider router={appRouter} />;
}

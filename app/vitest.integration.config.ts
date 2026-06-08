import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    setupFiles: ['./vitest.integration.setup.ts'],
    globals: true,
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 30_000,
  },
});

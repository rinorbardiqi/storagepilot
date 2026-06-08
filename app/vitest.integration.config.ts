import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup/integration.setup.ts'],
    globals: true,
    include: ['tests/integration/**/*.integration.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 30_000,
  },
});

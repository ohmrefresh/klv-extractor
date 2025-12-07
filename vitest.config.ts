/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
      ['**/*.test.ts', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/reportWebVitals.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/tests/**',
      ],
    },
  },
});

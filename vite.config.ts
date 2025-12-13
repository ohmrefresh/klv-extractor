import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'test' ? 'test' : mode),
  },
  resolve: {
    conditions: mode === 'test' ? ['development'] : [],
  },
  base: '/klv-extractor/',
  build: {
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    testTimeout: 10000,
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    coverage: {
      provider: 'v8',
      alias: {
        '@/': new URL('./src/', import.meta.url).pathname,
      },
      reporter: ['text', 'text-summary', 'lcov', 'json-summary', 'html', 'cobertura'],
      thresholds: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60,
      },
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/reportWebVitals.ts',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
        'src/tests/**'
      ]
    }
  }
}))

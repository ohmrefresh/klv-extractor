import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { vi } from 'vitest';

// Setup TextEncoder/TextDecoder for jsdom compatibility
// Vitest/jsdom should have these, but add polyfill if needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = await import('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// Add jest compatibility for test files that use jest.fn()
(globalThis as any).jest = vi;

// Ensure proper DOM setup for React Testing Library
configure({ testIdAttribute: 'data-testid' });

// Mock window.alert for tests
global.alert = vi.fn();

// Mock window.navigator.clipboard for tests
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});
import '@testing-library/jest-dom';

// Setup globals that might be missing in test environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Setup proper container for React Testing Library to avoid "Target container is not a DOM element" error
beforeEach(() => {
  // Clear the document
  document.body.innerHTML = '<div id="root"></div>';
});

afterEach(() => {
  // Clean up any leftover DOM elements
  document.body.innerHTML = '';
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
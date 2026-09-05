import { vi, afterEach } from 'vitest';

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Polyfill ResizeObserver for DOM components
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Polyfill matchMedia
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Polyfill window.scrollTo
if (typeof window !== 'undefined' && !window.scrollTo) {
  window.scrollTo = vi.fn();
}

import { vi } from 'vitest';

// Mock React Native modules
vi.mock('react-native-keychain', () => ({
  setInternetCredentials: vi.fn(),
  getInternetCredentials: vi.fn(),
  resetInternetCredentials: vi.fn(),
  SECURITY_LEVEL: {
    SECURE_SOFTWARE: 'SECURE_SOFTWARE',
    SECURE_HARDWARE: 'SECURE_HARDWARE',
    ANY: 'ANY',
  },
}));

vi.mock('@snowplow/react-native-tracker', () => ({
  createTracker: vi.fn(),
  removeTracker: vi.fn(),
}));

vi.mock('react-native-uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

// crypto-js works fine in tests - no need to mock globally

// Setup DOM globals for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Suppress specific console methods in tests
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

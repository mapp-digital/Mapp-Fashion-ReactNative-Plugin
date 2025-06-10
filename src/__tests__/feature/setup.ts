import { afterAll, afterEach, beforeAll } from 'vitest';
import {
  resetApiMocks,
  restoreApiMocks,
  setupApiMocks,
} from './mocks/api-server';

// Establish API mocking before all tests
beforeAll(() => {
  setupApiMocks();
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  resetApiMocks();
});

// Clean up after the tests are finished
afterAll(() => {
  restoreApiMocks();
});

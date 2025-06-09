# Testing Setup for Dressipi SDK

This document describes the testing setup for the Dressipi SDK using Vitest.

## Overview

We've set up a comprehensive testing framework using **Vitest** (modern, fast alternative to Jest) with the following structure:

- **Unit Tests**: Test individual functions and utilities in isolation
- **Feature Tests**: Test complete workflows and integration scenarios
- **Mocking**: HTTP client mocking for API calls
- **React 19 Compatible**: Uses latest testing library versions

## File Structure

```
src/
├── __tests__/
│   ├── unit/                    # Unit tests for individual components
│   │   ├── utils/               # Utility function tests
│   │   ├── services/            # API service tests
│   │   ├── hooks/               # React hook tests
│   │   ├── mapping/             # Data transformation tests
│   │   └── errors/              # Custom error tests
│   ├── feature/                 # Integration/feature tests
│   ├── __mocks__/               # Mock implementations
│   └── test-utils/              # Testing utilities
│       ├── setup.ts             # Global test setup
│       ├── mock-data.ts         # Mock API responses
│       └── test-providers.tsx   # React context providers for tests
├── vitest.config.ts             # Vitest configuration
└── package.json                 # Test scripts
```

## Test Scripts

```bash
# Run tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI dashboard
npm run test:ui
```

## Configuration

### Vitest Config (`vitest.config.ts`)

- **Environment**: jsdom for React component testing
- **Setup**: Global mocks and test utilities
- **Coverage**: 80% threshold for branches, functions, lines, statements
- **Includes**: Only SDK files in `src/` folder
- **Excludes**: App folder, assets, and non-SDK files

### Global Setup (`src/__tests__/test-utils/setup.ts`)

- Mocks React Native modules (keychain, tracker, etc.)
- Mocks HTTP client (axios)
- Mocks crypto utilities
- Sets up DOM globals for jsdom environment

### Mock Data (`src/__tests__/test-utils/mock-data.ts`)

- Mock API responses matching actual API structure
- Mock authentication credentials
- Mock error scenarios
- Mock request parameters

### Test Providers (`src/__tests__/test-utils/test-providers.tsx`)

- React context wrapper for testing hooks
- Provides DressipiProvider with test configuration
- Helper functions for rendering components with context

## Testing Patterns

### Unit Tests Example

```typescript
import { describe, expect, it } from 'vitest';
import { createQueryParameters } from '../../../utils/http';

describe('HTTP Utils', () => {
  it('should create query parameters from request object', () => {
    const params = { item_id: 'test', limit: 10 };
    const result = createQueryParameters(params);
    expect(result).toEqual({ limit: '10' });
  });
});
```

### Hook Testing Example

```typescript
import { renderHook } from '@testing-library/react';
import { TestDressipiProvider } from '../../test-utils/test-providers';
import { useRelatedItems } from '../../../hooks/useRelatedItems';

describe('useRelatedItems', () => {
  it('should fetch related items', async () => {
    const { result } = renderHook(
      () => useRelatedItems({ item_id: 'test-123' }),
      { wrapper: TestDressipiProvider }
    );

    expect(result.current.loading).toBe(true);
    // ... rest of test
  });
});
```

### Service Testing with Mocks

```typescript
import { vi } from 'vitest';
import axios from 'axios';
import { getRelatedItems } from '../../../services/related-items';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Related Items Service', () => {
  it('should call API with correct parameters', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockResponse });

    await getRelatedItems('domain', {}, 'item-123', credentials);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://domain/api/items/item-123/related',
      { headers: { Authorization: 'Bearer token' } }
    );
  });
});
```

## Key Features

### 🚀 **Modern & Fast**

- Vitest is significantly faster than Jest
- Native TypeScript support
- ES modules support out of the box

### 🧪 **Comprehensive Mocking**

- HTTP client mocking (axios)
- React Native module mocking
- Crypto utilities mocking
- External dependency mocking

### ⚛️ **React 19 Compatible**

- Latest Testing Library versions
- Modern hook testing with `renderHook`
- No deprecated packages

### 📊 **Coverage & Quality**

- 80% coverage thresholds
- HTML coverage reports
- Detailed test reporting

### 🎯 **SDK-Focused**

- Only tests SDK code (`src/` folder)
- Excludes app and example code
- Focused on core functionality

## What's Tested

### ✅ **Utilities** (`src/utils/`)

- HTTP parameter building
- JWT token handling
- Keychain operations
- PKCE authentication flow

### ✅ **Services** (`src/services/`)

- API calls with mocked responses
- Error handling scenarios
- Authentication flows
- Request parameter formatting

### ✅ **Hooks** (`src/hooks/`)

- `useRelatedItems` - API calls, loading states, errors
- `useFacettedSearch` - Search functionality
- `useDressipiTracking` - Event tracking
- `useAuth` - Authentication management

### ✅ **Mapping** (`src/mapping/`)

- API response transformations
- Data format conversions
- Type safety validation

### ✅ **Error Handling** (`src/errors/`)

- Custom error classes
- Error propagation
- Authentication errors

## Example Test Results

```
✓ src/__tests__/unit/utils/http.test.ts (6 tests) 2ms
  ✓ HTTP Utils > createQueryParameters > should create query parameters from RelatedItemsApiRequest 1ms
  ✓ HTTP Utils > createQueryParameters > should handle undefined and null values 0ms
  ✓ HTTP Utils > createQueryParameters > should convert methods array to comma-separated string 0ms
  ✓ HTTP Utils > createQueryParameters > should skip item_id parameter 0ms
  ✓ HTTP Utils > createQueryParameters > should map response_format to garment_format 0ms

Test Files  1 passed (1)
     Tests  6 passed (6)
```

## Next Steps

You can now:

1. **Run existing tests**: `npm run test:watch`
2. **Add more unit tests** in `src/__tests__/unit/`
3. **Add feature tests** in `src/__tests__/feature/`
4. **Check coverage**: `npm run test:coverage`

The setup is complete and ready for comprehensive SDK testing!

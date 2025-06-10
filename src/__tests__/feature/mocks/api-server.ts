import { vi } from 'vitest';
import {
  mockAuthErrorResponse,
  mockAuthTokenResponse,
  mockFacettedSearchResponse,
  mockGarmentNotFoundResponse,
  mockRelatedItemsResponse,
} from './mock-data';

// Mock the global fetch function
export const setupApiMocks = () => {
  global.fetch = vi
    .fn()
    .mockImplementation(async (url: string, options?: any) => {
      const urlObj = new URL(url);
      const method = options?.method || 'GET';
      const headers = options?.headers || {};
      const body = options?.body;

      // Authentication endpoints
      if (urlObj.pathname === '/v1/oauth/token' && method === 'POST') {
        const params = new URLSearchParams(body);

        // Check for refresh token flow
        if (params.get('grant_type') === 'refresh_token') {
          const refreshToken = params.get('refresh_token');
          if (refreshToken === 'mock-refresh-token-12345') {
            return createMockResponse(mockAuthTokenResponse);
          }
          return createMockResponse(mockAuthErrorResponse, 400);
        }

        // Check for authorization code flow
        if (params.get('grant_type') === 'authorization_code') {
          const code = params.get('code');
          if (code && code.startsWith('mock-auth-code')) {
            return createMockResponse(mockAuthTokenResponse);
          }
          return createMockResponse(mockAuthErrorResponse, 400);
        }

        return createMockResponse(mockAuthErrorResponse, 400);
      }

      // Authorization endpoint (for PKCE flow)
      if (urlObj.pathname === '/v1/oauth/authorize' && method === 'GET') {
        const state = urlObj.searchParams.get('state');
        const redirectUri = urlObj.searchParams.get('redirect_uri');

        if (redirectUri && state) {
          const authCode = 'mock-auth-code-12345';
          const redirectUrl = `${redirectUri}?code=${authCode}&state=${state}`;

          return createMockResponse({
            redirect_url: redirectUrl,
            code: authCode,
            state: state,
          });
        }

        return createMockResponse({ error: 'invalid_request' }, 400);
      }

      // Related items endpoint
      if (
        urlObj.pathname.startsWith('/v1/related_items/') &&
        method === 'GET'
      ) {
        const itemId = urlObj.pathname.split('/').pop();
        const authHeader = headers['Authorization'] || headers['authorization'];

        // Check authentication
        if (!authHeader || !authHeader.includes('Bearer')) {
          return createMockResponse({ error: 'Unauthorized' }, 401);
        }

        // Handle garment not found scenario
        if (itemId === 'NOT-FOUND-ITEM') {
          return createMockResponse(mockGarmentNotFoundResponse, 404);
        }

        // Handle error scenarios
        if (itemId === 'ERROR-NETWORK') {
          throw new Error('Network error');
        }

        if (itemId === 'ERROR-500') {
          return createMockResponse({ error: 'Internal Server Error' }, 500);
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));
        return createMockResponse(mockRelatedItemsResponse);
      }

      // Facetted search endpoint
      if (urlObj.pathname === '/v1/facetted_search' && method === 'POST') {
        const authHeader = headers['Authorization'] || headers['authorization'];

        // Check authentication
        if (!authHeader || !authHeader.includes('Bearer')) {
          return createMockResponse({ error: 'Unauthorized' }, 401);
        }

        const requestBody = body ? JSON.parse(body) : {};

        // Handle empty search results
        if (requestBody.facets && requestBody.facets.length === 0) {
          return createMockResponse({
            ...mockFacettedSearchResponse,
            recommendations: [],
            pagination: {
              total_pages: 0,
              total_entries: 0,
              current_page: 1,
            },
          });
        }

        // Handle pagination
        const page = parseInt(urlObj.searchParams.get('page') || '1');

        const paginatedResponse = {
          ...mockFacettedSearchResponse,
          pagination: {
            ...mockFacettedSearchResponse.pagination,
            current_page: page,
          },
        };

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 75));
        return createMockResponse(paginatedResponse);
      }

      // Default case - unhandled request
      console.warn(`Unhandled ${method} request to ${url}`);
      return createMockResponse({ error: 'Not found', url }, 404);
    });
};

export const resetApiMocks = () => {
  vi.clearAllMocks();
};

export const restoreApiMocks = () => {
  vi.restoreAllMocks();
};

// Helper function to create mock Response objects
const createMockResponse = (data: any, status: number = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    clone: function () {
      return this;
    },
  } as Response);
};

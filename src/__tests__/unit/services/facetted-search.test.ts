import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationError } from '../../../errors/AuthenticationError';
import { performFacettedSearch } from '../../../services/facetted-search';
import { FacettedSearchApiRequest } from '../../../types/facetted-search';
import { mockCredentials } from '../../test-utils/mock-data';
import { facettedResponse } from '../../test-utils/recommendation-v2-data';

const post = vi.mocked(axios.post);
const search = (request: FacettedSearchApiRequest = {}, parameters = {}) =>
  performFacettedSearch(
    'fashion.example',
    parameters,
    request,
    mockCredentials
  );

beforeEach(() => {
  vi.resetAllMocks();
  post.mockResolvedValue({ data: facettedResponse });
});

describe('v2 facetted search', () => {
  it('uses the new endpoint, pagination, detailed metadata and numeric IDs', async () => {
    expect(await search({}, { page: '2', per_page: '20' })).toBe(
      facettedResponse
    );
    const url = new URL(post.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v2/facetted');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: '2',
      per_page: '20',
      garment_format: 'detailed',
      include_fashion_ids: 'true',
    });
  });

  it('translates value facets into v2 filters and preserves JSON values', async () => {
    await search({
      facets: [
        { name: 'garment_category', value: [1, '2'] },
        {
          name: 'brand',
          filters: [{ value: ['H&M'] }, { value: ['Other Brand'] }],
        },
        { name: 'not_feature_ids', value: ['3'] },
      ],
    });
    expect(post.mock.calls[0][1]).toEqual({
      filters: {
        garment_category: ['1', '2'],
        brand: ['H&M', 'Other Brand'],
        not_feature_ids: ['3'],
      },
    });
  });

  it.each([
    ['price', { from: 0, to: 80 }, { min_price: 0, max_price: 80 }],
    ['price', { to: 80 }, { max_price: 80 }],
    ['price', { from: 20 }, { min_price: 20 }],
    ['reduced_by', { from: 30 }, { reduced_by: { from: 30 } }],
  ] as const)('translates a %s range', async (name, range, expected) => {
    await search({ facets: [{ name, filters: [range] }] });
    expect(post.mock.calls[0][1]).toEqual({ filters: expected });
  });

  it('merges repeated value filters without losing selections', async () => {
    await search({
      facets: [
        { name: 'brand', value: ['A'] },
        { name: 'brand', value: ['B', 'A'] },
      ],
    });
    expect(post.mock.calls[0][1]).toEqual({ filters: { brand: ['A', 'B'] } });
  });

  it('sends the first page event ID in the body of subsequent pages', async () => {
    await search({ root_event_id: 'first-page-event' }, { page: '2' });
    expect(post.mock.calls[0][1]).toEqual({
      filters: {},
      root_event_id: 'first-page-event',
    });
    expect(
      new URL(post.mock.calls[0][0]).searchParams.has('root_event_id')
    ).toBe(false);
  });

  it('supports an unfiltered request', async () => {
    await search();
    expect(post.mock.calls[0][1]).toEqual({ filters: {} });
  });

  it.each([
    [{ name: 'must_have', value: ['x'] }],
    [
      {
        name: 'price',
        filters: [
          { from: 10, to: 20 },
          { from: 30, to: 40 },
        ],
      },
    ],
    [{ name: 'price', value: ['0-50'] }],
    [{ name: 'price', filters: [{}] }],
    [{ name: 'brand', filters: [{ from: 0 }] }],
    [{ name: 'brand', value: [{}] }],
    [
      { name: 'price', filters: [{ from: 10 }] },
      { name: 'price', filters: [{ to: 50 }] },
    ],
  ])(
    'rejects unsupported filters rather than silently broadening results: %j',
    async (...facets) => {
      await expect(
        search({ facets: facets as FacettedSearchApiRequest['facets'] })
      ).rejects.toThrow(/API v2|not supported/);
      expect(post).not.toHaveBeenCalled();
    }
  );

  it('sends a JWT only for consented requests', async () => {
    await search();
    expect(post.mock.calls[0][2]?.headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-dressipi-jwt': mockCredentials.access_token,
    });
    await performFacettedSearch('fashion.example', {}, {}, null);
    expect(post.mock.calls[1][2]?.headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  });

  it.each([401, 403])('preserves authentication errors (%s)', async status => {
    post.mockRejectedValue({ response: { status } });
    await expect(search()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it.each(['Network Error', 'timeout of 5000ms exceeded', 'Bad Request'])(
    'preserves failure context: %s',
    async message => {
      post.mockRejectedValue(new Error(message));
      await expect(search()).rejects.toThrow(
        `An error occurred while performing the facetted search: ${message}`
      );
    }
  );
});

import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RelatedItemsMethod } from '../../../enums/RelatedItemsMethod';
import { ResponseFormat } from '../../../enums/ResponseFormat';
import { AuthenticationError } from '../../../errors/AuthenticationError';
import { RelatedItemsGarmentNotFoundError } from '../../../errors/RelatedItemsGarmentNotFoundError';
import { getRelatedItems } from '../../../services/related-items';
import { mapRelatedItemsApiResponse } from '../../../mapping/mapRelatedItemsApiResponse';
import {
  garments,
  outfit,
  recommendation,
  source,
} from '../../test-utils/recommendation-v2-data';
import { mockCredentials } from '../../test-utils/mock-data';

const get = vi.mocked(axios.get);
const domain = 'fashion.example';
const fetch = (
  parameters: Record<string, string> = {},
  credentials = mockCredentials
) => getRelatedItems(domain, parameters, 'ITEM-1', credentials);
const urls = () => get.mock.calls.map(([url]) => new URL(url));
const respond = () =>
  get.mockImplementation(async url => {
    const endpoint = new URL(url).pathname.split('/').pop();
    return {
      data: {
        event_id: `${endpoint}-event`,
        source,
        garment_data: garments,
        ...(endpoint === 'similar'
          ? {
              similar_items: {
                content_id: 'similar-content',
                items: [recommendation],
              },
            }
          : { [endpoint!]: [outfit] }),
      },
    };
  });

beforeEach(() => {
  vi.resetAllMocks();
  respond();
});

describe('v2 related-items service', () => {
  it('calls all three endpoints by default and preserves event IDs through mapping', async () => {
    const response = await fetch();
    expect(urls().map(url => url.pathname)).toEqual([
      '/api/v2/items/outfits',
      '/api/v2/items/partner_outfits',
      '/api/v2/items/similar',
    ]);
    const mapped = mapRelatedItemsApiResponse(
      response,
      ResponseFormat.Detailed
    );
    expect(mapped.outfits![0].response_id).toBe('outfits-event');
    expect(mapped.partner_outfits![0].response_id).toBe(
      'partner_outfits-event'
    );
    expect(mapped.similar_items!.response_id).toBe('similar-event');
    expect(mapped.outfits![0].items.map(item => item.id)).toEqual([
      'ITEM-1',
      'ITEM-2',
    ]);
    expect(response.garment_data).toHaveLength(2);
  });

  it.each([
    [RelatedItemsMethod.Outfits, 'outfits'],
    [RelatedItemsMethod.PartnerOutfits, 'partner_outfits'],
    [RelatedItemsMethod.SimilarItems, 'similar'],
  ])('fetches only selected method %s', async (method, endpoint) => {
    await fetch({ methods: method });
    expect(get).toHaveBeenCalledTimes(1);
    expect(urls()[0].pathname).toBe(`/api/v2/items/${endpoint}`);
  });

  it('deduplicates requested methods and handles encoded identifiers', async () => {
    await getRelatedItems(
      domain,
      { methods: 'similar_items,similar_items' },
      'A/B +&?',
      null
    );
    expect(get).toHaveBeenCalledTimes(1);
    expect(urls()[0].searchParams.get('id')).toBe('A/B +&?');
    expect(urls()[0].pathname).toBe('/api/v2/items/similar');
  });

  it('sends only supported parameters to each operation', async () => {
    await fetch({
      methods: 'outfits,similar_items',
      max_similar_items: '12',
      outfits_per_occasion: '3',
      max_reduced_by: '50',
      try_all_methods: 'false',
      identifier_type: 'ean',
    });
    const [outfits, similar] = urls();
    for (const url of urls()) {
      expect(url.searchParams.get('garment_format')).toBe('detailed');
      expect(url.searchParams.get('include_fashion_ids')).toBe('true');
      expect(url.searchParams.get('exclude_source_garment')).toBe(
        url.pathname.endsWith('/similar') ? 'true' : 'false'
      );
      expect(url.searchParams.get('identifier_type')).toBe('gtin');
      expect(url.searchParams.get('max_reduced_by')).toBe('50');
      expect(url.searchParams.has('methods')).toBe(false);
      expect(url.searchParams.has('try_all_methods')).toBe(false);
      expect(url.searchParams.has('max_similar_items')).toBe(false);
    }
    expect(outfits.searchParams.get('outfits_per_occasion')).toBe('3');
    expect(outfits.searchParams.has('max_items')).toBe(false);
    expect(similar.searchParams.get('max_items')).toBe('12');
    expect(similar.searchParams.has('outfits_per_occasion')).toBe(false);
  });

  it.each([
    ['dressipi-id', 'fashion-id'],
    ['ean', 'gtin'],
    ['sku', 'sku'],
    ['product-code', 'product-code'],
  ])('maps identifier %s to %s', async (identifier_type, expected) => {
    await fetch({ methods: 'outfits', identifier_type });
    expect(urls()[0].searchParams.get('identifier_type')).toBe(expected);
  });

  it('uses the JWT header for consented requests and no credentials for anonymous requests', async () => {
    await fetch({ methods: 'outfits' });
    expect(get.mock.calls[0][1]?.headers).toEqual({
      'x-dressipi-jwt': mockCredentials.access_token,
    });
    await getRelatedItems(domain, { methods: 'outfits' }, 'ITEM-1', null);
    expect(get.mock.calls[1][1]?.headers).toEqual({});
  });

  it('tries the remaining methods only when explicit fallback is enabled and selected groups are empty', async () => {
    get.mockResolvedValueOnce({
      data: { event_id: 'empty', source: null, garment_data: [], outfits: [] },
    });
    const result = await fetch({ methods: 'outfits', try_all_methods: 'true' });
    expect(get).toHaveBeenCalledTimes(3);
    expect(result.partner_outfits).toHaveLength(1);
    expect(result.source).toEqual(source);
  });

  it('does not fall back for nonempty results or try_all_methods=false', async () => {
    await fetch({ methods: 'outfits', try_all_methods: 'true' });
    expect(get).toHaveBeenCalledTimes(1);
    get.mockResolvedValueOnce({
      data: { event_id: 'empty', source: null, garment_data: [], outfits: [] },
    });
    await fetch({ methods: 'outfits', try_all_methods: 'false' });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it.each([401, 403])(
    'preserves authentication refresh errors (%s)',
    async status => {
      get.mockRejectedValue({ response: { status } });
      await expect(fetch()).rejects.toBeInstanceOf(AuthenticationError);
    }
  );

  it('maps unresolved sources (422) to the existing not-found result', async () => {
    get.mockRejectedValue({
      response: {
        status: 422,
        data: { error: { message: 'Unresolved source' } },
      },
    });
    await expect(fetch()).rejects.toBeInstanceOf(
      RelatedItemsGarmentNotFoundError
    );
  });

  it.each([undefined, {}, { error: 'Unexpected error' }, { error: null }])(
    'handles unexpected error bodies without a parsing failure',
    async data => {
      get.mockRejectedValue({
        message: 'Network Error',
        response: { status: 500, data },
      });
      await expect(fetch()).rejects.toThrow(
        'An error occurred while fetching the related items: Network Error'
      );
    }
  );

  it('fails the combined request if any selected operation fails', async () => {
    get.mockRejectedValueOnce(new Error('Unavailable'));
    await expect(fetch()).rejects.toThrow('Unavailable');
  });

  it('rejects unknown methods before making requests', async () => {
    await expect(fetch({ methods: 'unknown' })).rejects.toThrow(
      'Unknown related items method'
    );
    expect(get).not.toHaveBeenCalled();
  });
});

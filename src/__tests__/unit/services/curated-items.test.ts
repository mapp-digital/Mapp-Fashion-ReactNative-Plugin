import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationError } from '../../../errors/AuthenticationError';
import { getBasketItems, getTopItems } from '../../../services/curated-items';
import { mockCredentials } from '../../test-utils/mock-data';
import {
  garments,
  recommendation,
  source,
} from '../../test-utils/recommendation-v2-data';

const get = vi.mocked(axios.get);
const topResponse = {
  event_id: 'top-event',
  garment_data: [...garments].reverse(),
  top_items: { content_id: 'top-content', items: [source, recommendation] },
};
const basketResponse = {
  event_id: 'basket-event',
  garment_data: [...garments].reverse(),
  recommendations: [{ garment_id: 'ITEM-1' }, { garment_id: 'ITEM-2' }],
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Top and Basket v2 services', () => {
  it('maps top recommendations and sends supported query values and JWT', async () => {
    get.mockResolvedValue({ data: topResponse });
    const mapped = await getTopItems(
      'fashion.example',
      {
        department: 'male',
        max_items: 12,
        max_reduced_by: 50,
        excluded_ids: ['A/B', 'C&D'],
        locale: 'UK',
        language: 'en',
      },
      mockCredentials
    );
    const url = new URL(get.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v2/items/top');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      garment_format: 'detailed',
      include_fashion_ids: 'true',
      department: 'male',
      max_items: '12',
      max_reduced_by: '50',
      excluded_ids: 'A/B,C&D',
      locale: 'UK',
      language: 'en',
    });
    expect(get.mock.calls[0][1]?.headers).toEqual({
      'x-dressipi-jwt': mockCredentials.access_token,
    });
    expect(mapped.response_id).toBe('top-event');
    expect(mapped.content_id).toBe('top-content');
    expect(mapped.items.map(item => item.id)).toEqual(['ITEM-1', 'ITEM-2']);
  });

  it('maps basket items without raw IDs, in response order, and preserves optional user data', async () => {
    const user = { first_name: null, style_quiz_complete: false };
    get.mockResolvedValue({ data: { ...basketResponse, user } });
    const mapped = await getBasketItems(
      'fashion.example',
      {
        ids: ['A/B', 'C&D'],
        excluded_ids: ['X'],
        identifier_type: 'sku',
        sort: 'price',
        direction: 'asc',
        include_user_data: false,
      },
      null
    );
    const url = new URL(get.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v2/items/basket');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      garment_format: 'detailed',
      ids: 'A/B,C&D',
      excluded_ids: 'X',
      identifier_type: 'sku',
      sort: 'price',
      direction: 'asc',
      include_user_data: 'false',
    });
    expect(get.mock.calls[0][1]?.headers).toEqual({});
    expect(mapped.response_id).toBe('basket-event');
    expect(mapped.items.map(item => item.dressipi_item_id)).toEqual([1, 2]);
    expect(mapped.user).toEqual(user);
    expect(mapped).not.toHaveProperty('content_id');
  });

  it('accepts an empty basket and empty recommendations', async () => {
    get.mockResolvedValue({
      data: { event_id: 'empty', garment_data: [], recommendations: [] },
    });
    expect(
      await getBasketItems(
        'fashion.example',
        { ids: [], excluded_ids: [] },
        null
      )
    ).toEqual({ response_id: 'empty', items: [] });
    expect(new URL(get.mock.calls[0][0]).searchParams.has('ids')).toBe(false);
  });

  it('accepts empty top recommendations', async () => {
    get.mockResolvedValue({
      data: {
        ...topResponse,
        garment_data: [],
        top_items: { content_id: 'empty', items: [] },
      },
    });
    expect(await getTopItems('fashion.example', {}, null)).toEqual({
      response_id: 'top-event',
      content_id: 'empty',
      items: [],
    });
  });

  it('does not invent stock or outfit availability when basket metadata omits them', async () => {
    get.mockResolvedValue({
      data: {
        ...basketResponse,
        garment_data: garments.map(item => ({
          ...item,
          garment_status: undefined,
          has_outfits: undefined,
        })),
      },
    });
    const mapped = await getBasketItems('fashion.example', {}, null);
    expect(mapped.items[0].status).toBeUndefined();
    expect(mapped.items[0].has_outfits).toBeUndefined();
  });

  it('joins an aliased basket reference by an unambiguous style ID', async () => {
    get.mockResolvedValue({
      data: {
        ...basketResponse,
        recommendations: [{ garment_id: 'FEED-ALIAS', product_id: 'STYLE-2' }],
      },
    });
    const mapped = await getBasketItems('fashion.example', {}, null);
    expect(mapped.items[0].dressipi_item_id).toBe(2);
  });

  it('refuses an ambiguous style match instead of attributing an item to the wrong variant', async () => {
    get.mockResolvedValue({
      data: {
        ...basketResponse,
        garment_data: garments.map(item => ({
          ...item,
          product_id: 'SHARED-STYLE',
        })),
        recommendations: [
          { garment_id: 'UNKNOWN', product_id: 'SHARED-STYLE' },
        ],
      },
    });
    await expect(getBasketItems('fashion.example', {}, null)).rejects.toThrow(
      'Item with ID UNKNOWN not found'
    );
  });

  it.each([getTopItems, getBasketItems])(
    'preserves auth and service failures',
    async fetchItems => {
      get.mockRejectedValue({ response: { status: 401 } });
      await expect(
        fetchItems('fashion.example', {}, mockCredentials)
      ).rejects.toBeInstanceOf(AuthenticationError);
      get.mockRejectedValue(new Error('Unavailable'));
      await expect(fetchItems('fashion.example', {}, null)).rejects.toThrow(
        'Unavailable'
      );
      get.mockRejectedValue({
        response: { status: 404 },
        message: 'No recommender available',
      });
      await expect(fetchItems('fashion.example', {}, null)).rejects.toThrow(
        'No recommender available'
      );
    }
  );
});

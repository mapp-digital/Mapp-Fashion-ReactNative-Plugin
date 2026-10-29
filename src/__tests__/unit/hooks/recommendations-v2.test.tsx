import React, { useState } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBasketItems,
  useTopItems,
  useFacettedSearch,
  useRelatedItems,
  RelatedItemsMethod,
} from '../../../index';
import { DressipiContext } from '../../../context/DressipiContext';
import { ComplianceContext } from '../../../context/ComplianceContext';
import { mockCredentials } from '../../test-utils/mock-data';
import {
  facettedResponse,
  garments,
  outfit,
  recommendation,
  source,
} from '../../test-utils/recommendation-v2-data';

const get = vi.mocked(axios.get);
const post = vi.mocked(axios.post);
let consent: boolean | null;
let credentials: typeof mockCredentials | null;
const refreshAuthentication = vi.fn();
const topData = {
  event_id: 'top-event',
  garment_data: garments,
  top_items: { content_id: 'top-content', items: [recommendation] },
};
const basketData = {
  event_id: 'basket-event',
  garment_data: garments,
  recommendations: [recommendation],
};
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ComplianceContext.Provider
    value={{ hasConsented: consent, isLoading: false, setConsent: vi.fn() }}
  >
    <DressipiContext.Provider
      value={
        { credentials, domain: 'fashion.example', refreshAuthentication } as any
      }
    >
      {children}
    </DressipiContext.Provider>
  </ComplianceContext.Provider>
);

beforeEach(() => {
  vi.resetAllMocks();
  consent = true;
  credentials = mockCredentials;
  get.mockImplementation(async url => ({
    data: url.includes('/top?') ? topData : basketData,
  }));
  post.mockResolvedValue({ data: facettedResponse });
});

describe('public v2 recommendation hooks', () => {
  it.each([useTopItems, useBasketItems])(
    'fetches and maps results through the public hook',
    async useItems => {
      const { result, rerender } = renderHook(() => useItems(), { wrapper });
      await waitFor(() =>
        expect(result.current.items?.items[0].id).toBe('ITEM-2')
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      rerender();
      expect(get).toHaveBeenCalledTimes(1);
    }
  );

  it('wires basket IDs and top parameters through both hooks', async () => {
    const { result } = renderHook(
      () => ({
        top: useTopItems({ department: 'male' }),
        basket: useBasketItems({ ids: ['ITEM-1'], include_user_data: true }),
      }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.top.items).not.toBeNull());
    await waitFor(() => expect(result.current.basket.items).not.toBeNull());
    expect(
      get.mock.calls.map(([url]) => new URL(url).searchParams.get('ids'))
    ).toContain('ITEM-1');
    expect(
      get.mock.calls.map(([url]) => new URL(url).searchParams.get('department'))
    ).toContain('male');
  });

  it.each([useTopItems, useBasketItems])(
    'waits for consent and credentials, then supports anonymous fetching',
    async useItems => {
      consent = null;
      const { result, rerender } = renderHook(() => useItems(), { wrapper });
      expect(get).not.toHaveBeenCalled();
      consent = true;
      credentials = null;
      rerender();
      expect(get).not.toHaveBeenCalled();
      consent = false;
      rerender();
      await waitFor(() => expect(result.current.items).not.toBeNull());
      expect(get.mock.calls[0][1]?.headers).toEqual({});
    }
  );

  it('refetches changed input and ignores late results from a previous request', async () => {
    let finishOld: (value: any) => void;
    get.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishOld = resolve;
        })
    );
    const { result, rerender } = renderHook(
      ({ department }) => useTopItems({ department }),
      {
        wrapper,
        initialProps: { department: 'female' as 'female' | 'male' },
      }
    );
    rerender({ department: 'male' });
    await waitFor(() =>
      expect(result.current.items?.response_id).toBe('top-event')
    );
    await act(async () => {
      finishOld!({ data: { ...topData, event_id: 'old-event' } });
    });
    expect(result.current.items?.response_id).toBe('top-event');
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('switches to anonymous requests when consent is withdrawn', async () => {
    const { result, rerender } = renderHook(() => useBasketItems(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.items).not.toBeNull());
    consent = false;
    rerender();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(get.mock.calls[1][1]?.headers).toEqual({});
  });

  it('refreshes credentials and retries with the new JWT', async () => {
    get.mockRejectedValueOnce({ response: { status: 401 } });
    const rotatingWrapper = ({ children }: { children: React.ReactNode }) => {
      const [currentCredentials, setCredentials] = useState(mockCredentials);
      refreshAuthentication.mockImplementation(async () => {
        setCredentials({ ...mockCredentials, access_token: 'fresh-token' });
      });
      return (
        <ComplianceContext.Provider
          value={{ hasConsented: true, isLoading: false, setConsent: vi.fn() }}
        >
          <DressipiContext.Provider
            value={
              {
                credentials: currentCredentials,
                domain: 'fashion.example',
                refreshAuthentication,
              } as any
            }
          >
            {children}
          </DressipiContext.Provider>
        </ComplianceContext.Provider>
      );
    };
    const { result } = renderHook(() => useTopItems(), {
      wrapper: rotatingWrapper,
    });
    await waitFor(() =>
      expect(result.current.items?.response_id).toBe('top-event')
    );
    expect(refreshAuthentication).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[1][1]?.headers).toEqual({
      'x-dressipi-jwt': 'fresh-token',
    });
  });

  it('finishes with an error if refresh fails or leaves credentials unchanged', async () => {
    get.mockRejectedValue({ response: { status: 401 } });
    refreshAuthentication.mockResolvedValue(undefined);
    const { result } = renderHook(() => useBasketItems(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(refreshAuthentication).toHaveBeenCalledTimes(1);
  });

  it('passes facetted pagination attribution through the existing hook', async () => {
    const { result } = renderHook(
      () =>
        useFacettedSearch({
          page: 2,
          root_event_id: 'first-page',
          facets: [{ name: 'price', filters: [{ from: 0, to: 50 }] }],
        }),
      { wrapper }
    );
    await waitFor(() =>
      expect(result.current.items?.content_id).toBe('search-content')
    );
    expect(post.mock.calls[0][1]).toEqual({
      filters: { min_price: 0, max_price: 50 },
      root_event_id: 'first-page',
    });
  });

  it('combines selected related-item methods with their own attribution IDs', async () => {
    get.mockImplementation(async url => ({
      data: {
        event_id: url.includes('/outfits?') ? 'outfit-event' : 'similar-event',
        source,
        garment_data: garments,
        ...(url.includes('/outfits?')
          ? { outfits: [outfit] }
          : {
              similar_items: {
                content_id: 'similar-content',
                items: [recommendation],
              },
            }),
      },
    }));
    const { result } = renderHook(
      () =>
        useRelatedItems({
          item_id: 'ITEM-1',
          methods: [
            RelatedItemsMethod.Outfits,
            RelatedItemsMethod.SimilarItems,
          ],
        }),
      { wrapper }
    );
    await waitFor(() =>
      expect(result.current.relatedItems?.similar_items?.response_id).toBe(
        'similar-event'
      )
    );
    expect(result.current.relatedItems?.outfits?.[0].response_id).toBe(
      'outfit-event'
    );
    expect(get).toHaveBeenCalledTimes(2);
  });
});

it.each([useTopItems, useBasketItems])(
  'reports a failed credential refresh',
  async useItems => {
    get.mockRejectedValue({ response: { status: 401 } });
    refreshAuthentication.mockRejectedValue(new Error('Refresh failed'));
    const { result } = renderHook(() => useItems(), { wrapper });
    await waitFor(() =>
      expect(result.current.error?.message).toBe('Refresh failed')
    );
    expect(result.current.loading).toBe(false);
    expect(refreshAuthentication).toHaveBeenCalledTimes(1);
  }
);

it('keeps both migrated hooks anonymous when consent is declined', async () => {
  consent = false;
  get.mockResolvedValue({
    data: {
      event_id: 'related',
      source,
      garment_data: garments,
      outfits: [outfit],
    },
  });
  const { result } = renderHook(
    () => ({
      related: useRelatedItems({
        item_id: 'ITEM-1',
        methods: RelatedItemsMethod.Outfits,
      }),
      search: useFacettedSearch(),
    }),
    { wrapper }
  );
  await waitFor(() =>
    expect(result.current.related.relatedItems).not.toBeNull()
  );
  await waitFor(() => expect(result.current.search.items).not.toBeNull());
  expect(get.mock.calls[0][1]?.headers).toEqual({});
  expect(post.mock.calls[0][2]?.headers).not.toHaveProperty('x-dressipi-jwt');
});

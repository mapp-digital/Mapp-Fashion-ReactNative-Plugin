import AsyncStorage from '@react-native-async-storage/async-storage';
import { newTracker, removeTracker } from '@snowplow/react-native-tracker';
import { trackerCore } from '@snowplow/tracker-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTracker } from '../../../tracking/tracker';

const native = {
  trackSelfDescribingEvent: vi.fn(),
  trackPageViewEvent: vi.fn(),
};
let controller: AbortController;
let payloads: Record<string, unknown>[];

beforeEach(() => {
  vi.clearAllMocks();
  controller = new AbortController();
  payloads = [];
  vi.mocked(newTracker).mockImplementation(async config => {
    const core = trackerCore({
      callback: payload => payloads.push(payload.build()),
    });
    config.plugins?.forEach(plugin => plugin.activateCorePlugin?.(core));
    return native as any;
  });
});
afterEach(() => controller.abort());

const create = () =>
  createTracker(
    'shop',
    'collector.example',
    'synthetic-user',
    controller.signal
  );

describe('Snowplow 4 adapter', () => {
  it('preserves routing, identity and base64 encoding', async () => {
    await create();
    expect(newTracker).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'dressipi',
        appId: 'shop',
        endpoint: 'https://collector.example',
        eventMethod: 'post',
        postPath: '/t/t',
        encodeBase64: true,
        networkUserId: 'synthetic-user',
        lifecycleAutotracking: true,
        platformContext: true,
        sessionContext: true,
        screenContext: true,
        deepLinkContext: true,
        installAutotracking: true,
      })
    );
  });

  it('does not initialize without an identity or after cancellation', async () => {
    expect(
      await createTracker('shop', 'collector.example', null, controller.signal)
    ).toBeNull();
    controller.abort();
    expect(await create()).toBeNull();
    expect(newTracker).not.toHaveBeenCalled();
  });

  it('preserves custom event and page-view arguments', async () => {
    const tracker = await create();
    const event = {
      schema: 'iglu:com.dressipi/item_view/jsonschema/1-0-0',
      data: { item: { sku: 'sku-1' } },
    };
    tracker!.trackSelfDescribingEvent(event);
    tracker!.trackPageViewEvent({
      pageUrl: '/products',
      pageTitle: 'Products',
      referrer: '/home',
    });
    expect(native.trackSelfDescribingEvent).toHaveBeenCalledWith(
      event,
      undefined
    );
    expect(native.trackPageViewEvent).toHaveBeenCalledWith({
      pageUrl: '/products',
      pageTitle: 'Products',
      referrer: '/home',
    });
  });

  it('emits legacy transaction fields without changing totalValue/taxValue API', async () => {
    const tracker = await create();
    tracker!.trackEcommerceTransactionEvent({
      orderId: 'order-1',
      totalValue: 25,
      taxValue: 3,
      shipping: 2,
      affiliation: 'shop',
      city: 'London',
      state: 'London',
      country: 'GB',
      currency: 'GBP',
      items: [
        {
          sku: 'sku-1',
          price: 10,
          quantity: 2,
          name: 'Shirt',
          category: 'Tops',
          currency: 'GBP',
        },
      ],
    });
    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toMatchObject({
      e: 'ti',
      ti_id: 'order-1',
      ti_sk: 'sku-1',
      ti_pr: 10,
      ti_qu: 2,
      ti_nm: 'Shirt',
      ti_ca: 'Tops',
      ti_cu: 'GBP',
    });
    expect(payloads[1]).toMatchObject({
      e: 'tr',
      tr_id: 'order-1',
      tr_tt: 25,
      tr_tx: 3,
      tr_sh: 2,
      tr_af: 'shop',
      tr_ci: 'London',
      tr_st: 'London',
      tr_co: 'GB',
      tr_cu: 'GBP',
    });
  });

  it('disables retained callbacks and transport after withdrawal', async () => {
    const tracker = await create();
    const config = vi.mocked(newTracker).mock.calls[0][0];
    controller.abort();
    tracker!.trackPageViewEvent({ pageUrl: '/late' });
    tracker!.trackEcommerceTransactionEvent({
      orderId: 'late',
      totalValue: 1,
      items: [],
    });
    expect(native.trackPageViewEvent).not.toHaveBeenCalled();
    expect(payloads).toHaveLength(0);
    expect(removeTracker).toHaveBeenCalledWith('dressipi');
    await expect(config.customFetch!({} as Request)).rejects.toThrow(
      'Fashion tracking stopped'
    );
  });

  it('clears only Fashion storage after pending writes and blocks late writes', async () => {
    await create();
    const storage = vi.mocked(newTracker).mock.calls[0][0].asyncStorage!;
    await storage.setItem('queue', 'synthetic-event');
    controller.abort();
    await storage.setItem('queue', 'late-event');
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      'fashion:dressipi:queue',
    ]);
  });

  it('removes an initialization that finishes after cancellation', async () => {
    let finish!: (value: any) => void;
    vi.mocked(newTracker).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const pending = create();
    await vi.waitFor(() => expect(newTracker).toHaveBeenCalledOnce());
    controller.abort();
    finish(native);
    expect(await pending).toBeNull();
    expect(removeTracker).toHaveBeenCalledWith('dressipi');
  });

  it('finishes cancelled initialization before starting a replacement', async () => {
    let finish!: (value: any) => void;
    vi.mocked(newTracker).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const first = create();
    await vi.waitFor(() => expect(newTracker).toHaveBeenCalledOnce());
    controller.abort();
    const replacement = new AbortController();
    try {
      const second = createTracker(
        'shop',
        'collector.example',
        'user-2',
        replacement.signal
      );
      expect(newTracker).toHaveBeenCalledOnce();
      finish(native);
      expect(await first).toBeNull();
      expect(await second).not.toBeNull();
      expect(newTracker).toHaveBeenCalledTimes(2);
      expect(removeTracker).toHaveBeenCalledTimes(1);
    } finally {
      replacement.abort();
    }
  });

  it('handles initialization failure', async () => {
    vi.mocked(newTracker).mockRejectedValueOnce(new Error('unavailable'));
    expect(await create()).toBeNull();
  });
});

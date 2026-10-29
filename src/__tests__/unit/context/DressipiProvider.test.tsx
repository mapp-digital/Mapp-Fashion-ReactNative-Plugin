import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DressipiProvider } from '../../../context/DressipiProvider';
import { useDressipiTracking } from '../../../hooks/useDressipiTracking';
import { useAuth } from '../../../hooks/useAuth';
import { useCompliance } from '../../../hooks/useCompliance';
import {
  abortForConsentWithdrawal,
  createTracker,
} from '../../../tracking/tracker';

vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useCompliance');
vi.mock('../../../tracking/tracker', () => ({
  abortForConsentWithdrawal: vi.fn((controller: AbortController) =>
    controller.abort()
  ),
  createTracker: vi.fn(),
}));
const storage = {
  getItem: vi.fn().mockResolvedValue(null),
  removeCredentials: vi.fn(),
} as any;
const tracker = {
  trackSelfDescribingEvent: vi.fn(),
  trackPageViewEvent: vi.fn(),
  trackEcommerceTransactionEvent: vi.fn(),
};
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DressipiProvider
    namespaceId="shop"
    clientId="client"
    domain="collector.example"
    storage={storage}
  >
    {children}
  </DressipiProvider>
);
const loggingWrapper = ({ children }: { children: React.ReactNode }) => (
  <DressipiProvider
    namespaceId="shop"
    clientId="client"
    domain="collector.example"
    storage={storage}
    enableLogging={true}
  >
    {children}
  </DressipiProvider>
);
const consent = (hasConsented: boolean | null) =>
  vi
    .mocked(useCompliance)
    .mockReturnValue({ hasConsented, isLoading: false, setConsent: vi.fn() });
const identity = (networkUserId: string | null) =>
  vi.mocked(useAuth).mockReturnValue({
    networkUserId,
    credentials: null,
    refresh: vi.fn(),
  } as any);

beforeEach(() => {
  vi.clearAllMocks();
  consent(true);
  identity('user-1');
  vi.mocked(createTracker).mockResolvedValue(tracker);
});

describe('tracker lifecycle', () => {
  it.each(['item_view', 'item_click_pdp'])(
    'preserves the %s parentPageViewId while queued and when later dispatched',
    async eventName => {
      identity(null);
      const { result, rerender } = renderHook(useDressipiTracking, {
        wrapper: loggingWrapper,
      });
      const parentPageViewId = '44ff586f-ac79-4810-bbac-146f49f02f9c';
      await act(async () => {
        if (eventName === 'item_view')
          result.current.productDisplayPage({
            product_code: 'prod-1',
            sku: 'sku-1',
            parentPageViewId,
          });
        else
          result.current.itemClickPdp({
            request_id: 'request',
            related_items_set_id: 'set',
            dressipi_item_id: 123,
            parentPageViewId,
          });
      });
      const queued = vi
        .mocked(console.info)
        .mock.calls.find(([message]) =>
          String(message).includes(
            `${eventName} QUEUED parentPageViewId=${parentPageViewId}`
          )
        );
      expect(queued).toBeDefined();
      expect(JSON.parse(queued![1])).toMatchObject({
        status: 'QUEUED',
        parentPageViewId,
        reason: 'tracker_not_ready',
      });
      expect(createTracker).not.toHaveBeenCalled();
      expect(tracker.trackSelfDescribingEvent).not.toHaveBeenCalled();

      identity('user-1');
      rerender();
      await waitFor(() =>
        expect(tracker.trackSelfDescribingEvent).toHaveBeenCalledOnce()
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `${eventName} DISPATCHED parentPageViewId=${parentPageViewId}`
        ),
        expect.any(String)
      );
      expect(tracker.trackSelfDescribingEvent.mock.calls[0][1][0].data.id).toBe(
        parentPageViewId
      );
    }
  );

  it('logs null for a missing parent context on a direct tracker handoff', async () => {
    const { result } = renderHook(useDressipiTracking, {
      wrapper: loggingWrapper,
    });
    await act(async () => {});
    await act(async () => {
      result.current.itemClickPdp({
        request_id: 'request',
        dressipi_item_id: 123,
      });
    });
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'item_click_pdp DISPATCHED parentPageViewId=null'
      ),
      expect.any(String)
    );
    expect(tracker.trackSelfDescribingEvent.mock.calls[0]).toHaveLength(1);
  });

  it('explains the missing tracking identity without exposing credentials', async () => {
    // A valid OAuth subject does not establish a Snowplow network user ID.
    const accessToken = `header.${btoa(JSON.stringify({ sub: '94173', exp: Date.now() / 1000 + 3600 }))}.signature`;
    vi.mocked(useAuth).mockReturnValue({
      networkUserId: null,
      credentials: {
        access_token: accessToken,
        refresh_token: 'private-refresh-token',
      },
      refresh: vi.fn(),
    } as any);
    const { result, rerender } = renderHook(useDressipiTracking, {
      wrapper: loggingWrapper,
    });
    rerender();
    const warnings = vi
      .mocked(console.warn)
      .mock.calls.filter(([message]) =>
        String(message).includes('Tracking is waiting:')
      );
    expect(warnings).toHaveLength(1);
    expect(JSON.parse(warnings[0][1])).toEqual({
      status: 'BLOCKED',
      reason: 'missing_network_user_id',
    });
    expect(JSON.stringify(warnings)).not.toContain('private-');
    expect(JSON.stringify(warnings)).not.toContain(accessToken);
    await act(async () => {
      result.current.itemClickPdp({
        request_id: 'request',
        dressipi_item_id: 123,
        parentPageViewId: 'source-page',
      });
    });
    const entry = vi
      .mocked(console.info)
      .mock.calls.find(([message]) =>
        String(message).includes(
          'item_click_pdp QUEUED parentPageViewId=source-page reason=missing_network_user_id'
        )
      );
    expect(entry).toBeDefined();
    expect(JSON.parse(entry![1])).toMatchObject({
      parentPageViewId: 'source-page',
      reason: 'missing_network_user_id',
    });
    expect(JSON.stringify(entry)).not.toContain(accessToken);
    expect(createTracker).not.toHaveBeenCalled();
  });

  it('keeps SDK handoff logs disabled when logging is off', async () => {
    identity(null);
    const { result } = renderHook(useDressipiTracking, { wrapper });
    await act(async () => {
      result.current.itemClickPdp({
        request_id: 'request',
        dressipi_item_id: 123,
        parentPageViewId: 'source-page',
      });
    });
    expect(console.info).not.toHaveBeenCalled();
  });

  it.each([null, false])(
    'queues events with consent %s and sends them after consent (as in 0.1.x)',
    async value => {
      consent(value);
      const { result, rerender } = renderHook(useDressipiTracking, { wrapper });
      await act(async () => {
        result.current.pageView({ pageUrl: '/before-consent' });
      });
      expect(createTracker).not.toHaveBeenCalled();
      consent(true);
      rerender();
      await waitFor(() =>
        expect(tracker.trackPageViewEvent).toHaveBeenCalledWith({
          pageUrl: '/before-consent',
        })
      );
      expect(createTracker).toHaveBeenCalledOnce();
    }
  );

  it('queues consented events while authentication and initialization are pending', async () => {
    identity(null);
    let finish!: (value: any) => void;
    vi.mocked(createTracker).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const { result, rerender } = renderHook(useDressipiTracking, { wrapper });
    await act(async () => {
      result.current.pageView({ pageUrl: '/pending-auth' });
    });
    identity('user-1');
    rerender();
    await act(async () => {
      result.current.pageView({ pageUrl: '/pending-tracker' });
    });
    await act(async () => {
      finish(tracker);
    });
    expect(tracker.trackPageViewEvent.mock.calls).toEqual([
      [{ pageUrl: '/pending-auth' }],
      [{ pageUrl: '/pending-tracker' }],
    ]);
  });

  it('keeps a queued click tied to its source page after navigating', async () => {
    identity(null);
    const { result, rerender } = renderHook(useDressipiTracking, { wrapper });
    const sourceId = '44ff586f-ac79-4810-bbac-146f49f02f9c';
    const destinationId = '55ff586f-ac79-4810-bbac-146f49f02f9c';
    await act(async () => {
      result.current.pageView({ pageUrl: '/pdp/source', pageViewId: sourceId });
      result.current.itemClickPdp({
        request_id: 'request',
        related_items_set_id: 'set',
        dressipi_item_id: 123,
        parentPageViewId: sourceId,
      });
      result.current.pageView({
        pageUrl: '/pdp/destination',
        pageViewId: destinationId,
      });
    });
    expect(tracker.trackSelfDescribingEvent).not.toHaveBeenCalled();
    identity('user-1');
    rerender();
    await waitFor(() =>
      expect(tracker.trackSelfDescribingEvent).toHaveBeenCalledOnce()
    );
    const sourceContext = [
      {
        schema: 'iglu:com.snowplowanalytics.snowplow/web_page/jsonschema/1-0-0',
        data: { id: sourceId },
      },
    ];
    expect(tracker.trackPageViewEvent).toHaveBeenNthCalledWith(
      1,
      { pageUrl: '/pdp/source' },
      sourceContext
    );
    expect(tracker.trackSelfDescribingEvent).toHaveBeenCalledWith(
      {
        schema: 'iglu:com.dressipi/item_click_pdp/jsonschema/1-0-0',
        data: {
          request_id: 'request',
          related_items_set_id: 'set',
          dressipi_item_id: 123,
        },
      },
      sourceContext
    );
    expect(tracker.trackPageViewEvent.mock.calls[1][1][0].data.id).toBe(
      destinationId
    );
    expect(tracker.trackPageViewEvent.mock.invocationCallOrder[0]).toBeLessThan(
      tracker.trackSelfDescribingEvent.mock.invocationCallOrder[0]
    );
    expect(
      tracker.trackSelfDescribingEvent.mock.invocationCallOrder[0]
    ).toBeLessThan(tracker.trackPageViewEvent.mock.invocationCallOrder[1]);
  });

  it('on withdrawal, keeps pending events and queues new ones until re-consent', async () => {
    const { result, rerender, unmount } = renderHook(useDressipiTracking, {
      wrapper,
    });
    await waitFor(() => expect(createTracker).toHaveBeenCalledOnce());
    await act(async () => {});
    const signal = vi.mocked(createTracker).mock.calls[0][3];
    consent(false);
    rerender();
    expect(signal.aborted).toBe(true);
    expect(vi.mocked(abortForConsentWithdrawal).mock.calls[0][0].signal).toBe(
      signal
    );
    await act(async () => {
      result.current.pageView({ pageUrl: '/while-withdrawn' });
    });
    expect(tracker.trackPageViewEvent).not.toHaveBeenCalled();
    expect(createTracker).toHaveBeenCalledOnce();
    consent(true);
    rerender();
    await waitFor(() =>
      expect(tracker.trackPageViewEvent).toHaveBeenCalledWith({
        pageUrl: '/while-withdrawn',
      })
    );
    const replacementSignal = vi.mocked(createTracker).mock.calls[1][3];
    unmount();
    expect(replacementSignal.aborted).toBe(true);
    expect(abortForConsentWithdrawal).toHaveBeenCalledOnce();
  });

  it('queues an event still being built when consent is withdrawn', async () => {
    const { result, rerender } = renderHook(useDressipiTracking, { wrapper });
    await act(async () => {});
    const pending = result.current.pageView({ pageUrl: '/in-flight' });
    consent(false);
    rerender();
    await act(async () => {
      await pending;
    });
    expect(tracker.trackPageViewEvent).not.toHaveBeenCalled();
    consent(true);
    rerender();
    await waitFor(() =>
      expect(tracker.trackPageViewEvent).toHaveBeenCalledWith({
        pageUrl: '/in-flight',
      })
    );
  });

  it('aborts the previous identity before replacing its tracker', async () => {
    const { rerender } = renderHook(useDressipiTracking, { wrapper });
    await waitFor(() => expect(createTracker).toHaveBeenCalledOnce());
    const signal = vi.mocked(createTracker).mock.calls[0][3];
    identity('user-2');
    rerender();
    expect(signal.aborted).toBe(true);
    expect(abortForConsentWithdrawal).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(createTracker).toHaveBeenCalledWith(
        'shop',
        'collector.example',
        'user-2',
        expect.any(AbortSignal),
        expect.any(Object)
      )
    );
  });
});

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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { newTracker, removeTracker } from '@snowplow/react-native-tracker';
import type { ReactNativeTracker } from '@snowplow/react-native-tracker';
import {
  buildEcommerceTransaction,
  buildEcommerceTransactionItem,
} from '@snowplow/tracker-core';
import type { TrackerCore } from '@snowplow/tracker-core';
import type {
  OrderEventPayload,
  PageViewEventPayload,
} from '../types/tracking';
import { Log } from '../utils/logger';

const snowplowNamespace =
  process.env.EXPO_PUBLIC_SNOWPLOW_TRACKER_NAMESPACE || 'dressipi';

export type FashionTracker = {
  trackSelfDescribingEvent: ReactNativeTracker['trackSelfDescribingEvent'];
  trackPageViewEvent: (event: PageViewEventPayload) => void;
  trackEcommerceTransactionEvent: (event: OrderEventPayload) => void;
};

// Serialize initialization so a cancelled effect cannot remove its replacement.
let initialization: Promise<unknown> = Promise.resolve();
let cleanup: Promise<void> = Promise.resolve();

export const createTracker = (
  appId: string,
  domain: string,
  networkUserId: string | null,
  signal: AbortSignal,
  application?: { appVersion?: string; appBuild?: string }
): Promise<FashionTracker | null> => {
  const initialize = async (): Promise<FashionTracker | null> => {
    await cleanup;
    if (!networkUserId || signal.aborted) return null;

    let failed = false;
    const stopped = () => signal.aborted || failed;
    let tracker: ReactNativeTracker | undefined;
    let core: TrackerCore | undefined;
    const storageKeys = new Set<string>();
    let storageWork = Promise.resolve();
    const storageKey = (key: string) => {
      const scoped = `fashion:${snowplowNamespace}:${key}`;
      storageKeys.add(scoped);
      return scoped;
    };
    const clearStorage = () => {
      storageWork = storageWork
        .catch(() => {})
        .then(async () => {
          await AsyncStorage.multiRemove([...storageKeys]);
        });
      return storageWork;
    };
    const stop = () => {
      if (tracker) removeTracker(snowplowNamespace);
      cleanup = clearStorage();
      void cleanup.catch(() => {
        Log.warn('Could not clear tracker storage', 'tracker.ts');
      });
    };
    signal.addEventListener('abort', stop, { once: true });

    try {
      tracker = await newTracker({
        namespace: snowplowNamespace,
        appId,
        endpoint: `https://${domain}`,
        eventMethod: 'post',
        postPath: '/t/t',
        encodeBase64: true,
        networkUserId,
        platformContext: true,
        sessionContext: true,
        deepLinkContext: true,
        screenContext: true,
        installAutotracking: true,
        lifecycleAutotracking: true,
        ...application,
        asyncStorage: {
          getItem: async key => {
            const scoped = storageKey(key);
            await storageWork;
            return stopped() ? null : AsyncStorage.getItem(scoped);
          },
          setItem: (key, value) => {
            const scoped = storageKey(key);
            storageWork = storageWork.then(async () => {
              if (!stopped()) await AsyncStorage.setItem(scoped, value);
            });
            return storageWork;
          },
        },
        customFetch: async (request, options) => {
          if (stopped()) throw new Error('Fashion tracking stopped');
          // Preserve the emitter timeout while aborting on consent withdrawal.
          const controller = new AbortController();
          const abort = () => controller.abort();
          signal.addEventListener('abort', abort, { once: true });
          request.signal?.addEventListener('abort', abort, { once: true });
          if (request.signal?.aborted) controller.abort();
          try {
            return await fetch(request, {
              ...options,
              signal: controller.signal,
            });
          } finally {
            signal.removeEventListener('abort', abort);
            request.signal?.removeEventListener('abort', abort);
          }
        },
        plugins: [
          {
            activateCorePlugin: value => {
              core = value;
            },
          },
        ],
      });

      if (signal.aborted) {
        removeTracker(snowplowNamespace);
        cleanup = clearStorage();
        await cleanup;
        return null;
      }

      return {
        trackSelfDescribingEvent: (event, contexts) => {
          if (!signal.aborted)
            tracker!.trackSelfDescribingEvent(event, contexts);
        },
        trackPageViewEvent: ({ pageUrl, pageTitle, referrer }) => {
          if (!signal.aborted) {
            tracker!.trackPageViewEvent({ pageUrl, pageTitle, referrer });
          }
        },
        trackEcommerceTransactionEvent: order => {
          if (signal.aborted || !core) return;
          // Preserve v2 JS legacy ti/tr events rather than changing order schemas.
          for (const item of order.items) {
            core.track(
              buildEcommerceTransactionItem({ ...item, orderId: order.orderId })
            );
          }
          core.track(
            buildEcommerceTransaction({
              orderId: order.orderId,
              total: order.totalValue,
              affiliation: order.affiliation,
              tax: order.taxValue,
              shipping: order.shipping,
              city: order.city,
              state: order.state,
              country: order.country,
              currency: order.currency,
            })
          );
        },
      };
    } catch (error) {
      failed = true;
      signal.removeEventListener('abort', stop);
      core?.deactivate();
      cleanup = clearStorage();
      await cleanup.catch(() => {});
      Log.error('Failed to create Snowplow tracker', 'tracker.ts', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  };
  const result = initialization.then(initialize);
  initialization = result.catch(() => {});
  return result;
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { newTracker, removeTracker } from '@snowplow/react-native-tracker';
import type { ReactNativeTracker } from '@snowplow/react-native-tracker';
import {
  buildEcommerceTransaction,
  buildEcommerceTransactionItem,
} from '@snowplow/tracker-core';
import type { TrackerCore } from '@snowplow/tracker-core';
import { Dimensions, PixelRatio } from 'react-native';
import type {
  OrderEventPayload,
  PageViewEventPayload,
} from '../types/tracking';
import { Log } from '../utils/logger';

const snowplowNamespace =
  process.env.EXPO_PUBLIC_SNOWPLOW_TRACKER_NAMESPACE || 'dressipi';

// React Native's AbortController polyfill drops abort reasons, so withdrawal
// is recorded separately from the abort itself.
const withdrawals = new WeakSet<AbortSignal>();

/**
 * Stops a tracker because consent was withdrawn. As in 0.1.x, events Snowplow
 * already holds are still delivered and its stored queue and session are kept;
 * a plain `controller.abort()` discards them.
 */
export const abortForConsentWithdrawal = (controller: AbortController) => {
  withdrawals.add(controller.signal);
  controller.abort();
};

export type FashionTracker = {
  trackSelfDescribingEvent: ReactNativeTracker['trackSelfDescribingEvent'];
  trackPageViewEvent: (event: PageViewEventPayload) => void;
  trackEcommerceTransactionEvent: (event: OrderEventPayload) => void;
};

export type TrackerOptions = {
  appVersion?: string;
  appBuild?: string;
};

/**
 * Device details Snowplow 2 read natively and Snowplow 4 does not:
 * physical resolution, locale and time zone.
 */
const deviceDetails = () => {
  try {
    const { width, height } = Dimensions.get('screen');
    const scale = PixelRatio.get();
    const [shortSide, longSide] = [width, height]
      .map(side => Math.round(side * scale))
      .sort((a, b) => a - b);
    const { locale, timeZone } = Intl.DateTimeFormat().resolvedOptions();
    return {
      resolution: [shortSide, longSide] as [number, number],
      portrait: height >= width,
      locale,
      timeZone,
    };
  } catch {
    return undefined;
  }
};

// Serialize initialization so a cancelled effect cannot remove its replacement.
let initialization: Promise<unknown> = Promise.resolve();
let cleanup: Promise<void> = Promise.resolve();

export const createTracker = (
  appId: string,
  domain: string,
  networkUserId: string | null,
  signal: AbortSignal,
  application: TrackerOptions = {}
): Promise<FashionTracker | null> => {
  const initialize = async (): Promise<FashionTracker | null> => {
    await cleanup;
    if (!networkUserId || signal.aborted) return null;

    let failed = false;
    const withdrawn = () => withdrawals.has(signal);
    // After withdrawal, storage and delivery keep working for pending events.
    const stopped = () => (signal.aborted && !withdrawn()) || failed;
    let tracker: ReactNativeTracker | undefined;
    let core: TrackerCore | undefined;
    const storageKeys = new Set<string>();
    let storageWork = Promise.resolve();
    const device = deviceDetails();
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
    const detach = async () => {
      try {
        await tracker?.flush();
      } catch {
        Log.warn('Could not deliver pending events', 'tracker.ts');
      }
      if (tracker) removeTracker(snowplowNamespace);
    };
    const stop = () => {
      if (withdrawn()) {
        cleanup = detach();
        return;
      }
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
        ...(device
          ? {
              language: device.locale,
              timezone: device.timeZone,
              screenResolution: device.resolution,
              platformContextRetriever: {
                getResolution: async () => device.resolution.join('x'),
                isPortrait: async () => device.portrait,
                getLanguage: async () => device.locale,
              },
            }
          : {}),
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
          // Preserve the emitter timeout; cancel on any abort except withdrawal.
          const controller = new AbortController();
          const abort = () => controller.abort();
          const cancel = () => {
            if (!withdrawn()) abort();
          };
          signal.addEventListener('abort', cancel, { once: true });
          request.signal?.addEventListener('abort', abort, { once: true });
          if (request.signal?.aborted) controller.abort();
          try {
            return await fetch(request, {
              ...options,
              signal: controller.signal,
            });
          } finally {
            signal.removeEventListener('abort', cancel);
            request.signal?.removeEventListener('abort', abort);
          }
        },
        plugins: [
          {
            activateCorePlugin: value => {
              core = value;
            },
            // Snowplow 2 sent the network user ID as tnuid; 4.x sends nuid.
            beforeTrack: payload => {
              payload.add('tnuid', networkUserId);
            },
          },
        ],
      });

      if (signal.aborted) {
        removeTracker(snowplowNamespace);
        if (!withdrawn()) {
          cleanup = clearStorage();
          await cleanup;
        }
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

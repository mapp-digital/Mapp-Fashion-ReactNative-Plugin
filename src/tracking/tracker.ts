import type { ReactNativeTracker } from '@snowplow/react-native-tracker';
import { createTracker as createSnowplowTracker } from '@snowplow/react-native-tracker';
import { Log } from '../utils/logger';

/**
 * The namespace for the Snowplow tracker.
 */
const snowplowNamespace: string =
  process.env.EXPO_PUBLIC_SNOWPLOW_TRACKER_NAMESPACE || 'dressipi';

/**
 * Base configuration for the Snowplow React Native Tracker.
 */
const baseTrackerConfiguration = {
  applicationContext: true,
  platformContext: true,
  sessionContext: true,
  deepLinkContext: true,
  screenContext: true,
  screenViewAutotracking: true,
  installAutotracking: true,
  exceptionAutotracking: false,
};

/**
 * Creates a tracker instance from the Snowplow React Native Tracker.
 * This function should only be called when the user has consented to data tracking.
 *
 * @param appId - The application ID for the tracker. This will be the
 * namespace ID from the Provider.
 * @param domain - The domain for the tracker.
 * @param networkUserId - The user ID for the tracker.
 * @return {ReactNativeTracker} A Snowplow React Native Tracker instance or
 * null if the networkUserId is not provided.
 */
export const createTracker = (
  appId: string,
  domain: string,
  networkUserId: string | null
): ReactNativeTracker | null => {
  /**
   * If the networkUserId is not provided, we cannot create a tracker.
   */
  if (!networkUserId) {
    Log.warn('Cannot create tracker - networkUserId is null', 'tracker.ts', {
      appId,
      domain,
    });
    return null;
  }

  Log.info(
    'Creating Snowplow tracker - user has consented to tracking',
    'tracker.ts',
    {
      appId,
      domain,
      snowplowNamespace,
      networkUserId,
    }
  );

  try {
    /**
     * Create a Snowplow tracker instance with the provided
     * application ID, domain, and network user ID.
     * The tracker will be configured with the base tracker configuration.
     */
    const tracker = createSnowplowTracker(
      snowplowNamespace,
      {
        endpoint: `https://${domain}`,
        customPostPath: '/t/t',
      },
      {
        trackerConfig: {
          appId,
          ...baseTrackerConfiguration,
        },
        /**
         * This might not work, but we'll keep it anyway, it doesn't break
         * anything.
         */
        ...(networkUserId
          ? { subjectConfig: { networkUserId: networkUserId } }
          : {}),
      }
    );

    /**
     * This one really works.
     */
    if (networkUserId) {
      tracker.setNetworkUserId(networkUserId);
    }

    Log.info('Successfully created Snowplow tracker', 'tracker.ts', {
      appId,
      domain,
    });

    return tracker;
  } catch (error) {
    Log.error('Failed to create Snowplow tracker', 'tracker.ts', {
      appId,
      domain,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

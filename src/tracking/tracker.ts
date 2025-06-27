import type { ReactNativeTracker } from '@snowplow/react-native-tracker';
import { createTracker as createSnowplowTracker } from '@snowplow/react-native-tracker';

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
    return null;
  }

  /**
   * Create a Snowplow tracker instance with the provided
   * application ID, domain, and network user ID.
   * The tracker will be configured with the base tracker configuration.
   */
  return createSnowplowTracker(
    snowplowNamespace,
    {
      endpoint: `https://${domain}`,
    },
    {
      trackerConfig: {
        appId,
        ...baseTrackerConfiguration,
      },
      subjectConfig: {
        networkUserId: networkUserId,
      },
    }
  );
};

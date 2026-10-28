import type { FashionTracker } from '../tracking/tracker';
import type { ReactNode } from 'react';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCompliance } from '../hooks/useCompliance';
import { KeyChainAdapter } from '../keychain/KeyChainAdapter';
import { abortForConsentWithdrawal, createTracker } from '../tracking/tracker';
import { ProviderProps } from '../types/context';
import { Queue, QueueableEvents, QueuedEvent } from '../types/tracking';
import { Log } from '../utils/logger';
import { logTrackingEvent } from '../utils/trackingLogging';
import { ComplianceProvider } from './ComplianceProvider';
import { DressipiContext } from './DressipiContext';

/**
 * Inner component that provides the DressipiContext and handles conditional authentication
 * based on user consent. This component has access to the ComplianceContext.
 */
const DressipiContextProvider = ({
  children,
  namespaceId,
  domain,
  clientId,
  storageAdapter,
  appVersion,
  appBuild,
}: {
  children: ReactNode;
  namespaceId: string;
  domain: string;
  clientId: string;
  storageAdapter: any;
  appVersion?: string;
  appBuild?: string;
}) => {
  /**
   * Create a reference object to the queue of events
   * to be sent to the tracker.
   */
  const queue: RefObject<Queue<QueueableEvents>> = useRef<
    Queue<QueueableEvents>
  >([]);

  /**
   * Access the compliance context to check if user has consented
   */
  const { hasConsented } = useCompliance();

  /**
   * Effect to clean up credentials when consent is denied
   */
  useEffect(() => {
    const cleanupCredentials = async () => {
      if (hasConsented === false) {
        try {
          Log.info(
            'User consent denied - removing stored credentials',
            'DressipiProvider.tsx'
          );
          await storageAdapter.removeCredentials(domain);
        } catch (error) {
          Log.warn(
            'Failed to remove credentials after consent denial',
            'DressipiProvider.tsx',
            { error: error instanceof Error ? error.message : String(error) }
          );
        }
      }
    };

    cleanupCredentials();
  }, [hasConsented, domain, storageAdapter]);

  /**
   * Only call useAuth if user has consented (hasConsented === true)
   * If consent is false or null, we skip authentication entirely
   */
  const shouldAuthenticate = hasConsented === true;

  /**
   * Conditionally use the useAuth hook based on consent status
   * When user hasn't consented, we provide default values
   */
  const authResult = useAuth(
    shouldAuthenticate ? clientId : '',
    shouldAuthenticate ? domain : '',
    shouldAuthenticate ? storageAdapter : null,
    shouldAuthenticate // Add this parameter to control authentication
  );

  /**
   * If user hasn't consented, provide null values for auth-related data
   */
  const { networkUserId, credentials, refresh } = shouldAuthenticate
    ? authResult
    : {
        networkUserId: null,
        credentials: null,
        refresh: () => Promise.resolve(),
      };

  /**
   * Latest consent value, read when the tracker effect is cleaned up to tell
   * consent withdrawal apart from identity/configuration changes and unmount.
   */
  const consentRef = useRef(hasConsented);
  consentRef.current = hasConsented;

  const [tracker, setTracker] = useState<FashionTracker | null>(null);

  const hasCredentials = Boolean(credentials);
  useEffect(() => {
    if (shouldAuthenticate && hasCredentials && !networkUserId) {
      Log.warn(
        'Tracking is waiting: no network user ID is available from the token subn claim or the saved identity for this profile. Events remain queued.',
        'Fashion Tracking',
        { status: 'BLOCKED', reason: 'missing_network_user_id' }
      );
      // Also make already queued events visible after a development refresh.
      queue.current.forEach(event =>
        logTrackingEvent(event, 'QUEUED', 'missing_network_user_id')
      );
    }
  }, [shouldAuthenticate, hasCredentials, networkUserId]);

  useEffect(() => {
    const controller = new AbortController();
    setTracker(null);
    if (shouldAuthenticate && networkUserId) {
      void createTracker(
        namespaceId,
        domain,
        networkUserId,
        controller.signal,
        {
          appVersion,
          appBuild,
        }
      )
        .then(value => {
          if (!controller.signal.aborted) setTracker(value);
        })
        .catch(() => {
          Log.warn('Tracker initialization failed', 'DressipiProvider.tsx');
        });
    }
    return () => {
      // As in 0.1.x, withdrawal keeps the event queue and lets Snowplow
      // deliver what it already holds.
      if (consentRef.current === true) controller.abort();
      else abortForConsentWithdrawal(controller);
    };
  }, [
    namespaceId,
    domain,
    networkUserId,
    shouldAuthenticate,
    appVersion,
    appBuild,
  ]);

  useEffect(() => {
    /**
     * If the tracker instance is created successfully,
     * process queued events and return the tracker. Otherwise, return null.
     */
    if (!tracker) return;

    /**
     * Retrieve the queued events from the queue.
     */
    const eventsToProcess: QueuedEvent<QueueableEvents>[] = [...queue.current];

    /**
     * Clear the queue after processing the events.
     * This ensures that the queue is empty for future events.
     */
    queue.current = [];

    /**
     * Process the queued events by iterating over each event
     * and calling the corresponding method of the tracker instance.
     * Each queued event contains the event name and the data to be sent.
     */
    eventsToProcess.forEach((queuedEvent: QueuedEvent<QueueableEvents>) => {
      (tracker[queuedEvent.event] as Function).apply(tracker, queuedEvent.data);
      logTrackingEvent(queuedEvent, 'DISPATCHED');
    });
  }, [tracker]);

  return (
    <DressipiContext.Provider
      value={{
        namespaceId,
        domain,
        clientId,
        tracker: shouldAuthenticate ? tracker : null,
        // As in 0.1.x, events are queued before consent and while rejected,
        // and sent once the user consents.
        queue,
        credentials,
        refreshAuthentication: refresh,
      }}
    >
      {children}
    </DressipiContext.Provider>
  );
};

/**
 * The DressipiProvider component is a React context provider
 * that initializes and provides the Snowplow tracker instance,
 * authentication credentials, and a queue for events to be sent.
 *
 * Authentication is now conditional on user consent - it only happens
 * if the user has explicitly consented to data usage.
 *
 * @param {ProviderProps} props - The properties for the provider.
 * @returns {JSX.Element} The DressipiContext provider.
 */
export const DressipiProvider = ({
  children,
  namespaceId,
  domain,
  clientId,
  enableLogging = false,
  logTokens = false,
  storage = new KeyChainAdapter(),
  defaultConsent,
  appVersion,
  appBuild,
}: ProviderProps) => {
  /**
   * Use the provided storage adapter instance.
   * This adapter will be used for securely storing and retrieving credentials.
   */
  const storageAdapter = useMemo(() => storage, [storage]);

  /**
   * Initialize the logging system.
   * Logging is controlled via the enableLogging prop.
   * If enableLogging is true, the Log class will log messages to the console.
   * Otherwise, logging will be disabled.
   */
  Log.init(enableLogging, logTokens);

  /**
   * The DressipiProvider component provides the DressipiContext
   * to its children. It wraps children with ComplianceProvider for user consent management,
   * and the inner DressipiContextProvider handles conditional authentication based on consent.
   */
  return (
    <ComplianceProvider
      storageAdapter={storageAdapter}
      defaultConsent={defaultConsent}
    >
      <DressipiContextProvider
        namespaceId={namespaceId}
        domain={domain}
        clientId={clientId}
        storageAdapter={storageAdapter}
        appVersion={appVersion}
        appBuild={appBuild}
      >
        {children}
      </DressipiContextProvider>
    </ComplianceProvider>
  );
};

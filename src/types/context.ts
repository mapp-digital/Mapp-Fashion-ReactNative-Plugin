import { ReactNativeTracker } from '@snowplow/react-native-tracker';
import { PropsWithChildren, RefObject } from 'react';
import { AuthCredentials } from './auth';
import { Queue, QueueableEvents } from './tracking';

/**
 * Interface representing the configuration for the state 
 * of the Dressipi context.
 */
export type ContextConfiguration = {
  namespaceId: string;
  domain: string;
  clientId: string;
  tracker: ReactNativeTracker | null;
  queue: RefObject<Queue<QueueableEvents> | null> | null;
  credentials: AuthCredentials | null;
  refreshAuthentication: () => void;
};

/**
 * Additional properties required for the Dressipi context provider.
 */
type ProviderAdditionalProps = {
  namespaceId: string;
  domain: string;
  clientId: string;
};

/**
 * Props for the Dressipi context provider.
 */
export type ProviderProps = PropsWithChildren<ProviderAdditionalProps>;

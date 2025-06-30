/**
 * @module Dressipi
 *
 * This module provides the main entry point for the Dressipi application.
 *
 * It exports the DressipiContext and DressipiProvider components.
 *
 * The DressipiContext is used to provide configuration and state management
 * for the Dressipi application, while the DressipiProvider is a React component
 * that wraps the application and provides the context to its children.
 */

/**
 * Exports the DressipiContext, which is a React context
 * that provides configuration and state management
 * for the Dressipi application.
 */
export { DressipiProvider } from './context/DressipiProvider';

/**
 * Exports the useDressipiTracking hook for tracking user interactions events.
 */
export { useDressipiTracking } from './hooks/useDressipiTracking';

/**
 * Exports all tracking hooks for various user interactions
 * such as adding to basket, identifying users, tracking orders,
 * and tracking product display and list page views.
 */
export * from './hooks/tracking';

/**
 * Exports the useRelatedItems hook for fetching related items
 * based on a given request.
 */
export { useRelatedItems } from './hooks/useRelatedItems';

/**
 * Exports the RelatedItemsMethod enum, which defines the methods
 * that can be used to fetch related items.
 */
export { RelatedItemsMethod } from './enums/RelatedItemsMethod';

/**
 * Exports several types related to the related items feature.
 */
export type {
  Outfit,
  RelatedItemsApiRequest,
  RelatedItemsMappedResponse,
} from './types/related-items';

/**
 * Exports the useFacettedSearch hook for performing a facetted search
 * based on a given request.
 */
export { useFacettedSearch } from './hooks/useFacettedSearch';

/**
 * Exports several types related to the facetted search feature.
 */
export type {
  FacettedSearchApiRequest,
  FacettedSearchMappedResponse,
} from './types/facetted-search';

/**
 * Exports the DetailedItem type, which represents
 * an item with all its properties in the Dressipi application.
 */
export type { DetailedItem } from './types/shared';

/**
 * Exports the StorageType enum for specifying which storage adapter to use.
 */
export { StorageType } from './enums/StorageType';

/**
 * Exports the KeyChainAdapter class, which is a secure storage adapter
 * that uses the Keychain API to store and retrieve data.
 */
export { KeyChainAdapter } from './keychain/KeyChainAdapter';

/**
 * Exports the useCompliance hook for managing user data tracking consent.
 */
export { useCompliance } from './hooks/useCompliance';

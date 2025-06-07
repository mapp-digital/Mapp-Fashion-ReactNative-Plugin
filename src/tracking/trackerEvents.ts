import type { EcommerceTransactionProps } from '@snowplow/react-native-tracker';
import CryptoJS from 'crypto-js';
import { isNil, omitBy } from 'lodash-es';
import snakecaseKeys from "snakecase-keys";
import { Identification, ProductListPageEvent, QueueableEvents, QueuedEvent, TrackingItem } from '../types/tracking';

/**
 * Create a queued event for tracking an order.
 * 
 * @param order - The order details to be tracked.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to a queued event object.
 */
export const order = async (
  order: EcommerceTransactionProps
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackEcommerceTransactionEvent',
    data: [order],
  }
};

/**
 * Creates a queued event for tracking an "add to basket" action.
 * 
 * @param item - The item added to the basket, containing properties like sku, quantity, etc.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to a queued event object.
 */
export const addToBasket = async (
  item: TrackingItem
): Promise<QueuedEvent<QueueableEvents>> => {
  /**
   * Validates the item object to ensure it contains the required properties
   * for tracking an "add to basket" event.
   */
  if (!item.sku || !item.quantity) {
    throw new Error(
      "Dressipi addToBasket event requires a `sku` and quantity to be provided. This is the style+variant+size identifier and must match the product feed."
    );
  }

  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema: "iglu:com.snowplowanalytics.snowplow/add_to_cart/jsonschema/1-0-0",
        data: {
          sku: item.sku,
          name: item.name,
          category: item.category,
          unitPrice: item.price,
          quantity: item.quantity,
          currency: item.currency
        }
      }
    ],
  };
};

/**
 * Creates a queued event for tracking an "remove from basket" action.
 * 
 * @param item - The item removed from the basket.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to a queued event object.
 */
export const removeFromBasket = async (
  item: TrackingItem
): Promise<QueuedEvent<QueueableEvents>> => {
  /**
   * Validates the item object to ensure it contains the required properties
   * for tracking an "remove from basket" event.
   */
  if (!item.sku || !item.quantity) {
    throw new Error(
      "Dressipi removeFromBasket event requires a `sku` and quantity to be provided. This is the style+variant+size identifier and must match the product feed."
    );
  }

  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema: "iglu:com.snowplowanalytics.snowplow/remove_from_cart/jsonschema/1-0-0",
        data: {
          sku: item.sku,
          name: item.name,
          category: item.category,
          unitPrice: item.price,
          quantity: item.quantity,
          currency: item.currency
        }
      }
    ],
  };
};

/**
 * Creates a queued event for tracking a product list page view.
 * 
 * @param event - The product list page event containing page number, items, and filters.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to a queued event object.
 */
export const productListPageView = async (
  event: ProductListPageEvent
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema: 'iglu:com.dressipi/listings_view/jsonschema/1-0-0',
        data: {
          page: {
            number: event.page.number,
          },
          items: event.items.map((item) => snakecaseKeys(item)),
          filters: event.filters,
        }
      }
    ],
  }
};

/**
 * Creates a queued event for tracking a product detail page view.
 * 
 * @param item - The item being viewed on the product detail page.
 * @returns {Promise<QueuedEvent<QueueableEvents>>} A promise that resolves to a queued event object.
 */
export const productDetailPageView = async (
  item: TrackingItem
): Promise<QueuedEvent<QueueableEvents>> => {
  return {
    event: 'trackSelfDescribingEvent',
    data: [
      {
        schema: 'iglu:com.dressipi/item_view/jsonschema/1-0-0',
        data: omitBy({
          product_code: item.productCode,
          sku: item.sku,
          price: item.price,
          currency: item.currency,
          barcode: item.barcode,
          size: item.size,
          item_name: item.name,
          item_brand: item.brand,
        }, isNil)
      }
    ],
  }
};

/**
 * Creates a queued event for identifying a user.
 * 
 * @param namespaceId - The namespace ID used for hashing the email.
 */
export const identify = (namespaceId: string) => 
  async (data: Identification): Promise<QueuedEvent<QueueableEvents>> => {    
    /**
     * If the data object does not contain either an email or customerId,
     * throw an error indicating that at least one of these identifiers is required.
     */
    if (!data || !data.customerId || !data.email) {
      throw new Error(
        'Dressipi identify event requires either an `email` or `customerId` to be provided.'
      );
    }

    /**
     * Create identifiers array by processing each data entry.
     * For emails (containing '@'), hash them with namespaceId.
     * For other values, use them directly.
     */
    const identifiers = Object.entries(data).map(([key, value]) => {
      if (value.indexOf('@') === -1) {
        // Not an email - use value directly
        return { key, value };
      }
      
      // Email detected - hash it with namespaceId for privacy
      const hashedValue = CryptoJS.SHA256(value + '_' + namespaceId).toString();
      return { key, value: hashedValue };
    });

    return {
      event: 'trackSelfDescribingEvent',
      data: [
        {
          schema: 'iglu:com.dressipi/identify/jsonschema/1-0-0',
          data: {
            identifiers,
          },
        },
      ],
    };
  }

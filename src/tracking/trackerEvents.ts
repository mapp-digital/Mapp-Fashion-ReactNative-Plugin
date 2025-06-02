import type { EcommerceTransactionProps } from '@snowplow/react-native-tracker';
import { isNil, omitBy } from 'lodash-es';
import { sha256 } from "react-native-sha256";
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
     * 
     * The identifiers object is created by iterating over the data object,
     * where each key-value pair is transformed into a promise that resolves
     * to an object containing the key and a value (hashed, if it's an email).
     */
    const identifiers = Object.entries(data).reduce((acc, [key, value]) => {
      /**
       * If the value does not contain an '@' character, 
       * it is likely not a valid email.
       */
      if (value.indexOf('@') === -1) {
        /**
         * In this case, we set as a promise to be resolved immediately 
         * with the key and value.
         */
        acc[key] = Promise.resolve({ key, value });

        return acc;
      }

      /**
       * If the value is a valid email, we hash it using sha256
       * and append the namespaceId to ensure uniqueness.
       */
      acc[key] = sha256(value + '_' + namespaceId)
        .then((hashed: string) => ({ key, value: hashed }));

      return acc;
    }, {} as Record<string, Promise<{ key: string; value: string }>>);

    /**
     * We wait for all promises in the identifiers object to resolve.
     */
    const resolvedIdentifiers = await Promise.all(
      Object.values(identifiers)
    );

    return {
      event: 'trackSelfDescribingEvent',
      data: [
        {
          schema: 'iglu:com.dressipi/identify/jsonschema/1-0-0',
          data: {
            identifiers: resolvedIdentifiers,
          },
        },
      ],
    };
  }
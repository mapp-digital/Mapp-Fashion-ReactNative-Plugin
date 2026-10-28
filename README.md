# Dressipi React Native SDK

A React Native SDK that provides easy integration with Dressipi's fashion AI services, including related items discovery, facetted search, and tracking capabilities.

## Linking recommendations to their source page

From version 0.2.1, `itemClickPdp`, `itemClickQuickView`, and `tabClick` accept
optional `parentPageViewId`. Pass the source page's Snowplow `web_page` context
UUID. It is serialized as a context with `data.id`, not inside the Dressipi event
data. Existing calls without this field keep their existing payloads.

Generate a UUID once per page/screen visit, pass it as `pageViewId` to `pageView`,
and reuse it for interactions on that visit before navigating:

```tsx
const { pageView, itemClickPdp } = useDressipiTracking();
const pageViewId = uuid.v4(); // Once per visit, not once per render or click.
pageView({ pageUrl: '/pdp/603081121', pageViewId });

itemClickPdp({
  request_id: relatedItems.response_id, // API event_id
  related_items_set_id: outfit.content_id,
  dressipi_item_id: item.dressipi_item_id, // API raw_garment_id
  parentPageViewId: pageViewId,
});
```

The request ID, page context ID, and Snowplow event ID are separate identifiers.
The SDK preserves the explicit page context when events are queued. This uses
the Fashion SDK's Snowplow tracker and does not require Mapp Intelligence.
See [Mapp's recommendation tracking reference](https://docs.mapp.com/docs/recommendation-tracking-fashion).

## Table of Contents

- [Installation](#installation)
  - [Additional Dependencies](#additional-dependencies)
  - [Upgrading from 0.1.x](#upgrading-from-01x)
- [Quick Start](#quick-start)
- [Storage Configuration](#storage-configuration)
- [API Reference](#api-reference)
  - [DressipiProvider](#dressipiprovider)
  - [useRelatedItems](#userelateditems)
  - [useFacettedSearch](#usefacettedsearch)
  - [useCompliance](#usecompliance)
  - [Tracking](#tracking)
- [Debug Logging](#debug-logging)
- [Types](#types)
- [Examples](#examples)

## Installation

```bash
npm install mapp-fashion-react-native-sdk
```

### Additional Dependencies

This SDK requires React Native 0.85 or newer and React 19.2.3 or newer, plus the
following peer dependencies:

```bash
npm install @react-native-async-storage/async-storage@^2.0.0 react-native-get-random-values@^2.0.0
```

In Expo projects, let Expo choose the versions that match your SDK:

```bash
npx expo install @react-native-async-storage/async-storage react-native-get-random-values
```

The SDK includes the Snowplow tracker, so you don't need to install it yourself.
After adding these packages, rebuild your native app (including `pod install` on
iOS). `react-native-keychain` also still needs native linking.

### Upgrading from 0.1.x

Version 0.2.0 replaces Snowplow tracker 2.x with 4.x. The hooks and their arguments
are unchanged, but the installation changes:

1. Remove `@snowplow/react-native-tracker` from your app's dependencies. Fashion
   now installs the Snowplow version it needs.
2. Remove any `patch-package` patches for `@snowplow/react-native-tracker` 2.x
   (for example the Kotlin nullability patch).
3. Install the new peer dependencies (see [Additional Dependencies](#additional-dependencies)).
4. Pass your app's real version and build number to `DressipiProvider` with the
   `appVersion` and `appBuild` props. Snowplow 4 no longer reads them automatically.
5. Rebuild the native app.

Snowplow 2's stored device user ID, session history and unsent events are not
migrated: after upgrading, tracking starts with a new device user ID and its
session count starts again. The network user ID used to link a user's data is
kept, because it comes from Fashion's stored login.

Some tracking data also changes, which matters if you have reports built on
0.1.x data:

- automatic screen view events and the `screen` context are no longer sent;
- the device context has fewer fields (no carrier, network type, battery,
  storage or memory);
- the language is sent as a locale tag (`en-US` instead of `English`/`eng`);
- the network user ID is sent as `nuid` as well as `tnuid`;
- background/foreground events can be sent more often.

See [CHANGELOG.md](CHANGELOG.md) for all changes and known differences.

## Quick Start

### 1. Setup the Provider

Wrap your app with the `DressipiProvider` to initialize the SDK:

```tsx
import React from 'react';
import { DressipiProvider } from 'mapp-fashion-react-native-sdk';
import { YourAppComponent } from './YourAppComponent';

export default function App() {
  return (
    <DressipiProvider
      namespaceId="your-namespace-id"
      domain="your-domain.com"
      clientId="your-client-id"
      appVersion="1.0.0" // your app's real version
      appBuild="1" // your app's real build number
    >
      <YourAppComponent />
    </DressipiProvider>
  );
}
```

For an Expo setup, you need to install the [Expo Storage plugin](https://www.npmjs.com/package/mapp-fashion-react-native-sdk-expo).

### 2. Use the Hooks

Once wrapped with the provider, you can use the SDK hooks in any component:

```tsx
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import {
  useRelatedItems,
  useFacettedSearch,
  RelatedItemsMethod,
} from 'mapp-fashion-react-native-sdk';

export function ProductRecommendations({ productId }: { productId: string }) {
  // Get related items for a product
  const { relatedItems, loading, error } = useRelatedItems({
    item_id: productId,
    methods: [RelatedItemsMethod.Outfits, RelatedItemsMethod.SimilarItems],
  });

  // Perform facetted search
  const { items: searchResults } = useFacettedSearch({
    facets: [
      {
        name: 'garment_category',
        value: ['dresses', 'tops'],
      },
    ],
    per_page: 20,
  });

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      {relatedItems?.outfits && (
        <FlatList
          data={relatedItems.outfits}
          renderItem={({ item }) => (
            <Text>
              {item.occasion} - {item.items.length} items
            </Text>
          )}
        />
      )}
    </View>
  );
}
```

## Storage Configuration

The Dressipi SDK supports different secure storage solutions depending on your React Native environment. The SDK automatically defaults to the most commonly used option but allows you to explicitly choose your preferred storage method.

### Default Storage Behavior

By default, the SDK uses **React Native Keychain** (`react-native-keychain`) for secure credential storage. This works seamlessly in standard React Native applications without any additional configuration.

```tsx
import { DressipiProvider } from 'mapp-fashion-react-native-sdk';

// Uses React Native Keychain by default
<DressipiProvider
  namespaceId="your-namespace-id"
  domain="your-domain.com"
  clientId="your-client-id"
>
  <App />
</DressipiProvider>;
```

### Explicit Storage Configuration

For Expo applications or when you want to explicitly control the storage method, you can specify the `storage` prop:

```tsx
import { DressipiProvider } from 'mapp-fashion-react-native-sdk';
import { SecureStoreAdapter } from 'mapp-fashion-react-native-sdk-expo';

// Explicitly use Expo SecureStore for Expo applications
<DressipiProvider
  namespaceId="your-namespace-id"
  domain="your-domain.com"
  clientId="your-client-id"
  storage={new SecureStoreAdapter()}
>
  <App />
</DressipiProvider>;
```

### Storage Dependencies

Make sure you have the appropriate storage library installed for your chosen storage type:

#### For React Native Keychain (Default)

```bash
npm install react-native-keychain
# For iOS, run: cd ios && pod install
```

#### For Expo SecureStore

```bash
npm install expo-secure-store
```

### Storage Features

Both storage adapters provide identical functionality:

- **Secure Credential Storage**: OAuth tokens are stored securely using platform-native secure storage
- **Automatic Token Refresh**: Stored credentials are automatically used for token refresh operations
- **Cross-Session Persistence**: Credentials persist across app restarts and device reboots
- **Platform Security**: Leverages iOS Keychain and Android Keystore for maximum security

Tracking data is stored separately: the Snowplow tracker keeps its session and
event queue in AsyncStorage under keys starting with `fashion:dressipi:`
(`dressipi` is the tracker namespace; it can be changed with the
`EXPO_PUBLIC_SNOWPLOW_TRACKER_NAMESPACE` environment variable).

### Migration Between Storage Types

If you need to switch storage types (e.g., migrating from React Native to Expo), users will need to re-authenticate as credentials from different storage adapters are not automatically migrated.

## API Reference

### DressipiProvider

The main provider component that initializes the SDK and provides authentication and tracking capabilities.

#### Props

| Prop             | Type                   | Required | Description                                                                        |
| ---------------- | ---------------------- | -------- | ---------------------------------------------------------------------------------- |
| `namespaceId`    | `string`               | Yes      | Your Dressipi namespace identifier                                                 |
| `domain`         | `string`               | Yes      | Your Dressipi domain                                                               |
| `clientId`       | `string`               | Yes      | Your OAuth client ID for authentication                                            |
| `enableLogging`  | `boolean`              | No       | Enable debug logging for development (defaults to `false`)                         |
| `logTokens`      | `boolean`              | No       | Print access and refresh token fields when logging is enabled (defaults to `false`) |
| `storage`        | `SecureStorageAdapter` | No       | Custom storage adapter for credentials (defaults to KeyChain)                      |
| `defaultConsent` | `boolean`              | No       | Default consent value when user hasn't made a choice yet (defaults to `undefined`) |
| `appVersion`     | `string`               | No       | Your app's version, sent in the tracking application context                       |
| `appBuild`       | `string`               | No       | Your app's build number, sent in the tracking application context                  |
| `children`       | `ReactNode`            | Yes      | Your app components                                                                |

#### Features Provided

- **Authentication Management**: Automatically handles OAuth token lifecycle and refresh
- **Tracking Infrastructure**: Sets up Snowplow tracking for analytics
- **Event Queue**: Keeps tracking events in memory until the user has consented and the tracker is ready, then sends them
- **Global Configuration**: Provides configuration context to all child components

#### Example

```tsx
<DressipiProvider
  namespaceId="your-namespace-id"
  domain="api.dressipi.com"
  clientId="your-oauth-client-id"
>
  <App />
</DressipiProvider>
```

#### Default Consent Configuration

The `defaultConsent` prop allows you to set a default consent value for data usage when the user hasn't explicitly made a choice yet. This is useful for controlling the initial behavior of the SDK:

```tsx
// Default to allowing data usage (authentication enabled)
<DressipiProvider
  namespaceId="your-namespace-id"
  domain="api.dressipi.com"
  clientId="your-client-id"
  defaultConsent={true}
>
  <App />
</DressipiProvider>

// Default to not allowing data usage (authentication disabled)
<DressipiProvider
  namespaceId="your-namespace-id"
  domain="api.dressipi.com"
  clientId="your-client-id"
  defaultConsent={false}
>
  <App />
</DressipiProvider>
```

**Note:** The default value is only used when no stored consent preference exists. Once a user explicitly accepts or rejects consent via `useCompliance`, their choice is stored and takes precedence over the default.

---

### useRelatedItems

A hook for fetching related items, outfits, and similar products for a given item.

#### Parameters

`request: RelatedItemsApiRequest` - Configuration object for the related items request.

#### Returns

`RelatedItemsState` - An object containing the response data and request state.

| Property       | Type                                 | Description                                                                                                                      |
| -------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `relatedItems` | `RelatedItemsMappedResponse \| null` | The processed response data containing outfits, partner outfits, and similar items. `null` when no data is available or loading. |
| `loading`      | `boolean`                            | Indicates whether the request is currently in progress. `true` during API calls, `false` when completed or idle.                 |
| `error`        | `Error \| null`                      | Contains error information if the request fails. `null` when no error has occurred.                                              |

#### Request Parameters (RelatedItemsApiRequest)

| Property               | Type                         | Required | Description                                                                                          |
| ---------------------- | ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `item_id`              | `string`                     | Yes      | The item + variant identifier (style + color) that serves as the base for recommendations            |
| `methods`              | `RelatedItemsMethod[]`       | No       | Array specifying which recommendation types to fetch (`outfits`, `partner_outfits`, `similar_items`) |
| `response_format`      | `ResponseFormat`             | No       | Response format (defaults to `Detailed`) - controls the level of detail in the response              |
| `try_all_methods`      | `boolean`                    | No       | Whether to try all available methods if the specified methods don't return results                   |
| `outfits_per_occasion` | `number`                     | No       | Maximum number of outfits to return per occasion (e.g., work, casual, evening)                       |
| `max_similar_items`    | `number`                     | No       | Maximum number of similar items to return in the response                                            |
| `max_reduced_by`       | `number`                     | No       | Maximum discount percentage to include in results (filters out heavily discounted items)             |
| `identifier_type`      | `RelatedItemsIdentifierType` | No       | Type of identifier being used (affects how the item_id is interpreted)                               |

#### Response Data (RelatedItemsMappedResponse)

The `relatedItems` object contains the following properties:

- **`response_id`**: `string` - Unique identifier for this specific response (useful for tracking and analytics)
- **`outfits`**: `Outfit[] | undefined` - Array of complete outfit recommendations organized by occasion, each containing coordinated items
- **`partner_outfits`**: `Outfit[] | undefined` - Array of partner-specific outfit recommendations with specialized styling
- **`similar_items`**: `{ content_id: string; items: DetailedItem[]; } | undefined` - Object containing items similar to the requested product

#### Example

```tsx
import {
  useRelatedItems,
  RelatedItemsMethod,
} from 'mapp-fashion-react-native-sdk';

function ProductPage({ productId }: { productId: string }) {
  const { relatedItems, loading, error } = useRelatedItems({
    item_id: productId,
    methods: [RelatedItemsMethod.Outfits, RelatedItemsMethod.SimilarItems],
    outfits_per_occasion: 3,
    max_similar_items: 10,
  });

  if (loading) return <Text>Loading recommendations...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  if (!relatedItems) return <Text>No recommendations available</Text>;

  return (
    <View>
      {/* Render outfits */}
      {relatedItems.outfits?.map(outfit => (
        <View key={outfit.content_id}>
          <Text>Occasion: {outfit.occasion}</Text>
          {outfit.items.map(item => (
            <Text key={item.id}>
              {item.name} - {item.price}
            </Text>
          ))}
        </View>
      ))}

      {/* Render similar items */}
      {relatedItems.similar_items && (
        <View>
          <Text>Similar Items:</Text>
          {relatedItems.similar_items.items.map(item => (
            <Text key={item.id}>
              {item.name} by {item.brand_name}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
```

---

### useFacettedSearch

A hook for performing facetted search queries with filters and pagination.

#### Parameters

`request: FacettedSearchApiRequest` (optional, defaults to `{}`) - Configuration object for the search request.

#### Returns

`FacettedSearchState` - An object containing the search results and request state.

| Property  | Type                                   | Description                                                                                                              |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `items`   | `FacettedSearchMappedResponse \| null` | The processed search results containing filtered items and pagination info. `null` when no data is available or loading. |
| `loading` | `boolean`                              | Indicates whether the search request is currently in progress. `true` during API calls, `false` when completed or idle.  |
| `error`   | `Error \| null`                        | Contains error information if the search request fails. `null` when no error has occurred.                               |

#### Request Parameters (FacettedSearchApiRequest)

| Property          | Type             | Required | Description                                                                               |
| ----------------- | ---------------- | -------- | ----------------------------------------------------------------------------------------- |
| `facets`          | `Facet[]`        | No       | Array of search filters to apply (categories, brands, price ranges, etc.)                 |
| `response_format` | `ResponseFormat` | No       | Response format (defaults to `Detailed`) - controls the level of detail in returned items |
| `page`            | `number`         | No       | Page number for pagination (1-based indexing)                                             |
| `per_page`        | `number`         | No       | Number of items to return per page (controls pagination size)                             |

#### Facet Types

**Single Filter:**

```typescript
{
  name: 'garment_category',
  value: ['dresses', 'tops']
}
```

**Multiple Filters:**

```typescript
{
  name: 'price',
  filters: [
    { from: 50, to: 100 },
    { value: ['sale'] }
  ]
}
```

#### Available Facet Dimensions

- `garment_category`: Product categories (e.g., 'dresses', 'tops')
- `brand`: Brand names
- `occasion`: Occasions (e.g., 'work', 'evening')
- `must_have`: Must-have items
- `retailer_labels`: Retailer-specific labels
- `store`: Store identifiers
- `feature_ids`: Include specific features
- `not_feature_ids`: Exclude specific features
- `price`: Price ranges
- `reduced_by`: Discount percentages

#### Response Data (FacettedSearchMappedResponse)

The `items` object contains the following properties:

- **`response_id`**: `string` - Unique identifier for this specific search response (useful for tracking and analytics)
- **`content_id`**: `string` - Content identifier for tracking purposes and correlation with other API calls
- **`items`**: `DetailedItem[]` - Array of filtered products matching the search criteria with complete item information
- **`pagination`**: `object` - Pagination information with the following structure:
  - `current_page`: `number` - Current page number (1-based)
  - `last_page`: `number` - Total number of pages available
  - `total_items`: `number` - Total number of items matching the search criteria across all pages

#### Example

```tsx
import { useFacettedSearch } from 'mapp-fashion-react-native-sdk';

function SearchResults() {
  const { items, loading, error } = useFacettedSearch({
    facets: [
      {
        name: 'garment_category',
        value: ['dresses'],
      },
      {
        name: 'brand',
        value: ['Zara', 'H&M'],
      },
      {
        name: 'price',
        filters: [{ from: 30, to: 100 }],
      },
    ],
    per_page: 20,
    page: 1,
  });

  if (loading) return <Text>Searching...</Text>;
  if (error) return <Text>Search error: {error.message}</Text>;
  if (!items) return <Text>No results found</Text>;

  return (
    <View>
      <Text>
        Page {items.pagination.current_page} of {items.pagination.last_page}(
        {items.pagination.total_items} total items)
      </Text>

      <FlatList
        data={items.items}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.brand_name}</Text>
            <Text>{item.price}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}
```

### Tracking

The SDK provides comprehensive tracking capabilities through specialized hooks that automatically send analytics events to Dressipi's tracking system. These hooks enable you to track user interactions, shopping behaviors, and page views for better insights and personalization.

---

#### useDressipiAddToBasketTracking

Tracks when a user adds an item to their shopping basket.

**Event Tracked:** Snowplow `add_to_cart` (`iglu:com.snowplowanalytics.snowplow/add_to_cart/jsonschema/1-0-0`) - Records product additions to the shopping cart for conversion tracking and recommendation optimization.

**Parameters:**

- `item: AddToBasketEventPayload` - The item being added to the basket

**Usage:**

```tsx
import { useDressipiAddToBasketTracking } from 'mapp-fashion-react-native-sdk';

function ProductCard({ product }) {
  // Track add to basket when component mounts with item data
  useDressipiAddToBasketTracking({
    sku: '603081121',
    name: 'Product 603081121',
    category: '',
    unitPrice: 0.0,
    quantity: 1,
    currency: 'GBP',
  });

  return (
    <View>
      <Text>{product.name}</Text>
      <TouchableOpacity onPress={handleAddToBasket}>
        <Text>Add to Basket</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**AddToBasketEventPayload Type:**

```typescript
type AddToBasketEventPayload = {
  /**
   * The SKU of the item.
   */
  sku: string;
  /**
   * The name of the item.
   */
  name?: string;
  /**
   * The category of the item.
   */
  category?: string;
  /**
   * The price of the item.
   */
  unitPrice?: number;
  /**
   * The quantity of the item.
   */
  quantity: number;
  /**
   * The currency of the item.
   */
  currency?: string;
};
```

---

#### useDressipiRemoveFromBasketTracking

Tracks when a user removes an item from their shopping basket.

**Event Tracked:** Snowplow `remove_from_cart` (`iglu:com.snowplowanalytics.snowplow/remove_from_cart/jsonschema/1-0-0`) - Records product removals from the shopping cart for understanding user behavior and cart abandonment patterns.

**Parameters:**

- `item: RemoveFromBasketEventPayload` - The item being removed from the basket

**Usage:**

```tsx
import { useDressipiRemoveFromBasketTracking } from 'mapp-fashion-react-native-sdk';

function BasketItem({ item, onRemove }) {
  // Track remove from basket when component mounts with item data
  useDressipiRemoveFromBasketTracking({
    sku: '603081121',
    name: 'Product 603081121',
    category: '',
    unitPrice: 0.0,
    quantity: 1,
    currency: 'GBP',
  });

  return (
    <View>
      <Text>{item.name}</Text>
      <TouchableOpacity onPress={() => onRemove(item.id)}>
        <Text>Remove</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**RemoveFromBasketEventPayload Type:**

```typescript
type RemoveFromBasketEventPayload = {
  /**
   * The SKU of the item.
   */
  sku: string;
  /**
   * The name of the item.
   */
  name?: string;
  /**
   * The category of the item.
   */
  category?: string;
  /**
   * The price of the item.
   */
  unitPrice?: number;
  /**
   * The quantity of the item.
   */
  quantity: number;
  /**
   * The currency of the item.
   */
  currency?: string;
};
```

---

#### useDressipiOrderTracking

Tracks when a user completes an order or makes a purchase.

**Event Tracked:** Snowplow legacy e-commerce transaction events: one `tr` (transaction) event for the order and one `ti` (transaction item) event per item - Records completed transactions for revenue tracking, conversion analysis, and personalization improvements.

**Parameters:**

- `order: OrderEventPayload` - The completed order details including items, total value, and customer information

**Usage:**

```tsx
import { useDressipiOrderTracking } from 'mapp-fashion-react-native-sdk';

function OrderConfirmation({ orderData }) {
  // Track order completion when component mounts
  useDressipiOrderTracking({
    orderId: '1234567890',
    currency: 'GBP',
    totalValue: 0.0,
    items: [
      {
        sku: '603081121',
        price: 0.0,
        quantity: 1,
        name: 'Product 603081121',
      },
    ],
  });

  return (
    <View>
      <Text>Order #{orderData.id} confirmed!</Text>
      <Text>Total: ${orderData.total}</Text>
    </View>
  );
}
```

**OrderEventPayload Type:**

```typescript
type OrderEventPayload = {
  orderId: string;
  totalValue: number;
  items: {
    sku: string;
    price: number;
    quantity: number;
    name?: string;
    category?: string;
    currency?: string;
  }[];
  affiliation?: string;
  taxValue?: number;
  shipping?: number;
  city?: string;
  state?: string;
  country?: string;
  currency?: string;
};
```

---

#### useDressipiPageViewTracking

Tracks when a user views a page or navigates to a new screen.

**Event Tracked:** Snowplow page view (`pv`) - Records page navigation and screen views for understanding user browsing behavior, measuring page performance, and tracking user journeys through the application.

**Parameters:**

- `pageViewPayload: PageViewEventPayload` - The page view event data including URL and page details

**Usage:**

```tsx
import { useDressipiPageViewTracking } from 'mapp-fashion-react-native-sdk';

function ProductListPage() {
  // Track page view when component mounts
  useDressipiPageViewTracking({
    pageUrl: 'https://www.example.com/products',
    pageTitle: 'Product Listing',
    referrer: 'https://www.example.com/home',
  });

  return (
    <View>
      <Text>Product List</Text>
      {/* Page content */}
    </View>
  );
}

// Or track page view for different screen transitions
function HomePage() {
  useDressipiPageViewTracking({
    pageUrl: 'https://www.example.com/home',
    pageTitle: 'Home Page',
  });

  return (
    <View>
      <Text>Welcome to our store!</Text>
    </View>
  );
}
```

**PageViewEventPayload Type:**

```typescript
type PageViewEventPayload = {
  pageUrl: string; // The URL of the page being viewed
  pageTitle?: string; // The title of the page
  referrer?: string; // The referrer URL
};
```

---

#### useDressipiIdentifyTracking

Tracks user identification events such as login, registration, or profile updates.

**Event Tracked:** `iglu:com.dressipi/identify/jsonschema/1-0-0` - Records user identification information to enhance personalization and link user sessions across devices.

**Parameters:**

- `identification: IdentifyEventPayload` - User identification details. Both `customerId` and `email` are required; if either is missing, no event is sent and an error is logged.

The email is not sent in plain text: it is hashed with SHA-256 (together with your `namespaceId`) before tracking.

**Usage:**

```tsx
import { useDressipiIdentifyTracking } from 'mapp-fashion-react-native-sdk';

function UserProfile({ user }) {
  // Track user identification when component mounts
  useDressipiIdentifyTracking({
    customerId: '1234567890',
    email: 'test@test.com',
  });

  return (
    <View>
      <Text>Welcome, {user.name}!</Text>
      <Text>{user.email}</Text>
    </View>
  );
}

// Or track identification after login
function LoginScreen() {
  const handleLogin = async credentials => {
    const user = await loginUser(credentials);

    // Track user identification after successful login
    useDressipiIdentifyTracking({
      customerId: '1234567890',
      email: 'test@test.com',
    });
  };

  return <View>{/* Login form */}</View>;
}
```

**IdentifyEventPayload Type:**

```typescript
type IdentifyEventPayload = {
  /**
   * The customer ID. Required by the identify event.
   */
  customerId?: string;
  /**
   * The email address of the user. Required by the identify event;
   * sent as a SHA-256 hash.
   */
  email?: string;
};
```

---

#### useDressipiProductDisplayPageTracking

Tracks when a user views a product detail page (PDP).

**Event Tracked:** `iglu:com.dressipi/item_view/jsonschema/1-0-0` - Records product page views for understanding user interest, improving recommendations, and measuring engagement.

**Parameters:**

- `item: ProductDetailPageEventPayload` - The product being viewed on the detail page

**Usage:**

```tsx
import { useDressipiProductDisplayPageTracking } from 'mapp-fashion-react-native-sdk';

function ProductDetailPage({ product }) {
  // Track product page view when component mounts
  useDressipiProductDisplayPageTracking({
    product_code: '603081121',
    sku: '603081121',
  });

  return (
    <ScrollView>
      <Image source={{ uri: product.image }} />
      <Text>{product.name}</Text>
      <Text>{product.description}</Text>
      <Text>${product.price}</Text>
    </ScrollView>
  );
}
```

**ProductDetailPageEventPayload Type:**

```typescript
type ProductDetailPageEventPayload = ProductPayload;
```

**ProductPayload Type:**

```typescript
type ProductPayload = {
  /**
   * This is an identifier that is unique to the style and
   * color/pattern of the item.
   */
  product_code: string;
  /**
   * This is an identifier that is unique to the style, color/pattern and size of the item.
   */
  sku: string;
  /**
   * This is an identifier.
   */
  dressipi_item_id?: string;
  /**
   * The name of the item.
   */
  item_name?: string;
  /**
   * The barcode for this variant.
   */
  barcode?: string;
  /**
   * The size of the item/garment being viewed.
   */
  size?: string;
  /**
   * A product affiliation to designate a supplying company or brick and mortar store location.
   */
  affiliation?: string;
  /**
   * The coupon name or code associated with the item.
   */
  coupon?: string;
  /**
   * The currency of the item.
   */
  currency?: string;
  /**
   * The monetary discount value associated with the item.
   */
  discount?: number;
  /**
   * The brand of the item.
   */
  item_brand?: string;
  /**
   * The category of the item.
   */
  item_category?: string;
  /**
   * The second category hierarchy or additional taxonomy for the item.
   */
  item_category2?: string;
  /**
   * The third category hierarchy or additional taxonomy for the item.
   */
  item_category3?: string;
  /**
   * The fourth category hierarchy or additional taxonomy for the item.
   */
  item_category4?: string;
  /**
   * The fifth category hierarchy or additional taxonomy for the item.
   */
  item_category5?: string;
  /**
   * The location associated with the item.
   */
  location_id?: string;
  /**
   * The price of the item.
   */
  price?: number;
  /**
   * The quantity of the item.
   */
  quantity?: number;
};
```

---

#### useDressipiProductListPageTracking

Tracks when a user views a product listing page (PLP) such as category pages or search results.

**Event Tracked:** `iglu:com.dressipi/listings_view/jsonschema/1-0-0` - Records product list page views with information about displayed items, applied filters, and pagination for understanding browsing patterns.

**Parameters:**

- `data: ProductListPageEventPayload` - The product list page data including items, filters, and pagination information

**Usage:**

```tsx
import { useDressipiProductListPageTracking } from 'mapp-fashion-react-native-sdk';

function ProductListPage({ products, filters, currentPage }) {
  // Track product list page view when component mounts
  useDressipiProductListPageTracking({
    page: {
      number: 1,
    },
    items: [
      {
        sku: '603081121',
        product_code: '603081121',
      },
    ],
    filters: [
      {
        selected: ['selected'],
        name: 'garment_category',
      },
    ],
  });

  return (
    <View>
      <Text>Products ({products.length})</Text>
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard key={item.id} product={item} />}
      />
    </View>
  );
}

// Example with search results
function SearchResults({ searchQuery, results, appliedFilters, page }) {
  useDressipiProductListPageTracking({
    page: {
      number: 1,
    },
    items: [
      {
        sku: '603081121',
        product_code: '603081121',
      },
    ],
    filters: [
      {
        selected: ['selected'],
        name: 'garment_category',
      },
    ],
  });

  return (
    <View>
      <Text>Search results for "{searchQuery}"</Text>
      {/* Results display */}
    </View>
  );
}
```

**ProductListPageEventPayload Type:**

```typescript
type ProductListPageEventPayload = {
  /**
   * The page object.
   */
  page?: {
    /**
     * The page number currently visible.
     */
    number?: number;
  };
  /**
   * A list of products.
   */
  items: ProductPayload[];
  /**
   * A list of filters applied to the product list page.
   */
  filters?: ProductListPageFilterItem[];
};
```

**ProductListPageFilterItem Type:**

```typescript
type ProductListPageFilterItem = {
  name: string;
  selected: any[];
};
```

---

#### useDressipiTabClickTracking

Tracks when a user clicks on a tab in the interface.

**Event Tracked:** `iglu:com.dressipi/tab_click/jsonschema/1-0-0` - Records tab interactions for understanding user navigation patterns and content engagement.

**Parameters:**

- `tabClickPayload: TabClickEventPayload` - The tab click event data

**Usage:**

```tsx
import { useDressipiTabClickTracking } from 'mapp-fashion-react-native-sdk';

function TabComponent({ activeTab }) {
  // Track tab click when component mounts
  useDressipiTabClickTracking({
    request_id: '1234567890',
    tab_name: 'tab1',
  });

  return (
    <View>
      <TouchableOpacity>
        <Text>Tab 1</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**TabClickEventPayload Type:**

```typescript
type TabClickEventPayload = {
  /**
   * The id of request to the server that generated the content,
   * returned in the response as event_id.
   */
  request_id: string;
  /**
   * The name of the tab that was clicked on.
   */
  tab_name: string;
};
```

---

#### useDressipiItemClickQuickViewTracking

Tracks when a user clicks on an item in a quick view interface.

**Event Tracked:** `iglu:com.dressipi/item_click_quickview/jsonschema/1-0-0` - Records item clicks in quick view contexts for understanding user engagement with product previews.

**Parameters:**

- `itemClickQuickViewPayload: ItemClickQuickViewEventPayload` - The item click quick view event data

**Usage:**

```tsx
import { useDressipiItemClickQuickViewTracking } from 'mapp-fashion-react-native-sdk';

function QuickViewModal({ item }) {
  // Track item click in quick view when component mounts
  useDressipiItemClickQuickViewTracking({
    request_id: '1234567890',
    dressipi_item_id: 1,
    related_items_set_id: '1234567890',
  });

  return (
    <Modal>
      <Text>{item.name}</Text>
      <Text>${item.price}</Text>
    </Modal>
  );
}
```

**ItemClickQuickViewEventPayload Type:**

```typescript
type ItemClickQuickViewEventPayload = {
  /**
   * The id of request to the server that generated the content,
   * returned in the response as event_id.
   */
  request_id: string;
  /**
   * The id of the set containing the item that was clicked on,
   * returned in the API request as content_id.
   */
  related_items_set_id?: string;
  /**
   * The id of the item that was clicked on,
   * returned in the request as raw_garment_id.
   */
  dressipi_item_id: number;
};
```

---

#### useDressipiItemClickPdpTracking

Tracks when a user clicks on an item on a product detail page (PDP).

**Event Tracked:** `iglu:com.dressipi/item_click_pdp/jsonschema/1-0-0` - Records item clicks on product detail pages for understanding user interaction with related products and recommendations.

**Parameters:**

- `itemClickPdpPayload: ItemClickPdpEventPayload` - The item click PDP event data

**Usage:**

```tsx
import { useDressipiItemClickPdpTracking } from 'mapp-fashion-react-native-sdk';

function RelatedItemsSection({ relatedItems }) {
  // Track item click on PDP when component mounts
  useDressipiItemClickPdpTracking({
    request_id: '1234567890',
    dressipi_item_id: 1,
    related_items_set_id: '1234567890',
  });

  return (
    <View>
      <Text>Related Items</Text>
      {relatedItems.map(item => (
        <TouchableOpacity key={item.id}>
          <Text>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

**ItemClickPdpEventPayload Type:**

```typescript
type ItemClickPdpEventPayload = {
  /**
   * The id of request to the server that generated the content,
   * returned in the response as event_id.
   */
  request_id: string;
  /**
   * The id of the set containing the item that was clicked on,
   * returned in the API request as content_id.
   */
  related_items_set_id?: string;
  /**
   * The id of the item that was clicked on,
   * returned in the request as raw_garment_id.
   */
  dressipi_item_id: number;
};
```

---

### useCompliance

A hook for managing user data tracking consent and compliance with privacy regulations like GDPR. This hook provides access to the user's consent status and functions to update their preferences. The SDK automatically respects the consent status, enabling or disabling data collection and API authentication based on the user's choice.

#### Parameters

This hook takes no parameters.

#### Returns

`ComplianceConfiguration` - An object containing the user's consent state and management functions.

| Property       | Type                                  | Description                                                                                                                                   |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `hasConsented` | `boolean \| null`                     | The user's current consent status. `true` = consented, `false` = rejected, `null` = no choice made yet                                        |
| `setConsent`   | `(consent: boolean) => Promise<void>` | Function to update the user's consent status. Accepts `true` for consent or `false` for rejection. The value is securely stored and persisted |
| `isLoading`    | `boolean`                             | Indicates whether a consent operation is in progress. `true` during storage operations, `false` when idle                                     |

#### Consent Behavior

The consent status controls authentication, API calls and tracking:

| Consent state                              | Behavior                                                                                                                                                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`null`** (not set)                       | No authentication, and `useRelatedItems`/`useFacettedSearch` wait. No tracking data is sent, but tracked events are kept in memory and sent once the user consents. Set `defaultConsent` on `DressipiProvider` to start from `true` or `false` instead. |
| **`true`** (consented)                     | The SDK authenticates with the Dressipi API and stores the tokens securely. API calls are authenticated and tracking events are sent, including events kept in memory before consent.                                                                   |
| **`false`** (rejected)                     | No authentication, and stored Dressipi API tokens are deleted. `useRelatedItems`/`useFacettedSearch` still call the API, without authentication. No tracking data is sent, but tracked events are kept in memory and sent if the user consents later.   |
| **Withdrawn** (`true` → `false`)           | Same as `false`. Events the tracker already holds are still delivered. No new events are sent, and automatic background/foreground events stop. Tracking session data stays on the device.                                                              |
| **Consent given again** (`false` → `true`) | The SDK authenticates again and tracking resumes. Events kept in memory while consent was off are sent.                                                                                                                                                 |

Events kept in memory are lost if the app is closed before the user consents.
Keep a single `DressipiProvider` mounted for the app's lifetime; unmounting it
stops tracking and discards its pending events.

#### Storage

User consent preferences are securely stored using the same storage adapter configured for the SDK (React Native Keychain or Expo SecureStore). The consent status persists across app restarts and device reboots, ensuring users don't need to re-consent on every session.

#### Example Usage

**Basic Compliance Management:**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useCompliance } from 'mapp-fashion-react-native-sdk';

function PrivacySettings() {
  const { hasConsented, setConsent, isLoading } = useCompliance();

  const handleConsentUpdate = async (consent: boolean) => {
    try {
      await setConsent(consent);
      Alert.alert(
        'Settings Updated',
        `Data tracking ${consent ? 'enabled' : 'disabled'} successfully.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy settings.');
      console.error('Failed to set compliance:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Privacy Settings</Text>

      <Text style={{ marginBottom: 20 }}>
        Current Status:{' '}
        {hasConsented === null
          ? 'Not Set'
          : hasConsented
            ? 'Data Tracking Enabled'
            : 'Data Tracking Disabled'}
      </Text>

      <TouchableOpacity
        onPress={() => handleConsentUpdate(true)}
        disabled={isLoading}
        style={{
          backgroundColor: hasConsented === true ? '#4CAF50' : '#E0E0E0',
          padding: 15,
          marginBottom: 10,
          borderRadius: 8,
        }}
      >
        <Text>Enable Data Tracking</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleConsentUpdate(false)}
        disabled={isLoading}
        style={{
          backgroundColor: hasConsented === false ? '#F44336' : '#E0E0E0',
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text>Disable Data Tracking</Text>
      </TouchableOpacity>

      {isLoading && <Text>Updating settings...</Text>}
    </View>
  );
}
```

**Compliance Popup for First-Time Users:**

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useCompliance } from 'mapp-fashion-react-native-sdk';

function CompliancePopup() {
  const [showPopup, setShowPopup] = useState(false);
  const { hasConsented, setConsent, isLoading } = useCompliance();

  // Show popup if user hasn't made a choice yet
  useEffect(() => {
    if (hasConsented === null) {
      setShowPopup(true);
    }
  }, [hasConsented]);

  const handleAccept = async () => {
    try {
      await setConsent(true);
      setShowPopup(false);
    } catch (error) {
      console.error('Failed to accept compliance:', error);
    }
  };

  const handleReject = async () => {
    try {
      await setConsent(false);
      setShowPopup(false);
    } catch (error) {
      console.error('Failed to reject compliance:', error);
    }
  };

  return (
    <Modal visible={showPopup} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            margin: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
            Privacy & Data Usage
          </Text>

          <Text style={{ marginBottom: 20, lineHeight: 20 }}>
            We use your data to provide personalized fashion recommendations and
            improve your shopping experience. You can change this setting at any
            time in your privacy preferences.
          </Text>

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <TouchableOpacity
              onPress={handleReject}
              disabled={isLoading}
              style={{
                backgroundColor: '#E0E0E0',
                padding: 15,
                borderRadius: 8,
                flex: 1,
                marginRight: 10,
              }}
            >
              <Text style={{ textAlign: 'center' }}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAccept}
              disabled={isLoading}
              style={{
                backgroundColor: '#2196F3',
                padding: 15,
                borderRadius: 8,
                flex: 1,
                marginLeft: 10,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>
                Accept
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading && (
            <Text style={{ textAlign: 'center', marginTop: 10 }}>
              Processing...
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
```

**Conditional Feature Rendering Based on Consent:**

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useCompliance, useRelatedItems } from 'mapp-fashion-react-native-sdk';

function ProductPage({ productId }: { productId: string }) {
  const { hasConsented } = useCompliance();

  // Fetches with authentication when consented, without it when rejected,
  // and waits while consent is not set.
  const { relatedItems, loading } = useRelatedItems({
    item_id: productId,
    methods: ['outfits', 'similar_items'],
  });

  return (
    <View>
      <Text>Product Details</Text>

      {hasConsented === true ? (
        // Show personalized content when user has consented
        <View>
          {loading ? (
            <Text>Loading personalized recommendations...</Text>
          ) : (
            relatedItems && (
              <View>
                <Text>Recommended for You</Text>
                {/* Render recommendations */}
              </View>
            )
          )}
        </View>
      ) : hasConsented === false ? (
        // Show generic message when user declined
        <Text>
          Enable data tracking in settings to see personalized recommendations.
        </Text>
      ) : (
        // Show loading state while consent status is being determined
        <Text>Loading...</Text>
      )}
    </View>
  );
}
```

---

## Debug Logging

Set `enableLogging={true}` on `DressipiProvider` to log Fashion SDK activity.
The test app already enables it in `app/_layout.tsx`.

```tsx
<DressipiProvider
  namespaceId="your-namespace-id"
  domain="your-domain.com"
  clientId="your-client-id"
  enableLogging={true}
>
  <App />
</DressipiProvider>
```

From SDK 0.2.4, **search for `parentPageViewId` in the DevTools Console** to
see recommendation clicks before an HTTP request exists. These logs use the
`[Fashion Tracking]` prefix, so clear any `Fashion HTTP` filter first:

```text
[Fashion Tracking] item_click_pdp QUEUED parentPageViewId=<source-page-UUID>
```

`QUEUED` means the SDK retained the event while the tracker is unavailable.
`DISPATCHED` means it handed the event to Snowplow; only the `[Fashion HTTP]`
request/response pair describes network delivery. The page ID is read from the
built event's context, and a missing ID is logged as `parentPageViewId=null`.
A token without the tracking `subn` claim or a saved tracking identity for the
same profile produces a `Tracking is waiting` warning with
`reason: missing_network_user_id`; this warning contains no credentials.
From SDK 0.2.5, every affected queued event also includes this specific reason
in its log line and details instead of the generic `tracker_not_ready`.
From SDK 0.2.8, OAuth refresh preserves a previously issued `subn` in local
`trackingIdentity` metadata alongside the credentials. The SDK reuses it only
when the refreshed token has the same profile (`sub`), including after a storage
round trip or app restart. A new token's `subn` takes precedence. The SDK does
not change the JWT or use `sub` as the tracking ID.

If stored credentials already lost `subn` before this update and have no saved
identity, refreshing cannot reconstruct it. Recover the identity with the
Fashion backend, or explicitly create a new demo profile if losing that profile's
personalization is acceptable. The SDK does not reset profiles automatically.

From Fashion SDK 0.2.2, filter the JavaScript console for **`[Fashion HTTP]`**.
Each network attempt has a matching `requestId` (for example, `fashion-12`):

- `REQUEST`: HTTP method, full URL/query string, and request body (`null` for no body).
- `RESPONSE`: status, status text, response body, and `durationMs`.
- `ERROR`: network/timeout/cancellation errors, or HTTP errors with their status and response body.

This covers OAuth authorization, token exchange/refresh, related items, facetted
search, and Snowplow collector batches at `/t/t`. Retries have their own request
IDs. Logs describe actual transport attempts; an event waiting in the SDK queue
has no HTTP response yet.

Collector requests also include `decodedEvents`, a readable copy of Snowplow's
base64 event and context fields. From SDK 0.2.3, search for
`decodedEvents[].parentPageViewId` on recommendation events, and `pageViewId` on
source page-view events. These diagnostic fields are read from the actual
serialized `web_page` context's `data.id`; missing context is shown as `null`.
The encoded request body is preserved in `body`, and the transmitted payload is
unchanged. `parentPageViewId` is an SDK argument; its wire representation is the
`web_page` context inside `cx` (base64) or `co` (JSON), as in Mapp's web tracker.

Example output (body fields abbreviated):

```text
[Fashion HTTP] fashion-12 REQUEST
{ "requestId": "fashion-12", "method": "POST", "url": "https://fashion.example/t/t", "body": { "data": [...] }, "decodedEvents": [...] }
[Fashion HTTP] fashion-12 RESPONSE
{ "requestId": "fashion-12", "method": "POST", "url": "https://fashion.example/t/t", "status": 200, "statusText": "OK", "durationMs": 128, "body": "" }
```

Empty responses remain empty strings; JSON responses are displayed as objects.
Authorization headers, OAuth codes/verifiers, tokens, and password fields are
masked as `[REDACTED]` in diagnostic copies by default. From SDK 0.2.6, set
`logTokens={true}` alongside `enableLogging={true}` to print complete
`access_token` and `refresh_token` fields in HTTP response bodies and cached
credential logs. For development builds, use `logTokens={__DEV__}`. Search for
`access_token` or `refresh_token` in the DevTools Console after reloading the app.
Set `logTokens={false}` to restore token redaction, or `enableLogging={false}` to
turn off all SDK logging. Logging does not change requests or credentials.

## Types

### Core Types

#### DetailedItem

Represents a product item with complete information:

```typescript
type DetailedItem = {
  id: string; // Unique item identifier
  dressipi_item_id: number; // Dressipi's internal ID
  name: string; // Product name
  price?: string; // Current price
  old_price?: string; // Original price (if on sale)
  brand_name: string; // Brand name
  url: string; // Product URL
  category_name?: string; // Product category
  category_id?: number; // Category ID
  images: string[]; // Array of image URLs
  image_url: string; // Primary image URL
  best_model_image?: string; // Best model image URL
  best_product_image?: string; // Best product image URL
  has_outfits: boolean; // Whether item has outfit recommendations
  status: 'in stock' | 'out of stock'; // Availability status
  style_id?: string; // Style identifier
};
```

#### Outfit

Represents a complete outfit recommendation:

```typescript
type Outfit = {
  content_id: string; // Unique outfit identifier
  occasion: string; // Occasion (e.g., 'work', 'casual')
  items: DetailedItem[]; // Items in the outfit
};
```

#### RelatedItemsMethod

Enum for specifying which types of recommendations to fetch:

```typescript
enum RelatedItemsMethod {
  Outfits = 'outfits',
  PartnerOutfits = 'partner_outfits',
  SimilarItems = 'similar_items',
}
```

#### RelatedItemsApiRequest

Type for configuring related items API requests:

```typescript
type RelatedItemsApiRequest = {
  item_id?: string; // Item identifier
  response_format?: ResponseFormat; // Response detail level
  methods?: RelatedItemsMethod | RelatedItemsMethod[]; // Recommendation types
  try_all_methods?: boolean; // Fallback to all methods
  outfits_per_occasion?: number; // Max outfits per occasion
  max_similar_items?: number; // Max similar items
  max_reduced_by?: number; // Max discount percentage
  identifier_type?: RelatedItemsIdentifierType; // Identifier type
};
```

#### RelatedItemsMappedResponse

Type for the processed related items response:

```typescript
type RelatedItemsMappedResponse = {
  response_id: string; // Unique response identifier
  outfits?: Outfit[]; // Outfit recommendations
  partner_outfits?: Outfit[]; // Partner outfit recommendations
  similar_items?: {
    // Similar items group
    content_id: string; // Content identifier
    items: DetailedItem[]; // Array of similar items
  };
};
```

#### FacettedSearchApiRequest

Type for configuring facetted search API requests:

```typescript
type FacettedSearchApiRequest = {
  facets?: (FacetSingleFilter | FacetMultipleFilter)[]; // Search filters
  response_format?: ResponseFormat; // Response detail level
  page?: number; // Page number
  per_page?: number; // Items per page
};
```

#### FacettedSearchMappedResponse

Type for the processed facetted search response:

```typescript
type FacettedSearchMappedResponse = {
  response_id: string; // Unique response identifier
  content_id: string; // Content identifier
  items: DetailedItem[]; // Filtered product items
  pagination: {
    // Pagination information
    last_page: number; // Total pages
    current_page: number; // Current page
    total_items: number; // Total items count
  };
};
```

## Examples

### Error Handling Example

```tsx
import { useRelatedItems } from 'mapp-fashion-react-native-sdk';

function ProductWithErrorHandling({ productId }: { productId: string }) {
  const { relatedItems, loading, error } = useRelatedItems({
    item_id: productId,
    methods: [RelatedItemsMethod.Outfits],
  });

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return (
      <View>
        <Text>Failed to load recommendations</Text>
        <Text>{error.message}</Text>
        <TouchableOpacity onPress={() => window.location.reload()}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!relatedItems || !relatedItems.outfits?.length) {
    return <Text>No recommendations available for this item</Text>;
  }

  return (
    <View>
      {relatedItems.outfits.map(outfit => (
        <OutfitCard key={outfit.content_id} outfit={outfit} />
      ))}
    </View>
  );
}
```

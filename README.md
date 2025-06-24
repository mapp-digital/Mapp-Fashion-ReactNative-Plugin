# Dressipi React Native SDK

A React Native SDK that provides easy integration with Dressipi's fashion AI services, including related items discovery, facetted search, and tracking capabilities.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Storage Configuration](#storage-configuration)
- [API Reference](#api-reference)
  - [DressipiProvider](#dressipiprovider)
  - [useRelatedItems](#userelateditems)
  - [useFacettedSearch](#usefacettedsearch)
- [Types](#types)
- [Examples](#examples)

## Installation

(This is a placeholder information)

```bash
npm install @dressipi/react-native-sdk
```

### Additional Dependencies

This SDK requires the following peer dependencies:

```bash
npm install @snowplow/react-native-tracker lodash-es use-deep-compare-effect
```

## Quick Start

### 1. Setup the Provider

Wrap your app with the `DressipiProvider` to initialize the SDK:

```tsx
import React from 'react';
import { DressipiProvider } from '@dressipi/react-native-sdk';
import { YourAppComponent } from './YourAppComponent';

export default function App() {
  return (
    <DressipiProvider
      namespaceId="your-namespace-id"
      domain="your-domain.com"
      clientId="your-client-id"
    >
      <YourAppComponent />
    </DressipiProvider>
  );
}
```

### 2. Use the Hooks

Once wrapped with the provider, you can use the SDK hooks in any component:

```tsx
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import {
  useRelatedItems,
  useFacettedSearch,
  RelatedItemsMethod,
} from '@dressipi/react-native-sdk';

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
import { DressipiProvider } from '@dressipi/react-native-sdk';

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

For Expo applications or when you want to explicitly control the storage method, you can specify the `storageType` prop:

```tsx
import { DressipiProvider, StorageType } from '@dressipi/react-native-sdk';

// Explicitly use Expo SecureStore for Expo applications
<DressipiProvider
  namespaceId="your-namespace-id"
  domain="your-domain.com"
  clientId="your-client-id"
  storageType={StorageType.SECURE_STORE}
>
  <App />
</DressipiProvider>;
```

### Available Storage Types

The SDK provides two storage options:

| Storage Type               | Value            | Description                                   | Use Case                                         |
| -------------------------- | ---------------- | --------------------------------------------- | ------------------------------------------------ |
| `StorageType.KEYCHAIN`     | `'keychain'`     | Uses React Native Keychain for secure storage | **Default** - Standard React Native applications |
| `StorageType.SECURE_STORE` | `'secure-store'` | Uses Expo SecureStore for secure storage      | Expo applications and Expo Go                    |

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

### Migration Between Storage Types

If you need to switch storage types (e.g., migrating from React Native to Expo), users will need to re-authenticate as credentials from different storage adapters are not automatically migrated.

## API Reference

### DressipiProvider

The main provider component that initializes the SDK and provides authentication and tracking capabilities.

#### Props

| Prop          | Type          | Required | Description                                                              |
| ------------- | ------------- | -------- | ------------------------------------------------------------------------ |
| `namespaceId` | `string`      | Yes      | Your Dressipi namespace identifier                                       |
| `domain`      | `string`      | Yes      | Your Dressipi domain                                                     |
| `clientId`    | `string`      | Yes      | Your OAuth client ID for authentication                                  |
| `storageType` | `StorageType` | No       | Storage type for secure credentials (defaults to `StorageType.KEYCHAIN`) |
| `children`    | `ReactNode`   | Yes      | Your app components                                                      |

#### Features Provided

- **Authentication Management**: Automatically handles OAuth token lifecycle and refresh
- **Tracking Infrastructure**: Sets up Snowplow tracking for analytics
- **Request Queue**: Manages API request queuing when offline
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
} from '@dressipi/react-native-sdk';

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
import { useFacettedSearch } from '@dressipi/react-native-sdk';

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

### Complete Integration Example

```tsx
import React from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity } from 'react-native';
import {
  DressipiProvider,
  useRelatedItems,
  useFacettedSearch,
  useDressipiProductDisplayPageTracking,
  RelatedItemsMethod,
  type DetailedItem,
  type Outfit,
} from '@dressipi/react-native-sdk';

// Main App with Provider
export default function App() {
  return (
    <DressipiProvider
      namespaceId="your-namespace-id"
      domain="api.dressipi.com"
      clientId="your-client-id"
    >
      <ProductScreen />
    </DressipiProvider>
  );
}

// Product Screen Component
function ProductScreen() {
  const productId = 'product-123';

  // Track page view
  useDressipiProductDisplayPageTracking({
    product_id: productId,
    view_timestamp: Date.now(),
  });

  return (
    <ScrollView>
      <ProductDetails productId={productId} />
      <RelatedItemsSection productId={productId} />
      <SearchSection />
    </ScrollView>
  );
}

// Product Details with Related Items
function ProductDetails({ productId }: { productId: string }) {
  const { relatedItems, loading, error } = useRelatedItems({
    item_id: productId,
    methods: [RelatedItemsMethod.Outfits, RelatedItemsMethod.SimilarItems],
    outfits_per_occasion: 2,
    max_similar_items: 8,
  });

  if (loading) return <Text>Loading recommendations...</Text>;
  if (error) return <Text>Error loading recommendations</Text>;

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        Product Recommendations
      </Text>

      {/* Render Outfits */}
      {relatedItems?.outfits?.map((outfit: Outfit) => (
        <OutfitCard key={outfit.content_id} outfit={outfit} />
      ))}

      {/* Render Similar Items */}
      {relatedItems?.similar_items && (
        <View>
          <Text>Similar Items:</Text>
          <ScrollView horizontal>
            {relatedItems.similar_items.items.map((item: DetailedItem) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// Search Section
function SearchSection() {
  const { items, loading } = useFacettedSearch({
    facets: [
      {
        name: 'garment_category',
        value: ['dresses'],
      },
      {
        name: 'price',
        filters: [{ from: 50, to: 200 }],
      },
    ],
    per_page: 10,
  });

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Search Results</Text>
      {loading ? (
        <Text>Searching...</Text>
      ) : (
        items?.items.map((item: DetailedItem) => (
          <ItemCard key={item.id} item={item} />
        ))
      )}
    </View>
  );
}

// Reusable Components
function OutfitCard({ outfit }: { outfit: Outfit }) {
  return (
    <View style={{ padding: 16, borderWidth: 1, margin: 8 }}>
      <Text style={{ fontWeight: 'bold' }}>{outfit.occasion}</Text>
      <View style={{ flexDirection: 'row' }}>
        {outfit.items.slice(0, 3).map((item: DetailedItem) => (
          <Image
            key={item.id}
            source={{ uri: item.image_url }}
            style={{ width: 60, height: 80, marginRight: 8 }}
          />
        ))}
      </View>
      <Text>{outfit.items.length} items</Text>
    </View>
  );
}

function ItemCard({ item }: { item: DetailedItem }) {
  return (
    <TouchableOpacity style={{ padding: 8, width: 120 }}>
      <Image
        source={{ uri: item.image_url }}
        style={{ width: 100, height: 120 }}
      />
      <Text numberOfLines={2}>{item.name}</Text>
      <Text style={{ fontWeight: 'bold' }}>{item.price}</Text>
      <Text style={{ color: 'gray' }}>{item.brand_name}</Text>
    </TouchableOpacity>
  );
}
```

### Error Handling Example

```tsx
import { useRelatedItems } from '@dressipi/react-native-sdk';

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

import { AuthCredentials } from '../../types/auth';
import { FacettedSearchApiResponse } from '../../types/facetted-search';
import { RelatedItemsApiResponse } from '../../types/related-items';

// Mock authentication credentials
export const mockCredentials: AuthCredentials = {
  access_token: 'mock-access-token-123',
  refresh_token: 'mock-refresh-token-456',
  expires_in: 3600,
  token_type: 'Bearer',
};

// Mock related items API response
export const mockRelatedItemsApiResponse: RelatedItemsApiResponse = {
  event_id: 'mock-event-123',
  source: {
    garment_id: 'test-item-123',
    raw_garment_id: 12345,
    ancillary_product_code: 'test-product-code',
  },
  garment_data: [
    {
      id: 1,
      feed_image_urls: ['https://example.com/shirt.jpg'],
      brand_name: 'TestBrand',
      name: 'Blue Cotton Shirt',
      price: '29.99',
      old_price: '39.99',
      url: 'https://example.com/product/item-1',
      rating: '4.5',
      garment_category_id: 1,
      garment_category_name: 'Shirts',
      department: 'female',
      image_url: 'https://example.com/shirt.jpg',
      thumbnail_image_url: 'https://example.com/shirt-thumb.jpg',
      best_model_image: 'https://example.com/shirt-model.jpg',
      best_product_image: 'https://example.com/shirt-product.jpg',
      product_code: 'SHIRT-001',
      partner: 'TestPartner',
      retailer: 'TestRetailer',
      why: [],
      has_outfits: true,
      garment_status: 'in stock',
      product_id: 'item-1',
    },
    {
      id: 2,
      feed_image_urls: ['https://example.com/jeans.jpg'],
      brand_name: 'TestBrand',
      name: 'Black Denim Jeans',
      price: '49.99',
      old_price: '59.99',
      url: 'https://example.com/product/item-2',
      rating: null,
      garment_category_id: 2,
      garment_category_name: 'Jeans',
      department: 'female',
      image_url: 'https://example.com/jeans.jpg',
      thumbnail_image_url: 'https://example.com/jeans-thumb.jpg',
      product_code: 'JEANS-001',
      partner: 'TestPartner',
      retailer: 'TestRetailer',
      why: [],
      has_outfits: false,
      garment_status: 'in stock',
      product_id: 'item-2',
    },
  ],
  reparentable: true,
  outfits: [
    {
      content_id: 'outfit-1',
      garment_id: 'test-item-123',
      raw_garment_id: 12345,
      template_id: 'template-1',
      saved: false,
      occasion: 'casual',
      items: [
        {
          garment_id: 'item-1',
          raw_garment_id: 1,
        },
        {
          garment_id: 'item-2',
          raw_garment_id: 2,
        },
      ],
    },
  ],
  partner_outfits: [],
  similar_items: {
    content_id: 'similar-1',
    items: [
      {
        garment_id: 'similar-item-1',
        raw_garment_id: 3,
      },
    ],
  },
};

// Mock facetted search API response
export const mockFacettedSearchApiResponse: FacettedSearchApiResponse = {
  event_id: 'mock-search-event-456',
  content_id: 'mock-content-789',
  recommendations: [
    {
      garment_id: 'search-item-1',
      raw_garment_id: 101,
      has_outfits: true,
      retailer: 'SummerRetailer',
      feed_image_urls: ['https://example.com/dress.jpg'],
      brand_name: 'SummerBrand',
      name: 'Red Summer Dress',
      price: '79.99',
      old_price: '99.99',
      url: 'https://example.com/product/search-item-1',
      garment_status: 'in stock',
    },
  ],
  pagination: {
    total_pages: 1,
    total_entries: 1,
    current_page: 1,
  },
};

// Mock error responses
export const mockAuthError = {
  status: 401,
  response: {
    data: {
      error: { message: 'Unauthorized' },
    },
  },
  message: 'Request failed with status code 401',
};

export const mockGarmentNotFoundError = {
  status: 404,
  response: {
    data: {
      error: { message: 'Garment not found' },
    },
  },
  message: 'Request failed with status code 404',
};

export const mockNetworkError = {
  message: 'Network Error',
  code: 'NETWORK_ERROR',
};

// Mock request parameters
export const mockRelatedItemsRequest = {
  item_id: 'test-item-123',
  limit: 10,
  offset: 0,
};

export const mockFacettedSearchRequest = {
  query: 'summer dress',
  filters: {
    color: ['red'],
    size: ['s', 'm'],
  },
  limit: 20,
  offset: 0,
};

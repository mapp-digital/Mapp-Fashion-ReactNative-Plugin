import { FacettedSearchApiResponse } from '../../../types/facetted-search';
import { RelatedItemsApiResponse } from '../../../types/related-items';

export const mockAuthTokenResponse = {
  access_token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWJuIjoidGVzdC1uZXR3b3JrLWlkIiwiZXhwIjo5OTk5OTk5OTk5fQ.mock-signature',
  refresh_token: 'mock-refresh-token-12345',
  token_type: 'Bearer',
  expires_in: 3600,
};

export const mockRelatedItemsResponse: RelatedItemsApiResponse = {
  event_id: 'related-event-123456',
  source: {
    garment_id: 'DRESS-123',
    raw_garment_id: 1001,
  },
  garment_data: [
    {
      id: 1001,
      feed_image_urls: ['https://example.com/dress123.jpg'],
      brand_name: 'Test Fashion',
      name: 'Beautiful Summer Dress',
      price: '89.99',
      old_price: '119.99',
      url: 'https://example.com/products/dress-123',
      rating: '4.5',
      garment_category_id: 10,
      garment_category_name: 'Dresses',
      department: 'female',
      image_url: 'https://example.com/dress123.jpg',
      thumbnail_image_url: 'https://example.com/dress123-thumb.jpg',
      best_model_image: 'https://example.com/dress123-model.jpg',
      best_product_image: 'https://example.com/dress123-product.jpg',
      product_code: 'DRESS-123',
      partner: 'TestRetailer',
      retailer: 'Test Store',
      why: [],
      has_outfits: true,
      garment_status: 'in stock',
      product_id: 'PROD-DRESS-123',
    },
    {
      id: 1002,
      feed_image_urls: ['https://example.com/shoes456.jpg'],
      brand_name: 'Shoe Brand',
      name: 'Elegant Heels',
      price: '129.99',
      url: 'https://example.com/products/shoes-456',
      rating: '4.8',
      garment_category_id: 20,
      garment_category_name: 'Shoes',
      department: 'female',
      image_url: 'https://example.com/shoes456.jpg',
      product_code: 'SHOES-456',
      partner: 'TestRetailer',
      retailer: 'Test Store',
      why: [],
      has_outfits: false,
      garment_status: 'in stock',
      product_id: 'PROD-SHOES-456',
    },
  ],
  reparentable: false,
  outfits: [
    {
      content_id: 'outfit-content-789',
      garment_id: 'DRESS-123',
      raw_garment_id: 1001,
      template_id: 'template-casual',
      saved: false,
      occasion: 'casual',
      items: [
        {
          garment_id: 'DRESS-123',
          raw_garment_id: 1001,
        },
        {
          garment_id: 'SHOES-456',
          raw_garment_id: 1002,
        },
      ],
    },
  ],
  partner_outfits: [],
  similar_items: {
    content_id: 'similar-content-456',
    items: [
      {
        garment_id: 'DRESS-789',
        raw_garment_id: 1003,
      },
    ],
  },
};

export const mockFacettedSearchResponse: FacettedSearchApiResponse = {
  event_id: 'search-event-789012',
  content_id: 'search-content-345',
  recommendations: [
    {
      garment_id: 'SEARCH-ITEM-1',
      raw_garment_id: 2001,
      has_outfits: true,
      retailer: 'Search Store',
      feed_image_urls: ['https://example.com/search1.jpg'],
      brand_name: 'Search Brand',
      name: 'Search Result Dress',
      price: '79.99',
      old_price: '99.99',
      url: 'https://example.com/products/search-1',
      garment_status: 'in stock',
    },
    {
      garment_id: 'SEARCH-ITEM-2',
      raw_garment_id: 2002,
      has_outfits: false,
      retailer: 'Search Store',
      feed_image_urls: ['https://example.com/search2.jpg'],
      brand_name: 'Search Brand',
      name: 'Search Result Top',
      price: '49.99',
      old_price: '59.99',
      url: 'https://example.com/products/search-2',
      garment_status: 'in stock',
    },
  ],
  pagination: {
    total_pages: 3,
    total_entries: 50,
    current_page: 1,
  },
};

export const mockGarmentNotFoundResponse = {
  error: 'Garment not found',
  message: 'The requested garment could not be found',
};

export const mockAuthErrorResponse = {
  error: 'invalid_grant',
  error_description: 'The provided authorization grant is invalid',
};

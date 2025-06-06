import { DetailedItem, FacettedSearchMappedResponse, Outfit, RelatedItemsMappedResponse } from '../src';

// Mock product data with realistic fashion items
export const mockProducts: DetailedItem[] = [
  {
    id: 'dress-001',
    dressipi_item_id: 1001,
    name: 'Floral Midi Dress',
    price: '£89.99',
    old_price: '£119.99',
    brand_name: 'Zara',
    url: 'https://example.com/dress-001',
    category_name: 'Dresses',
    category_id: 1,
    images: ['https://picsum.photos/300/400?random=1'],
    image_url: 'https://picsum.photos/300/400?random=1',
    best_model_image: 'https://picsum.photos/300/400?random=1',
    best_product_image: 'https://picsum.photos/300/400?random=1',
    has_outfits: true,
    status: 'in stock',
    style_id: 'floral-midi'
  },
  {
    id: 'top-001',
    dressipi_item_id: 1002,
    name: 'Silk Blouse',
    price: '£65.00',
    brand_name: 'COS',
    url: 'https://example.com/top-001',
    category_name: 'Tops',
    category_id: 2,
    images: ['https://picsum.photos/300/400?random=2'],
    image_url: 'https://picsum.photos/300/400?random=2',
    best_model_image: 'https://picsum.photos/300/400?random=2',
    best_product_image: 'https://picsum.photos/300/400?random=2',
    has_outfits: true,
    status: 'in stock',
    style_id: 'silk-blouse'
  },
  {
    id: 'jeans-001',
    dressipi_item_id: 1003,
    name: 'High-Waisted Jeans',
    price: '£79.99',
    old_price: '£99.99',
    brand_name: 'Weekday',
    url: 'https://example.com/jeans-001',
    category_name: 'Jeans',
    category_id: 3,
    images: ['https://picsum.photos/300/400?random=3'],
    image_url: 'https://picsum.photos/300/400?random=3',
    best_model_image: 'https://picsum.photos/300/400?random=3',
    best_product_image: 'https://picsum.photos/300/400?random=3',
    has_outfits: true,
    status: 'in stock',
    style_id: 'high-waisted'
  },
  {
    id: 'shoes-001',
    dressipi_item_id: 1004,
    name: 'Leather Ankle Boots',
    price: '£145.00',
    brand_name: 'Dr. Martens',
    url: 'https://example.com/shoes-001',
    category_name: 'Shoes',
    category_id: 4,
    images: ['https://picsum.photos/300/400?random=4'],
    image_url: 'https://picsum.photos/300/400?random=4',
    best_model_image: 'https://picsum.photos/300/400?random=4',
    best_product_image: 'https://picsum.photos/300/400?random=4',
    has_outfits: true,
    status: 'in stock',
    style_id: 'ankle-boots'
  },
  {
    id: 'jacket-001',
    dressipi_item_id: 1005,
    name: 'Wool Blazer',
    price: '£199.99',
    brand_name: 'Mango',
    url: 'https://example.com/jacket-001',
    category_name: 'Jackets',
    category_id: 5,
    images: ['https://picsum.photos/300/400?random=5'],
    image_url: 'https://picsum.photos/300/400?random=5',
    best_model_image: 'https://picsum.photos/300/400?random=5',
    best_product_image: 'https://picsum.photos/300/400?random=5',
    has_outfits: true,
    status: 'in stock',
    style_id: 'wool-blazer'
  },
  {
    id: 'sweater-001',
    dressipi_item_id: 1006,
    name: 'Cashmere Sweater',
    price: '£159.99',
    old_price: '£199.99',
    brand_name: 'Uniqlo',
    url: 'https://example.com/sweater-001',
    category_name: 'Knitwear',
    category_id: 6,
    images: ['https://picsum.photos/300/400?random=6'],
    image_url: 'https://picsum.photos/300/400?random=6',
    best_model_image: 'https://picsum.photos/300/400?random=6',
    best_product_image: 'https://picsum.photos/300/400?random=6',
    has_outfits: true,
    status: 'in stock',
    style_id: 'cashmere'
  },
  {
    id: 'skirt-001',
    dressipi_item_id: 1007,
    name: 'Pleated Mini Skirt',
    price: '£45.00',
    brand_name: 'H&M',
    url: 'https://example.com/skirt-001',
    category_name: 'Skirts',
    category_id: 7,
    images: ['https://picsum.photos/300/400?random=7'],
    image_url: 'https://picsum.photos/300/400?random=7',
    best_model_image: 'https://picsum.photos/300/400?random=7',
    best_product_image: 'https://picsum.photos/300/400?random=7',
    has_outfits: true,
    status: 'out of stock',
    style_id: 'pleated-mini'
  },
  {
    id: 'bag-001',
    dressipi_item_id: 1008,
    name: 'Crossbody Bag',
    price: '£85.00',
    brand_name: 'Charles & Keith',
    url: 'https://example.com/bag-001',
    category_name: 'Bags',
    category_id: 8,
    images: ['https://picsum.photos/300/400?random=8'],
    image_url: 'https://picsum.photos/300/400?random=8',
    best_model_image: 'https://picsum.photos/300/400?random=8',
    best_product_image: 'https://picsum.photos/300/400?random=8',
    has_outfits: true,
    status: 'in stock',
    style_id: 'crossbody'
  },
  {
    id: 'trousers-001',
    dressipi_item_id: 1009,
    name: 'Wide-Leg Trousers',
    price: '£95.00',
    brand_name: 'ARKET',
    url: 'https://example.com/trousers-001',
    category_name: 'Trousers',
    category_id: 9,
    images: ['https://picsum.photos/300/400?random=9'],
    image_url: 'https://picsum.photos/300/400?random=9',
    best_model_image: 'https://picsum.photos/300/400?random=9',
    best_product_image: 'https://picsum.photos/300/400?random=9',
    has_outfits: true,
    status: 'in stock',
    style_id: 'wide-leg'
  },
  {
    id: 'cardigan-001',
    dressipi_item_id: 1010,
    name: 'Button-Up Cardigan',
    price: '£75.00',
    brand_name: 'MUJI',
    url: 'https://example.com/cardigan-001',
    category_name: 'Knitwear',
    category_id: 6,
    images: ['https://picsum.photos/300/400?random=10'],
    image_url: 'https://picsum.photos/300/400?random=10',
    best_model_image: 'https://picsum.photos/300/400?random=10',
    best_product_image: 'https://picsum.photos/300/400?random=10',
    has_outfits: true,
    status: 'in stock',
    style_id: 'button-cardigan'
  }
];

// Mock outfits data
export const mockOutfits: Outfit[] = [
  {
    content_id: 'outfit-work-001',
    occasion: 'work',
    items: [mockProducts[1], mockProducts[2], mockProducts[4]] // Silk blouse, jeans, blazer
  },
  {
    content_id: 'outfit-casual-001',
    occasion: 'casual',
    items: [mockProducts[5], mockProducts[2], mockProducts[3]] // Cashmere sweater, jeans, ankle boots
  },
  {
    content_id: 'outfit-formal-001',
    occasion: 'formal',
    items: [mockProducts[0], mockProducts[3], mockProducts[7]] // Floral dress, ankle boots, crossbody bag
  },
  {
    content_id: 'outfit-weekend-001',
    occasion: 'weekend',
    items: [mockProducts[9], mockProducts[8], mockProducts[3]] // Cardigan, wide-leg trousers, ankle boots
  }
];

// Mock related items response
export const mockRelatedItemsResponse: RelatedItemsMappedResponse = {
  response_id: 'rel-123456',
  outfits: mockOutfits,
  partner_outfits: [
    {
      content_id: 'partner-outfit-001',
      occasion: 'styled_look',
      items: [mockProducts[0], mockProducts[3], mockProducts[7]] // Dress, boots, bag
    }
  ],
  similar_items: {
    content_id: 'similar-123',
    items: [mockProducts[1], mockProducts[5], mockProducts[9]] // Similar tops/knitwear
  }
};

// Mock facetted search response
export const mockFacettedSearchResponse: FacettedSearchMappedResponse = {
  response_id: 'search-123456',
  content_id: 'plp-content-123',
  items: mockProducts,
  pagination: {
    last_page: 3,
    current_page: 1,
    total_items: 28
  }
};

// Helper function to get a product by ID
export const getProductById = (id: string): DetailedItem | undefined => {
  return mockProducts.find(product => product.id === id);
};

// Helper function to get related items for a product
export const getRelatedItemsForProduct = (productId: string): RelatedItemsMappedResponse => {
  // In a real app, this would be based on the actual product
  // For now, return the same mock data but could be customized per product
  return mockRelatedItemsResponse;
};

// Helper function to simulate loading delay
export const simulateLoading = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

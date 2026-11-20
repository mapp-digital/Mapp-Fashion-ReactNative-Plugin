import { FacettedSearchApiResponse } from '../../types/facetted-search';
import {
  RelatedItemsAPIResponseItem,
  RelatedItemsApiResponseOutfit,
} from '../../types/related-items';

export const garments: RelatedItemsAPIResponseItem[] = [1, 2].map(id => ({
  id,
  product_code: `ITEM-${id}`,
  product_id: `STYLE-${id}`,
  name: `Product ${id}`,
  brand_name: 'Brand',
  price: '29.99',
  old_price: '39.99',
  url: `https://shop.example/${id}`,
  image_url: `https://shop.example/${id}.jpg`,
  feed_image_urls: [`https://shop.example/${id}.jpg`],
  garment_category_id: 1,
  garment_category_name: 'Dresses',
  department: 'female',
  rating: null,
  partner: 'shop',
  retailer: 'Shop',
  why: [],
  has_outfits: true,
  garment_status: 'in stock',
}));
export const source = { garment_id: 'ITEM-1', raw_garment_id: 1 };
export const recommendation = { garment_id: 'ITEM-2', raw_garment_id: 2 };
export const outfit: RelatedItemsApiResponseOutfit = {
  content_id: 'outfit-content',
  garment_id: 'ITEM-1',
  template_id: 'template',
  occasion: 'casual',
  items: [source, recommendation],
};
export const facettedResponse: FacettedSearchApiResponse = {
  event_id: 'search-event',
  // Reverse metadata to prove recommendation order is independent of it.
  garment_data: [...garments].reverse(),
  recommendations: {
    content_id: 'search-content',
    items: [source, recommendation],
  },
  pagination: { current_page: 1, total_pages: 3, total_entries: 5 },
};

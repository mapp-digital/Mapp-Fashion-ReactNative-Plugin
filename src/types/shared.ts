/**
 * Type for an item coming directly from the Dressipi API.
 */
export type DetailedItem = {
  id: string;
  dressipi_item_id: number;
  name: string;
  price?: string;
  old_price?: string;
  brand_name: string;
  url: string;
  category_name?: string;
  category_id?: number;
  images: string[];
  image_url: string;
  best_model_image?: string;
  best_product_image?: string | '';
  has_outfits: boolean;
  status: DetailedItemStatus;
  style_id?: string;
}

/**
 * Type for the status of a Dressipi API item.
 */
type DetailedItemStatus = 'in stock' | 'out of stock';
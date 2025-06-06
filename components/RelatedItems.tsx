import React from 'react';
import { View } from 'react-native';
import { DetailedItem, RelatedItemsMappedResponse } from '../src';
import { Outfits } from './Outfits';
import { PartnerOutfits } from './PartnerOutfits';
import { SimilarItems } from './SimilarItems';
import { Body } from './Typography';

interface RelatedItemsProps {
  loading: boolean;
  items: RelatedItemsMappedResponse | null;
  error: Error | null;
  onPress: (item: DetailedItem) => void;
}

export const RelatedItems: React.FC<RelatedItemsProps> = ({
  loading,
  items,
  error,
  onPress
}) => {
  if (loading) {
    return (
      <View className="items-center justify-center h-40 px-page">
        <Body className="text-center text-neutral-500">
          Loading recommendations...
        </Body>
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-4 px-page">
        <Body className="text-center text-error-600">
          There was an error getting related items: {error.message}
        </Body>
      </View>
    );
  }

  if (!items) {
    return null;
  }

  return (
    <View>
      <PartnerOutfits items={items.partner_outfits} onPress={onPress} />
      
      <SimilarItems 
        items={items.similar_items?.items}
        content_id={items.similar_items?.content_id}
        onPress={onPress} 
      />
      
      <Outfits items={items.outfits} onPress={onPress} />
    </View>
  );
};

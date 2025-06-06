import React from 'react';
import { View } from 'react-native';
import { DetailedItem, Outfit } from '../src';
import { ProductList } from './ProductList';
import { Heading4 } from './Typography';

interface PartnerOutfitsProps {
  items?: Outfit[];
  onPress: (item: DetailedItem) => void;
}

export const PartnerOutfits: React.FC<PartnerOutfitsProps> = ({
  items,
  onPress
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <View className="mb-4 px-page">
        <Heading4 className="text-neutral-800">
          On the Model
        </Heading4>
      </View>
      {items.map(outfit => (
        <View key={outfit.content_id} className="mb-4">
          <ProductList items={outfit.items} onPress={onPress} />
        </View>
      ))}
    </View>
  );
};

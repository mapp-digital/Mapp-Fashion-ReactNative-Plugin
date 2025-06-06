import React from 'react';
import { View } from 'react-native';
import { DetailedItem } from '../src';
import { ProductList } from './ProductList';
import { Heading4 } from './Typography';

interface SimilarItemsProps {
  content_id?: string;
  items?: DetailedItem[];
  onPress: (item: DetailedItem) => void;
}

export const SimilarItems: React.FC<SimilarItemsProps> = ({
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
          Similar Items
        </Heading4>
      </View>
      <ProductList items={items} onPress={onPress} />
    </View>
  );
};

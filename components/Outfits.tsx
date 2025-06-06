import React from 'react';
import { View } from 'react-native';
import { DetailedItem, Outfit } from '../src';
import { ProductList } from './ProductList';
import { Heading4 } from './Typography';

interface OutfitsProps {
  items?: Outfit[];
  onPress: (item: DetailedItem) => void;
}

// Utility function to convert text to title case
// https://stackoverflow.com/a/64489760
const titleCase = (s: string) =>
  s.replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())       // Initial char (after -/_)
   .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());

export const Outfits: React.FC<OutfitsProps> = ({
  items,
  onPress
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      {items.map(outfit => (
        <View key={outfit.content_id} className="mb-6">
          <View className="mb-4 px-page">
            <Heading4 className="text-neutral-800">
              {titleCase(outfit.occasion)}
            </Heading4>
          </View>
          <ProductList items={outfit.items} onPress={onPress} />
        </View>
      ))}
    </View>
  );
};

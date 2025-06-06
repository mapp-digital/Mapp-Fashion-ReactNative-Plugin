import React from 'react';
import { FlatList, Image, TouchableOpacity, View } from 'react-native';
import { DetailedItem } from '../src';
import { Card } from './Card';
import { Body, Caption } from './Typography';

interface ProductListProps {
  items?: DetailedItem[];
  onPress: (item: DetailedItem) => void;
  loading?: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({
  items,
  onPress,
  loading = false
}) => {
  if (!items || items.length === 0) {
    return (
      <View className="items-center justify-center h-40 px-page">
        <Body className="text-center text-neutral-500">
          {loading ? 'Loading products...' : 'No products found'}
        </Body>
      </View>
    );
  }

  const renderItem = ({ item }: { item: DetailedItem }) => (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="w-40 mr-4"
    >
      <Card className="h-64">
        <View className="flex-1">
          <Image
            source={{ uri: item.best_product_image || item.image_url }}
            className="w-full h-40 rounded-t-card"
            resizeMode="cover"
          />
          <View className="justify-between flex-1 p-3">
            <View>
              <Body className="mb-1 text-sm font-medium" numberOfLines={2}>
                {item.name}
              </Body>
              <Caption className="text-xs text-neutral-500">
                {item.brand_name}
              </Caption>
            </View>
            <View className="mt-2">
              <View className="flex-row items-center">
                <Body className="text-sm font-bold text-primary-600">
                  {item.price}
                </Body>
                {item.old_price && (
                  <Caption className="ml-2 text-xs line-through text-neutral-400">
                    {item.old_price}
                  </Caption>
                )}
              </View>
              {item.status === 'out of stock' && (
                <Caption className="mt-1 text-xs font-medium text-error-600">
                  Out of Stock
                </Caption>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      horizontal
      keyExtractor={(item) => item.id}
      contentContainerClassName="px-page"
      showsHorizontalScrollIndicator={false}
      className="min-h-64"
    />
  );
};

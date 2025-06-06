import React from 'react';
import { FlatList, Image, TouchableOpacity, View } from 'react-native';
import { DetailedItem } from '../src';
import { Card } from './Card';
import { Body, Caption } from './Typography';

interface ProductGridProps {
  items?: DetailedItem[];
  onPress: (item: DetailedItem) => void;
  loading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  items,
  onPress,
  loading = false
}) => {
  if (!items || items.length === 0) {
    return (
      <View className="items-center justify-center flex-1 p-8">
        <Body className="text-center text-neutral-500">
          {loading ? 'Loading products...' : 'No products found'}
        </Body>
      </View>
    );
  }

  const renderItem = ({ item }: { item: DetailedItem }) => (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="flex-1 mx-1 mb-4"
      style={{ maxWidth: '48%' }}
    >
      <Card className="overflow-hidden">
        <View className="flex-1">
          <Image
            source={{ uri: item.best_product_image || item.image_url }}
            className="w-full h-48 rounded-t-card"
            resizeMode="cover"
          />
          <View className="flex-1 p-2">
            {/* Top section with product info */}
            <View className="flex-1">
              <Body 
                className="font-medium" 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.name}
              </Body>
              <Caption 
                className="text-neutral-500" 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.brand_name}
              </Caption>
            </View>
            
            {/* Bottom section with pricing - fixed position */}
            <View className="mt-2">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <Body 
                    className="font-bold text-primary-600" 
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.price}
                  </Body>
                  {item.old_price && (
                    <Caption 
                      className="ml-2 line-through text-neutral-400" 
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.old_price}
                    </Caption>
                  )}
                </View>
              </View>
              <Caption 
                className={`font-medium ${
                  item.status === 'out of stock' 
                    ? 'text-error-600' 
                    : 'text-success-600'
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.status === 'out of stock' ? 'Out of Stock' : 'In Stock'}
              </Caption>
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
      numColumns={2}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-page"
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      showsVerticalScrollIndicator={false}
    />
  );
};

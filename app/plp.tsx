import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, Heading3, ProductGrid } from '../components';
import { DetailedItem, useFacettedSearch } from '../src';

export default function PLP() {
  const { loading, error, items } = useFacettedSearch({
    facets: [{
      name: 'garment_category',
      value: [1],
    }]
  });

  const handleNavigateHome = () => {
    router.push('/' as any);
  };

  const handleNavigateToPDP = useCallback((item: DetailedItem) => {
    router.push(`/pdp/${item.id}` as any);
  }, []);

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header Card */}
      <View className="p-page">
        <Card className="items-center justify-center h-24 mb-6 border border-neutral-100">
          <Heading3 className="text-primary-600">
            Product Listing
          </Heading3>
          <Body className="mt-2 text-center text-neutral-600">
            Browse our amazing collection
          </Body>
        </Card>
      </View>

      {/* Product Grid */}
      <View className="flex-1">
        {loading ? (
          <View className="items-center justify-center flex-1">
            <Body className="text-neutral-500">Loading products...</Body>
          </View>
        ) : error ? (
          <View className="items-center justify-center flex-1 p-page">
            <Body className="mb-4 text-center text-error-600">
              Error loading products: {error.message}
            </Body>
            <Button
              title="Try Again"
              className="bg-primary-500 active:bg-primary-600"
              textClassName="text-white"
              onPress={handleNavigateHome}
            />
          </View>
        ) : (
          <ProductGrid 
            items={items?.items} 
            onPress={handleNavigateToPDP}
            loading={loading}
          />
        )}
      </View>

      {/* Navigation */}
      <View className="p-page">
        <Button
          title="Back to Home"
          className="w-full bg-transparent border-2 border-primary-500 active:bg-primary-50"
          textClassName="text-primary-500"
          onPress={handleNavigateHome}
        />
      </View>
    </View>
  );
}

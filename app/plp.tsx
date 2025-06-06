import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, Heading3, ProductGrid } from '../components';
import { mockFacettedSearchResponse, simulateLoading } from '../data/mockData';
import { DetailedItem, FacettedSearchMappedResponse } from '../src';

export default function PLP() {
  const [searchData, setSearchData] = useState<FacettedSearchMappedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const handleNavigateHome = () => {
    router.push('/' as any);
  };

  const handleNavigateToPDP = (item: DetailedItem) => {
    router.push(`/pdp/${item.id}` as any);
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      await simulateLoading(1500); // Simulate network delay
      setSearchData(mockFacettedSearchResponse);
      setLoading(false);
    };

    loadProducts();
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
        ) : (
          <ProductGrid 
            items={searchData?.items} 
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

import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Body, Button, Card, Heading2, RelatedItems } from '../../components';
import { DetailedItem, RelatedItemsMethod, useDressipiTracking, useRelatedItems } from '../../src';

export default function PDP() {
  const { productCode } = useLocalSearchParams<{ productCode: string }>();
  const { productDisplayPage } = useDressipiTracking();

  // Add PDP tracking
  useEffect(() => {
    if (productCode) {
      productDisplayPage({
        productCode: productCode as string,
        category: '',
        name: `Product ${productCode}`,
        brand: '',
        price: '0.00',
        currency: 'GBP',
        quantity: 1
      });
    }
  }, [productCode, productDisplayPage]);

  // Get related items using SDK
  const { loading: relatedLoading, error, relatedItems } = useRelatedItems({
    item_id: productCode as string,
    methods: [RelatedItemsMethod.Outfits, RelatedItemsMethod.PartnerOutfits, RelatedItemsMethod.SimilarItems],
    try_all_methods: true,
  });

  const handleNavigateHome = () => {
    router.push('/' as any);
  };

  const handleNavigateToPLP = () => {
    router.push('/plp' as any);
  };

  const handleProductPress = useCallback((item: DetailedItem) => {
    router.push(`/pdp/${item.id}` as any);
  }, []);

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="p-page">
        {/* Product Header */}
        <Card className="items-center justify-center h-32 mb-6 border border-neutral-100">
          <Heading2 className="mb-2 text-primary-600">
            Product Details
          </Heading2>
          <Body className="text-center text-neutral-600">
            Product Code: {productCode}
          </Body>
        </Card>

        {/* Product Information Placeholder */}
        <Card className="p-6 mb-6 border-2 border-neutral-200">
          <Body className="mb-4 text-neutral-600">
            This is a product detail page for: <Body className="font-semibold">{productCode}</Body>
          </Body>
          <Body className="mb-4 text-neutral-600">
            In a full implementation, individual product data would be fetched here.
          </Body>
          
          <View className="mt-6">
            <Button
              title="Add to Cart"
              className="w-full bg-secondary-500 active:bg-secondary-600"
              textClassName="text-white"
            />
          </View>
        </Card>

        {/* Navigation Buttons */}
        <View className="mb-6 space-y-3">
          <Button
            title="Back to Products"
            className="w-full bg-transparent border-2 border-primary-500 active:bg-primary-50"
            textClassName="text-primary-500"
            onPress={handleNavigateToPLP}
          />
          <View className="mt-3">
            <Button
              title="Home"
              className="w-full bg-transparent active:bg-neutral-100"
              textClassName="text-neutral-700"
              onPress={handleNavigateHome}
            />
          </View>
        </View>
      </View>

      {/* Related Items */}
      <RelatedItems
        loading={relatedLoading}
        items={relatedItems}
        error={error}
        onPress={handleProductPress}
      />
    </ScrollView>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Body, Button, Card, Heading2, Heading4, RelatedItems } from '../../components';
import { getProductById, getRelatedItemsForProduct, simulateLoading } from '../../data/mockData';
import { DetailedItem, RelatedItemsMappedResponse } from '../../src';

export default function PDP() {
  const { productCode } = useLocalSearchParams<{ productCode: string }>();
  const [product, setProduct] = useState<DetailedItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<RelatedItemsMappedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const handleNavigateHome = () => {
    router.push('/' as any);
  };

  const handleNavigateToPLP = () => {
    router.push('/plp' as any);
  };

  const handleProductPress = (item: DetailedItem) => {
    router.push(`/pdp/${item.id}` as any);
  };

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      await simulateLoading(800);
      
      const foundProduct = getProductById(productCode as string);
      setProduct(foundProduct || null);
      setLoading(false);
    };

    const loadRelatedItems = async () => {
      setRelatedLoading(true);
      await simulateLoading(1200);
      
      const related = getRelatedItemsForProduct(productCode as string);
      setRelatedItems(related);
      setRelatedLoading(false);
    };

    if (productCode) {
      loadProduct();
      loadRelatedItems();
    }
  }, [productCode]);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1 bg-neutral-50">
        <Body className="text-neutral-500">Loading product...</Body>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="items-center justify-center flex-1 bg-neutral-50 p-page">
        <Body className="mb-4 text-center text-neutral-500">
          Product not found
        </Body>
        <Button
          title="Back to Products"
          className="bg-primary-500 active:bg-primary-600"
          textClassName="text-white"
          onPress={handleNavigateToPLP}
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="p-page">
        {/* Product Header */}
        <Card className="items-center justify-center h-32 mb-6 border border-neutral-100">
          <Heading2 className="mb-2 text-primary-600">
            {product.name}
          </Heading2>
          <Body className="text-center text-neutral-600">
            {product.brand_name}
          </Body>
        </Card>

        {/* Product Information */}
        <Card className="p-6 mb-6 border-2 border-neutral-200">
          <View className="flex-row">
            <View className="w-32 h-40 mr-4">
              <Image
                source={{ uri: product.best_product_image || product.image_url }}
                className="w-full h-full rounded-card"
                resizeMode="cover"
              />
            </View>
            <View className="flex-1">
              <Heading4 className="mb-2">
                {product.name}
              </Heading4>
              <Body className="mb-2 text-neutral-600">
                {product.brand_name}
              </Body>
              <Body className="mb-2 text-neutral-600">
                {product.category_name}
              </Body>
              <View className="flex-row items-center mb-4">
                <Body className="text-xl font-bold text-primary-600">
                  {product.price}
                </Body>
                {product.old_price && (
                  <Body className="ml-2 line-through text-neutral-400">
                    {product.old_price}
                  </Body>
                )}
              </View>
              <Body className={`text-sm font-medium ${
                product.status === 'in stock' ? 'text-success-600' : 'text-error-600'
              }`}>
                {product.status === 'in stock' ? 'In Stock' : 'Out of Stock'}
              </Body>
            </View>
          </View>
          
          <View className="mt-6">
            <Button
              title="Add to Cart"
              className="w-full bg-secondary-500 active:bg-secondary-600"
              textClassName="text-white"
              disabled={product.status === 'out of stock'}
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
        error={null}
        onPress={handleProductPress}
      />
    </ScrollView>
  );
}

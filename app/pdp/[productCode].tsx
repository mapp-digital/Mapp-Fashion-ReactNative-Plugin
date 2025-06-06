import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Body, Heading2, Heading4 } from '../../components/Typography';

export default function PDP() {
  const { productCode } = useLocalSearchParams<{ productCode: string }>();

  const handleNavigateHome = () => {
    router.push('/' as any);
  };

  const handleNavigateToPLP = () => {
    router.push('/plp' as any);
  };

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

        {/* Product Information */}
        <Card className="p-6 mb-6 border-2 border-neutral-200">
          <Heading4 className="mb-4">
            Sample Product Name
          </Heading4>
          <Body className="mb-4 text-neutral-600">
            This is a detailed description of the product. In the full implementation, 
            this will show real product data fetched using the SDK.
          </Body>
          
          <View className="mb-4">
            <Body className="mb-2 font-semibold">
              Features:
            </Body>
            <Body className="mb-1 text-sm text-neutral-600">
              • High quality materials
            </Body>
            <Body className="mb-1 text-sm text-neutral-600">
              • Modern design
            </Body>
            <Body className="text-sm text-neutral-600">
              • Sustainable production
            </Body>
          </View>

          <View className="flex-row items-center justify-between">
            <Body className="text-xl font-bold text-primary-600">
              $99.99
            </Body>
            <Button
              title="Add to Cart"
              className="px-3 py-2 bg-secondary-500 active:bg-secondary-600"
              textClassName="text-white text-sm"
            />
          </View>
        </Card>

        {/* Related Items Section */}
        <Card className="p-4 mb-6 border border-neutral-100">
          <Heading4 className="mb-3">
            Related Items
          </Heading4>
          <Body className="text-center text-neutral-600">
            Related items will be displayed here using the SDK&apos;s related items functionality.
          </Body>
        </Card>

        {/* Similar Items Section */}
        <Card className="p-4 mb-6 border border-neutral-100">
          <Heading4 className="mb-3">
            Similar Items
          </Heading4>
          <Body className="text-center text-neutral-600">
            Similar items recommendations will be shown here.
          </Body>
        </Card>

        {/* Navigation Buttons */}
        <View className="space-y-3">
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
    </ScrollView>
  );
}

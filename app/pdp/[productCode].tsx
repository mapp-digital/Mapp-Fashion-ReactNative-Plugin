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
        <Card 
          variant="elevated" 
          className="items-center justify-center h-32 mb-6"
        >
          <Heading2 color="primary" className="mb-2">
            Product Details
          </Heading2>
          <Body color="neutral" className="text-center">
            Product Code: {productCode}
          </Body>
        </Card>

        {/* Product Information */}
        <Card variant="outlined" className="p-6 mb-6">
          <Heading4 className="mb-4">
            Sample Product Name
          </Heading4>
          <Body color="neutral" className="mb-4">
            This is a detailed description of the product. In the full implementation, 
            this will show real product data fetched using the SDK.
          </Body>
          
          <View className="mb-4">
            <Body weight="semibold" className="mb-2">
              Features:
            </Body>
            <Body color="neutral" className="mb-1 text-sm">
              • High quality materials
            </Body>
            <Body color="neutral" className="mb-1 text-sm">
              • Modern design
            </Body>
            <Body color="neutral" className="text-sm">
              • Sustainable production
            </Body>
          </View>

          <View className="flex-row items-center justify-between">
            <Body weight="bold" color="primary" className="text-xl">
              $99.99
            </Body>
            <Button
              title="Add to Cart"
              variant="secondary"
              size="sm"
            />
          </View>
        </Card>

        {/* Related Items Section */}
        <Card variant="elevated" className="p-4 mb-6">
          <Heading4 className="mb-3">
            Related Items
          </Heading4>
          <Body color="neutral" className="text-center">
            Related items will be displayed here using the SDK&apos;s related items functionality.
          </Body>
        </Card>

        {/* Similar Items Section */}
        <Card variant="elevated" className="p-4 mb-6">
          <Heading4 className="mb-3">
            Similar Items
          </Heading4>
          <Body color="neutral" className="text-center">
            Similar items recommendations will be shown here.
          </Body>
        </Card>

        {/* Navigation Buttons */}
        <View className="space-y-3">
          <Button
            title="Back to Products"
            variant="outline"
            fullWidth
            onPress={handleNavigateToPLP}
          />
          <Button
            title="Home"
            variant="ghost"
            fullWidth
            onPress={handleNavigateHome}
          />
        </View>
      </View>
    </ScrollView>
  );
}

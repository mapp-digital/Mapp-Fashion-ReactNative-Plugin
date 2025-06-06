import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Body, Heading3 } from '../components/Typography';

export default function PLP() {
  const handleNavigateHome = () => {
    router.push('/' as any);
  };

  const handleNavigateToPDP = () => {
    router.push('/pdp/sample-product' as any);
  };

  return (
    <View className="flex-1 bg-neutral-50 p-page">
      {/* Header Card */}
      <Card 
        variant="elevated" 
        className="items-center justify-center h-24 mb-6"
      >
        <Heading3 color="primary">
          Product Listing
        </Heading3>
        <Body color="neutral" className="mt-2 text-center">
          Browse our amazing collection
        </Body>
      </Card>

      {/* Content Area */}
      <View className="justify-center flex-1">
        <Body color="neutral" className="mb-8 text-center">
          Product grid will be implemented here with the SDK integration.
        </Body>

        {/* Sample Product Card */}
        <Card variant="outlined" className="p-4 mb-4">
          <Body weight="semibold" className="mb-2">
            Sample Product
          </Body>
          <Body color="neutral" className="mb-4 text-sm">
            This is a placeholder for actual product data
          </Body>
          <Button
            title="View Details"
            variant="primary"
            size="sm"
            onPress={handleNavigateToPDP}
          />
        </Card>
      </View>

      {/* Navigation */}
      <View className="mt-6">
        <Button
          title="Back to Home"
          variant="outline"
          fullWidth
          onPress={handleNavigateHome}
        />
      </View>
    </View>
  );
}

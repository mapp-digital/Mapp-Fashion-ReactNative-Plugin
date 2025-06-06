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
      <Card className="items-center justify-center h-24 mb-6 border border-neutral-100">
        <Heading3 className="text-primary-600">
          Product Listing
        </Heading3>
        <Body className="mt-2 text-center text-neutral-600">
          Browse our amazing collection
        </Body>
      </Card>

      {/* Content Area */}
      <View className="justify-center flex-1">
        <Body className="mb-8 text-center text-neutral-600">
          Product grid will be implemented here with the SDK integration.
        </Body>

        {/* Sample Product Card */}
        <Card className="p-4 mb-4 border-2 border-neutral-200">
          <Body className="mb-2 font-semibold">
            Sample Product
          </Body>
          <Body className="mb-4 text-sm text-neutral-600">
            This is a placeholder for actual product data
          </Body>
          <Button
            title="View Details"
            className="px-3 py-2 bg-primary-500 active:bg-primary-600"
            textClassName="text-white text-sm"
            onPress={handleNavigateToPDP}
          />
        </Card>
      </View>

      {/* Navigation */}
      <View className="mt-6">
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

import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Body } from '../components/Typography';

export default function Home() {
  const handleNavigateToPLP = () => {
    router.push('/plp' as any);
  };

  return (
    <View className="flex-1 bg-neutral-50 p-page">
      <View className="justify-center flex-1">
        {/* Welcome Card */}
        <Card 
          variant="elevated" 
          className="items-center justify-center h-32 mb-8"
        >
          <Body color="neutral" weight="medium">
            Welcome to the Store.
          </Body>
        </Card>

        {/* Navigation Button */}
        <Button
          title="Browse Products"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleNavigateToPLP}
        />

        {/* Secondary Action */}
        <View className="mt-4">
          <Button
            title="View Categories"
            variant="outline"
            size="md"
            fullWidth
            onPress={() => {
              // Placeholder for future functionality
              console.log('Categories pressed');
            }}
          />
        </View>
      </View>

      {/* Footer Section */}
      <View className="items-center mt-8">
        <Body color="neutral" className="text-sm text-center">
          Discover amazing products tailored just for you
        </Body>
      </View>
    </View>
  );
}

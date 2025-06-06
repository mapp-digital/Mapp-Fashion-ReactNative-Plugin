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
        <Card className="items-center justify-center h-32 mb-8 border border-neutral-100">
          <Body className="font-medium text-neutral-600">
            Welcome to the Store.
          </Body>
        </Card>

        {/* Navigation Button */}
        <Button
          title="Browse Products"
          className="w-full px-8 py-4 bg-primary-500 active:bg-primary-600"
          textClassName="text-white text-lg"
          onPress={handleNavigateToPLP}
        />

        {/* Secondary Action */}
        <View className="mt-4">
          <Button
            title="View Categories"
            className="w-full bg-transparent border-2 border-primary-500 active:bg-primary-50"
            textClassName="text-primary-500"
            onPress={() => {
              // Placeholder for future functionality
              console.log('Categories pressed');
            }}
          />
        </View>
      </View>

      {/* Footer Section */}
      <View className="items-center mt-8">
        <Body className="text-sm text-center text-neutral-600">
          Discover amazing products tailored just for you
        </Body>
      </View>
    </View>
  );
}

import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { DressipiProvider } from '../src';
import './global.css';

export default function RootLayout() {
  return (
    <DressipiProvider 
      namespaceId="00000000-0000-0000-0000-000000000000"
      domain="dressipi-production.countryroad.com.au"
      clientId="cr-mobile-app-test"
    >
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#8B5CF6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Welcome',
            headerStyle: {
              backgroundColor: '#8B5CF6',
            },
          }} 
        />
        <Stack.Screen 
          name="plp" 
          options={{ 
            title: 'Product Listing',
            headerStyle: {
              backgroundColor: '#8B5CF6',
            },
          }} 
        />
        <Stack.Screen 
          name="pdp/[productCode]" 
          options={{ 
            title: 'Product Details',
            headerStyle: {
              backgroundColor: '#8B5CF6',
            },
          }} 
        />
      </Stack>
    </DressipiProvider>
  );
}

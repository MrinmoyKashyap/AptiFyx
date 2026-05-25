import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/customer/HomeScreen';
import ServiceSelectionScreen from '../screens/customer/ServiceSelectionScreen';
import BroadcastMapScreen from '../screens/customer/BroadcastMapScreen';
import ActiveJobScreen from '../screens/customer/ActiveJobScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';

const Stack = createNativeStackNavigator();

export default function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerHome" component={HomeScreen} />
      <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
      <Stack.Screen
        name="BroadcastMap"
        component={BroadcastMapScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="ActiveJob"
        component={ActiveJobScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Profile" component={CustomerProfileScreen} />
    </Stack.Navigator>
  );
}

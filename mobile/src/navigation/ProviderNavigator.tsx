import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '../screens/provider/DashboardScreen';
import IncomingRequestScreen from '../screens/provider/IncomingRequestScreen';
import ProviderActiveJobScreen from '../screens/provider/ProviderActiveJobScreen';
import CommissionScreen from '../screens/provider/CommissionScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';
import JobHistoryScreen from '../screens/provider/JobHistoryScreen';

const Stack = createNativeStackNavigator();

export default function ProviderNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProviderDashboard" component={DashboardScreen} />
      <Stack.Screen
        name="IncomingRequest"
        component={IncomingRequestScreen}
        options={{ gestureEnabled: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="ProviderActiveJob"
        component={ProviderActiveJobScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="Commission"
        component={CommissionScreen}
      />
      <Stack.Screen
        name="CommissionPayment"
        component={CommissionScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <Stack.Screen name="JobHistory" component={JobHistoryScreen} />
    </Stack.Navigator>
  );
}

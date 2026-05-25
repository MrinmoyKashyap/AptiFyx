import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import OTPVerifyScreen from '../screens/auth/OTPVerifyScreen';

// Customer navigator
import CustomerNavigator from './CustomerNavigator';

// Provider navigator
import ProviderNavigator from './ProviderNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, role } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {isAuthenticated && role === 'customer' ? (
          <>
            <Stack.Screen name="CustomerApp" component={CustomerNavigator} />
            {/* Allow reaching auth screens for logout flow */}
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
            <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
          </>
        ) : isAuthenticated && role === 'provider' ? (
          <>
            <Stack.Screen name="ProviderApp" component={ProviderNavigator} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
            <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
            <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
            <Stack.Screen name="CustomerApp" component={CustomerNavigator} />
            <Stack.Screen name="ProviderApp" component={ProviderNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

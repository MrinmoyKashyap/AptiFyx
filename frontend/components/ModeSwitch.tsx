import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useModeStore } from '../store/mode-store';
import { ActiveMode } from '@aptifyx/shared-types';
import { useAuthStore } from '../store/auth-store';
import { api } from '../services/api';
import { Colors } from '../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function ModeSwitch() {
  const { currentMode, setMode } = useModeStore();
  const { user, updateUser } = useAuthStore();
  const [isSwitching, setIsSwitching] = useState(false);

  const isPartnerMode = currentMode === ActiveMode.PARTNER;

  const toggleMode = async (value: boolean) => {
    if (isSwitching) return;
    
    const targetMode = value ? ActiveMode.PARTNER : ActiveMode.CUSTOMER;
    
    // Check if they are eligible to be a partner
    if (targetMode === ActiveMode.PARTNER && !user?.roles.includes('partner')) {
      alert('You must complete Partner Setup before switching to Partner mode.');
      return;
    }

    try {
      setIsSwitching(true);
      await api.post('/auth/switch-mode', { mode: targetMode });
      updateUser({ activeMode: targetMode });
      setMode(targetMode);
    } catch (error) {
      alert('Failed to switch mode. Please try again.');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name="account-outline" 
        size={24} 
        color={!isPartnerMode ? Colors.customer.primary : Colors.light.tabIconDefault} 
      />
      
      <View style={styles.switchContainer}>
        <Switch
          trackColor={{ false: Colors.customer.primaryLight, true: Colors.partner.primaryLight }}
          thumbColor={isPartnerMode ? Colors.partner.primary : Colors.customer.primary}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleMode}
          value={isPartnerMode}
          disabled={isSwitching}
        />
        <Text style={styles.label}>
          {isPartnerMode ? 'Partner Mode' : 'Customer Mode'}
        </Text>
      </View>

      <MaterialCommunityIcons 
        name="briefcase-outline" 
        size={24} 
        color={isPartnerMode ? Colors.partner.primary : Colors.light.tabIconDefault} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  switchContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  }
});

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  mode?: 'customer' | 'partner';
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ 
  title, 
  variant = 'primary', 
  mode = 'customer', 
  isLoading = false, 
  style, 
  textStyle, 
  disabled,
  ...props 
}: ButtonProps) {
  
  const modeColors = Colors[mode];
  
  const getBackgroundColor = () => {
    if (disabled) return Colors.light.border;
    switch (variant) {
      case 'primary': return modeColors.primary;
      case 'secondary': return modeColors.primaryLight;
      case 'danger': return Colors.status.danger;
      case 'outline': return 'transparent';
      default: return modeColors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.light.tabIconDefault;
    switch (variant) {
      case 'primary': 
      case 'danger': return '#fff';
      case 'secondary': return modeColors.primaryDark;
      case 'outline': return modeColors.primary;
      default: return '#fff';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && { borderWidth: 1, borderColor: modeColors.primary },
        style
      ]} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});

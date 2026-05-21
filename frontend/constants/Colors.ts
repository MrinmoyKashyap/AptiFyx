/**
 * AptiFyx Colors
 * 
 * Defines the core color palette. 
 * We use two distinct primary themes to help users differentiate modes:
 * - Customer Mode: Vibrant Blue theme (Reliable, Service-oriented)
 * - Partner Mode: Rich Emerald/Green theme (Earnings, Availability)
 */

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1F2937',        // Gray 800
    background: '#F9FAFB',  // Gray 50
    surface: '#FFFFFF',
    border: '#E5E7EB',      // Gray 200
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',  // Gray 900
    surface: '#1F2937',     // Gray 800
    border: '#374151',      // Gray 700
    tint: tintColorDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
  },
  
  // Role-Specific Branding
  customer: {
    primary: '#3B82F6',     // Blue 500
    primaryLight: '#DBEAFE',// Blue 100
    primaryDark: '#2563EB', // Blue 600
  },
  partner: {
    primary: '#10B981',     // Emerald 500
    primaryLight: '#D1FAE5',// Emerald 100
    primaryDark: '#059669', // Emerald 600
  },
  
  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  }
};

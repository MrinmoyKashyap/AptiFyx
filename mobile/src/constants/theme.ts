export const Colors = {
  // Primary (Deep Purple / Violet)
  primary: '#6B21A8',       
  primaryDark: '#4C1D95',
  primaryLight: '#C084FC',
  
  // Secondary / Accents (Gold / Subtle cyan)
  secondary: '#D97706',     
  accent: '#7E22CE',        
  success: '#059669',       
  error: '#E11D48',         
  warning: '#EA580C',       
  purple: '#6B21A8',

  // Neutrals / White / Gray
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F4F5',
  border: '#E4E4E7',
  borderLight: '#F4F4F5',

  // Text
  text: '#18181B',
  textSecondary: '#52525B',
  textMuted: '#A1A1AA',
  textInverse: '#FFFFFF',

  // Gradients
  gradientStart: '#7E22CE',
  gradientEnd: '#4C1D95',

  // Status
  online: '#059669',
  offline: '#A1A1AA',
  broadcasting: '#D97706',
};

export const Typography = {
  fontSizeXS: 11,
  fontSizeSM: 13,
  fontSizeMD: 15,
  fontSizeLG: 17,
  fontSizeXL: 20,
  fontSize2XL: 24,
  fontSize3XL: 30,
  fontSize4XL: 36,

  fontWeightNormal: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
  fontWeightExtraBold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  primary: {
    shadowColor: '#6B21A8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};

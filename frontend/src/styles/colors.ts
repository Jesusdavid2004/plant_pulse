export const colors = {
  light: {
    primary: '#2D5F4C',
    primaryHover: '#1F4A3A',
    secondary: '#C17A56',
    secondaryHover: '#A86444',
    accent: '#E8A87C',
    background: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F0',
    border: '#E5E5E0',
    text: '#2D3436',
    textSecondary: '#636E72',
    textMuted: '#95A5A6',
    success: '#27AE60',
    warning: '#F39C12',
    danger: '#E74C3C',
  },
  dark: {
    primary: '#4CAF7D',
    primaryHover: '#5FC490',
    secondary: '#C17A56',
    secondaryHover: '#D48B67',
    accent: '#4CAF7D',
    background: '#000000',
    surface: '#0A0A0A',
    surfaceHover: '#151515',
    border: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#707070',
    success: '#4CAF7D',
    warning: '#FFA500',
    danger: '#FF5252',
  },
} as const;

export type Theme = 'light' | 'dark';
export type ColorScheme = typeof colors.light;

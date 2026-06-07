export const theme = {
  colors: {
    primary: '#b71c1c',
    primaryDark: '#7f1010',
    primarySoft: '#fee2e2',
    background: '#f7f7f9',
    surface: '#ffffff',
    surfaceMuted: '#f1f2f4',
    text: '#1a1c1d',
    muted: '#667085',
    border: '#e4e7ec',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
};

export const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const urgencyColors: Record<string, string> = {
  low: theme.colors.info,
  medium: theme.colors.warning,
  high: '#ea580c',
  critical: theme.colors.danger,
};

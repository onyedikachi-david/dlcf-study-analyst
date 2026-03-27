export const Colors = {
  light: {
    text: '#1a1a2e',
    textSecondary: '#64748b',
    background: '#fafbff',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    tint: '#8b5cf6',
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    secondary: '#06b6d4',
    accent: '#f472b6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    border: '#e2e8f0',
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#8b5cf6',
    gradient1: '#667eea',
    gradient2: '#764ba2',
    gradient3: '#f093fb',
    gradient4: '#f5576c',
    neon: '#00ff88',
    cardGlow: 'rgba(139, 92, 246, 0.15)',
  },
  dark: {
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    background: '#0f0f1a',
    surface: '#1e1e32',
    surfaceElevated: '#2a2a45',
    tint: '#a78bfa',
    primary: '#a78bfa',
    primaryLight: '#c4b5fd',
    secondary: '#22d3ee',
    accent: '#f472b6',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    border: '#334155',
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: '#a78bfa',
    gradient1: '#667eea',
    gradient2: '#764ba2',
    gradient3: '#f093fb',
    gradient4: '#f5576c',
    neon: '#00ff88',
    cardGlow: 'rgba(167, 139, 250, 0.2)',
  },
};

export const CorkBoardColors = {
  light: {
    background: '#c4956a',
    frameColors: ['#8B5E3C', '#A0724D', '#6B4226', '#A0724D', '#8B5E3C'],
    noiseOpacity: 0.12,
  },
  dark: {
    background: '#8a6a4a',
    frameColors: ['#5a3d28', '#6e4d35', '#4a2d1a', '#6e4d35', '#5a3d28'],
    noiseOpacity: 0.08,
  },
};

export const BadgeColors = {
  unlocked: {
    border: '#fbbf24',
    background: '#fef3c7',
  },
  locked: {
    border: '#9ca3af',
    background: '#f3f4f6',
    opacity: 0.4,
  },
};

export const ShareCardGradient = {
  start: '#6366f1',
  end: '#9333ea',
};

export const USRLabels: Record<number, { label: string; color: string }> = {
  0: { label: 'Not rated', color: '#9ca3af' },
  1: { label: 'Poor', color: '#ef4444' },
  2: { label: 'Poor', color: '#ef4444' },
  3: { label: 'Poor', color: '#f97316' },
  4: { label: 'Poor', color: '#f97316' },
  5: { label: 'Average', color: '#eab308' },
  6: { label: 'Good', color: '#84cc16' },
  7: { label: 'Good', color: '#22c55e' },
  8: { label: 'Good', color: '#22c55e' },
  9: { label: 'Excellent', color: '#10b981' },
  10: { label: 'Excellent', color: '#14b8a6' },
};

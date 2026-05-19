/**
 * Smart Campus Presence — Brand Color System
 * All colours follow the immersive dark / neon-accent theme.
 */
export const Colors = {
  // Base surfaces
  background: '#0E0E12',
  foreground: '#EEF0F4',
  card: '#14141C',

  // Accent / brand
  accent: '#00E5FF',   // Electric Cyan
  purple: '#9B59B6',   // Neon Purple
  primary: '#5B6FD4',  // Indigo-blue

  // Neutral tones
  muted: '#1E1E2A',
  mutedForeground: '#8A8FA8',
  border: '#2A2A38',

  // Semantic
  success: '#24B075',
  destructive: '#EF4444',
  warning: '#F59E0B',
} as const;

export type ColorKey = keyof typeof Colors;

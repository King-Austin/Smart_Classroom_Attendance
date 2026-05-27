import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

export interface BlurCardProps {
  children: React.ReactNode;
  /** Blur intensity 0–100. Default: 50. */
  intensity?: number;
  /** Color tint of the blur layer. Default: 'dark'. */
  tint?: 'dark' | 'light';
  className?: string;
  style?: ViewStyle;
}

export function BlurCard({
  children,
  intensity = 50,
  tint = 'dark',
  className,
  style,
}: BlurCardProps) {
  return (
    <View
      className={className}
      style={[
        {
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(42,42,56,0.8)',
        },
        style,
      ]}
    >
      {/* Blur background layer */}
      <BlurView
        intensity={intensity}
        tint={tint}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Semi-transparent dark overlay to deepen the glass effect */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(14,14,18,0.6)',
        }}
      />

      {/* Content sits above both layers */}
      <View style={{ position: 'relative' }}>{children}</View>
    </View>
  );
}

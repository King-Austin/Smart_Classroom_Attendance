import React from 'react';
import { Text, View } from 'react-native';
import { Colors } from '@/theme/colors';

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
}

type BadgeVisuals = {
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  borderWidth?: number;
};

function getVisuals(variant: NonNullable<BadgeProps['variant']>): BadgeVisuals {
  switch (variant) {
    case 'default':
      return {
        backgroundColor: 'rgba(0,229,255,0.15)',
        textColor: Colors.accent,
      };
    case 'success':
      return {
        backgroundColor: 'rgba(36,176,117,0.15)',
        textColor: Colors.success,
      };
    case 'warning':
      return {
        backgroundColor: 'rgba(245,158,11,0.15)',
        textColor: Colors.warning,
      };
    case 'destructive':
      return {
        backgroundColor: 'rgba(239,68,68,0.15)',
        textColor: Colors.destructive,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        textColor: Colors.mutedForeground,
        borderColor: Colors.border,
        borderWidth: 1,
      };
  }
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const visuals = getVisuals(variant);

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: visuals.backgroundColor,
        borderRadius: 999,
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderWidth: visuals.borderWidth ?? 0,
        borderColor: visuals.borderColor ?? 'transparent',
      }}
    >
      <Text
        style={{
          color: visuals.textColor,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

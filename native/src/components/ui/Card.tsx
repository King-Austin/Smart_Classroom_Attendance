import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, className, style }: CardProps) {
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: Colors.card,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 16,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

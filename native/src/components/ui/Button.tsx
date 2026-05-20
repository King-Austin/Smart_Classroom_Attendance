import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { Colors } from '@/theme/colors';

export interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
}

type SizeConfig = {
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
  minHeight: number;
};

const SIZE_CONFIG: Record<NonNullable<ButtonProps['size']>, SizeConfig> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, minHeight: 34 },
  md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15, minHeight: 44 },
  lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 17, minHeight: 54 },
};

type VariantStyle = {
  container: object;
  text: object;
};

const getVariantStyle = (
  variant: NonNullable<ButtonProps['variant']>,
  pressed: boolean,
  disabled: boolean,
): VariantStyle => {
  const opacity = disabled ? 0.45 : pressed ? 0.78 : 1;

  switch (variant) {
    case 'default':
      return {
        container: {
          backgroundColor: Colors.accent,
          borderWidth: 0,
          opacity,
        },
        text: {
          color: '#0A0A0F',
          fontWeight: '700' as const,
        },
      };

    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: Colors.accent,
          opacity,
        },
        text: {
          color: Colors.accent,
          fontWeight: '600' as const,
        },
      };

    case 'ghost':
      return {
        container: {
          backgroundColor: pressed ? 'rgba(0,229,255,0.08)' : 'transparent',
          borderWidth: 0,
          opacity,
        },
        text: {
          color: Colors.accent,
          fontWeight: '600' as const,
        },
      };

    case 'destructive':
      return {
        container: {
          backgroundColor: Colors.destructive,
          borderWidth: 0,
          opacity,
        },
        text: {
          color: '#FFFFFF',
          fontWeight: '700' as const,
        },
      };
  }
};

export function Button({
  onPress,
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  style,
}: ButtonProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={className}
      style={({ pressed }) => {
        const variantStyle = getVariantStyle(variant, pressed, isDisabled);
        return {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          minHeight: sizeConfig.minHeight,
          ...variantStyle.container,
          ...style,
        };
      }}
    >
      {({ pressed }) => {
        const variantStyle = getVariantStyle(variant, pressed, isDisabled);

        if (loading) {
          return (
            <ActivityIndicator
              size="small"
              color={variant === 'default' ? '#0A0A0F' : Colors.accent}
            />
          );
        }

        return (
          <Text
            style={{
              fontSize: sizeConfig.fontSize,
              letterSpacing: 0.3,
              ...variantStyle.text,
            }}
          >
            {children}
          </Text>
        );
      }}
    </Pressable>
  );
}

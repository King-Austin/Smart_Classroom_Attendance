import React, { useState } from 'react';
import {
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Colors } from '@/theme/colors';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.destructive
    : focused
    ? Colors.accent
    : Colors.border;

  return (
    <View className={className} style={{ gap: 6 }}>
      {label ? (
        <Text
          style={{
            color: Colors.mutedForeground,
            fontSize: 13,
            fontWeight: '500',
            letterSpacing: 0.4,
          }}
        >
          {label}
        </Text>
      ) : null}

      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor={Colors.mutedForeground}
        style={[
          {
            backgroundColor: Colors.muted,
            borderWidth: 1.5,
            borderColor,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            fontSize: 15,
            color: Colors.foreground,
            minHeight: 48,
          },
          style,
        ]}
      />

      {error ? (
        <Text
          style={{
            color: Colors.destructive,
            fontSize: 12,
            fontWeight: '500',
            letterSpacing: 0.2,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

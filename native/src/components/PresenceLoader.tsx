import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/theme/colors';

export interface PresenceLoaderProps {
  message?: string;
}

const PULSE_DURATION = 900; // ms per half-cycle

export function PresenceLoader({ message }: PresenceLoaderProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // infinite
      false,
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      {/* Outer glow ring */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[
            {
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: Colors.accent,
              shadowColor: Colors.accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 16,
              elevation: 12,
            },
            animatedStyle,
          ]}
        />
      </View>

      {message ? (
        <Text
          style={{
            color: Colors.mutedForeground,
            fontSize: 14,
            fontWeight: '500',
            letterSpacing: 0.4,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

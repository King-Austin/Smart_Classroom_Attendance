import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface AttendancePingerProps {
  hasActiveSessions: boolean;
}

export default function AttendancePinger({
  hasActiveSessions,
}: AttendancePingerProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (hasActiveSessions) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(opacity);
      opacity.value = withTiming(1.0, { duration: 300 });
    }
  }, [hasActiveSessions, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.badge,
        hasActiveSessions ? styles.badgeActive : styles.badgeInactive,
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.dot,
          hasActiveSessions ? styles.dotActive : styles.dotInactive,
        ]}
      />
      <Text
        style={[
          styles.label,
          hasActiveSessions ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {hasActiveSessions ? 'LIVE' : 'No Active Sessions'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#22C55E',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  labelActive: {
    color: '#22C55E',
  },
  labelInactive: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
    letterSpacing: 0,
    fontSize: 12,
  },
});

/**
 * Smart Campus Presence — Landing Screen
 *
 * Entry point for unauthenticated users. Shows the brand hero, animated
 * background glows, feature pills, and CTA buttons to sign up or log in.
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Colors } from '@/theme/colors';
import type { AuthStackParamList } from '@/navigation/types';

type LandingNav = NativeStackNavigationProp<AuthStackParamList, 'Landing'>;

// ---------------------------------------------------------------------------
// Animated glow blob
// ---------------------------------------------------------------------------

interface GlowProps {
  color: string;
  size: number;
  style: object;
  delay?: number;
}

function GlowBlob({ color, size, style, delay = 0 }: GlowProps) {
  const opacity = useSharedValue(0.12);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.32, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
        animStyle,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Feature pill data
// ---------------------------------------------------------------------------

const FEATURES = [
  { label: 'Face Scan', icon: '◎' },
  { label: 'BLE Proximity', icon: '⬡' },
  { label: 'GPS Fence', icon: '⊕' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LandingScreen() {
  const navigation = useNavigation<LandingNav>();

  // Hero fade-in
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(24);
  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 600 });
    heroTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
  }, []);
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  // Pills fade-in (delayed)
  const pillsOpacity = useSharedValue(0);
  useEffect(() => {
    pillsOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
  }, []);
  const pillsStyle = useAnimatedStyle(() => ({ opacity: pillsOpacity.value }));

  // CTA fade-in (delayed more)
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(20);
  useEffect(() => {
    ctaOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    ctaTranslateY.value = withDelay(500, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
  }, []);
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Animated background blobs */}
      <GlowBlob
        color={Colors.accent}
        size={340}
        delay={0}
        style={{ top: -60, right: -80 }}
      />
      <GlowBlob
        color={Colors.purple}
        size={300}
        delay={800}
        style={{ bottom: -60, left: -80 }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <Animated.View style={[styles.hero, heroStyle]}>
          {/* Logo badge */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⬡</Text>
          </View>

          <Text style={styles.eyebrow}>PRESENCE</Text>
          <Text style={styles.title}>Smart Campus{'\n'}Attendance</Text>
          <Text style={styles.subtitle}>
            Fast, secure, multi-factor attendance tracking for your university
            classes.
          </Text>
        </Animated.View>

        {/* ── Feature pills ── */}
        <Animated.View style={[styles.pillsRow, pillsStyle]}>
          {FEATURES.map(({ label, icon }) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillIcon}>{icon}</Text>
              <Text style={styles.pillLabel}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── CTA buttons ── */}
        <Animated.View style={[styles.ctaBlock, ctaStyle]}>
          <Button
            onPress={() =>
              navigation.navigate('RegisterStack')
            }
            size="lg"
            style={styles.primaryBtn}
          >
            Student Sign Up
          </Button>

          <Button
            onPress={() => navigation.navigate('LecturerRegister')}
            variant="outline"
            size="lg"
          >
            Lecturer Sign Up
          </Button>

          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => [styles.signInLink, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.signInText}>
              Already registered?{' '}
              <Text style={styles.signInAccent}>Sign In</Text>
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerPowered}>Powered by</Text>
          <Text style={styles.footerUniversity}>
            Nnamdi Azikiwe University
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(20,20,28,0.8)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 36,
    color: Colors.accent,
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 5,
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  // Feature pills
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 48,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillIcon: {
    fontSize: 13,
    color: Colors.accent,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.foreground,
    textTransform: 'uppercase',
  },
  // CTA
  ctaBlock: {
    width: '100%',
    maxWidth: 360,
    gap: 14,
    alignItems: 'stretch',
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  signInText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  signInAccent: {
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
  // Footer
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerDivider: {
    width: 32,
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  footerPowered: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footerUniversity: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
    marginTop: 4,
  },
});

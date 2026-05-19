import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Network detection
// ---------------------------------------------------------------------------
// We avoid `@react-native-community/netinfo` because it may not be installed.
// Instead we poll a lightweight HEAD request every POLL_INTERVAL ms.
// On RN ≥0.72 the fetch API is globally available via the JS runtime.
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 10_000; // 10 seconds
const PROBE_URL = 'https://www.google.com';
const PROBE_TIMEOUT = 5_000; // 5 seconds

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
    const res = await fetch(PROBE_URL, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animateBanner = useCallback((show: boolean) => {
    Animated.spring(translateY, {
      toValue: show ? 0 : -60,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [translateY]);

  const poll = useCallback(async () => {
    const online = await checkConnectivity();
    setIsOffline((prev) => {
      if (prev === !online) return prev; // no change
      animateBanner(!online);
      return !online;
    });
  }, [animateBanner]);

  useEffect(() => {
    // Initial check
    poll();

    // Recurring poll
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [poll]);

  // Always render so the animation can slide in/out — but keep it invisible
  // when online via translateY transform.
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          backgroundColor: Colors.destructive,
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {/* Simple dot indicator */}
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#FFFFFF',
            opacity: 0.9,
          }}
        />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 0.3,
          }}
        >
          No Internet Connection
        </Text>
      </View>
    </Animated.View>
  );
}

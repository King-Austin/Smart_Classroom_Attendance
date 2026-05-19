/**
 * Smart Campus Presence — RootNavigator
 *
 * Single source of truth for which top-level navigator is shown.
 * Responsibilities:
 *   1. Check Supabase session on mount.
 *   2. Fetch the user's profile from the `profiles` table.
 *   3. Render the correct navigator (AuthStack / StudentTabs / LecturerTabs).
 *   4. React to real-time auth state changes via onAuthStateChange.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthChangeEvent, Session, Subscription } from '@supabase/supabase-js';

import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';
import type { RootStackParamList } from './types';
import { Colors } from '@/theme/colors';

import AuthStack from './AuthStack';
import StudentTabs from './StudentTabs';
import LecturerTabs from './LecturerTabs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthState = 'loading' | 'unauthenticated' | 'student' | 'lecturer';

// ---------------------------------------------------------------------------
// Loading screen
// ---------------------------------------------------------------------------

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Root stack (top-level navigator that switches between the three sub-trees)
// ---------------------------------------------------------------------------

const Root = createNativeStackNavigator<RootStackParamList>();

// ---------------------------------------------------------------------------
// RootNavigator
// ---------------------------------------------------------------------------

export default function RootNavigator() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  // Keep a stable ref so the auth-state-change listener can read it without
  // becoming a stale closure dependency.
  const authStateRef = useRef<AuthState>('loading');

  // ------------------------------------------------------------------
  // Resolve the auth state given a Supabase session
  // ------------------------------------------------------------------

  const resolveAuthState = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      authStateRef.current = 'unauthenticated';
      setAuthState('unauthenticated');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single<Pick<Profile, 'role'>>();

      if (error || !data) {
        // Profile missing — treat as unauthenticated until profile is created
        authStateRef.current = 'unauthenticated';
        setAuthState('unauthenticated');
        return;
      }

      const next: AuthState =
        data.role === 'lecturer' ? 'lecturer' : 'student';
      authStateRef.current = next;
      setAuthState(next);
    } catch {
      authStateRef.current = 'unauthenticated';
      setAuthState('unauthenticated');
    }
  }, []);

  // ------------------------------------------------------------------
  // Bootstrap — check stored session on mount
  // ------------------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        await resolveAuthState(session);
      }
    })();

    // ------------------------------------------------------------------
    // Listen for real-time auth events
    // ------------------------------------------------------------------

    const { data: listenerData }: { data: { subscription: Subscription } } =
      supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (!mounted) return;

          switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
            case 'USER_UPDATED':
              await resolveAuthState(session);
              break;

            case 'SIGNED_OUT':
              authStateRef.current = 'unauthenticated';
              setAuthState('unauthenticated');
              break;

            default:
              // INITIAL_SESSION, PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED, etc.
              // Re-resolve to stay consistent.
              if (session) {
                await resolveAuthState(session);
              }
              break;
          }
        },
      );

    return () => {
      mounted = false;
      listenerData.subscription.unsubscribe();
    };
  }, [resolveAuthState]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (authState === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: Colors.accent,
          background: Colors.background,
          card: Colors.card,
          text: Colors.foreground,
          border: Colors.border,
          notification: Colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {authState === 'unauthenticated' ? (
          <Root.Screen name="AuthStack" component={AuthStack} />
        ) : authState === 'student' ? (
          <Root.Screen name="StudentTabs" component={StudentTabs} />
        ) : (
          <Root.Screen name="LecturerTabs" component={LecturerTabs} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

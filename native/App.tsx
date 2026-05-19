/**
 * Smart Campus Presence — App.tsx
 *
 * Root component. Provides all global context providers and mounts the
 * navigation tree. The NavigationContainer itself lives inside RootNavigator
 * so auth-state-driven navigation can happen before the container renders.
 *
 * Provider order (outer → inner):
 *   GestureHandlerRootView  — required by react-native-gesture-handler / Reanimated
 *     SafeAreaProvider      — safe-area insets for all descendants
 *       QueryClientProvider — TanStack Query global cache
 *         RootNavigator     — NavigationContainer + role-based navigator switching
 *   Toast                   — rendered outside NavigationContainer so it always appears
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import RootNavigator from '@/navigation/RootNavigator';

// ---------------------------------------------------------------------------
// TanStack Query client
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries once before surfacing the error.
      retry: 1,
      // Consider data fresh for 30 s to reduce redundant network calls.
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {/*
           * RootNavigator owns the NavigationContainer. It checks the
           * Supabase session on mount and renders AuthStack, StudentTabs, or
           * LecturerTabs based on the user's role.
           */}
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>

      {/*
       * Toast must be the last child so it renders above everything else,
       * including any modal layers inside NavigationContainer.
       */}
      <Toast />
    </GestureHandlerRootView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E0E12',
  },
});

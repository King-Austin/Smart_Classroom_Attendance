/**
 * Smart Campus Presence — NotFoundScreen
 *
 * Fallback 404 screen shown when navigation resolves to an unknown route.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Button } from '@/components/ui';
import { Colors } from '@/theme/colors';

export default function NotFoundScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The screen you are looking for does not exist or has been moved.
        </Text>

        <Button
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          variant="outline"
          size="lg"
        >
          Go Back
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  code: {
    fontSize: 72,
    fontWeight: '900',
    color: Colors.accent,
    letterSpacing: -2,
    opacity: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
});

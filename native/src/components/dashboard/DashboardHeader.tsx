/**
 * Smart Campus Presence — DashboardHeader (Lecturer)
 *
 * Shows a time-aware greeting, the lecturer's first name, department subtitle,
 * and a logout Pressable. Dark background with a subtle bottom border.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { Colors } from '@/theme/colors';
import { Profile } from '@/types';

interface DashboardHeaderProps {
  profile: Profile | null;
  onLogout: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHeader({ profile, onLogout }: DashboardHeaderProps) {
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Lecturer';
  const greeting = getGreeting();

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
      }}
    >
      {/* Left: label + greeting + department */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            color: Colors.accent,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          Lecturer Dashboard
        </Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: Colors.foreground,
            letterSpacing: -0.5,
          }}
        >
          {greeting}, {firstName}
        </Text>
        {profile?.department ? (
          <Text
            style={{
              fontSize: 11,
              color: Colors.mutedForeground,
              marginTop: 2,
              fontWeight: '500',
            }}
          >
            {profile.department}
          </Text>
        ) : null}
      </View>

      {/* Right: logout button */}
      <Pressable
        onPress={onLogout}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: pressed ? 'rgba(239,68,68,0.12)' : Colors.card,
          borderWidth: 1,
          borderColor: pressed ? 'rgba(239,68,68,0.35)' : Colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        })}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <LogOut size={16} color={Colors.destructive} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

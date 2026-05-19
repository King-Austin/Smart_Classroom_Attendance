/**
 * Smart Campus Presence — LecturerTabs
 *
 * Bottom-tab navigator for authenticated lecturers.
 *
 *  Tab 1 — Dashboard  → LecturerStack (Dashboard → CreateSession / LiveSession)
 *  Tab 2 — Analytics  → (placeholder — future analytics screen)
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, BarChart3 } from 'lucide-react-native';

import type { LecturerStackParamList } from './types';
import { Colors } from '@/theme/colors';

// Screen implementations are in @/screens — written by parallel agents
import LecturerDashboardScreen from '@/screens/LecturerDashboardScreen';
import CreateSessionScreen from '@/screens/CreateSessionScreen';
import LiveSessionScreen from '@/screens/LiveSessionScreen';
import AnalyticsScreen from '@/screens/AnalyticsScreen';

// ---------------------------------------------------------------------------
// Lecturer stack (lives inside the Dashboard tab)
// ---------------------------------------------------------------------------

const LecturerNav = createNativeStackNavigator<LecturerStackParamList>();

function LecturerStack() {
  return (
    <LecturerNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <LecturerNav.Screen name="LecturerDashboard" component={LecturerDashboardScreen} />
      <LecturerNav.Screen name="CreateSession" component={CreateSessionScreen} />
      <LecturerNav.Screen name="LiveSession" component={LiveSessionScreen} />
    </LecturerNav.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Tab bar icon helpers
// ---------------------------------------------------------------------------

type TabIconProps = {
  color: string;
  size: number;
  focused: boolean;
};

function DashboardIcon({ color, size }: TabIconProps) {
  return <LayoutDashboard color={color} size={size} strokeWidth={2} />;
}

function AnalyticsIcon({ color, size }: TabIconProps) {
  return <BarChart3 color={color} size={size} strokeWidth={2} />;
}

// ---------------------------------------------------------------------------
// Bottom tab navigator
// ---------------------------------------------------------------------------

const Tab = createBottomTabNavigator();

export default function LecturerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={LecturerStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: AnalyticsIcon,
        }}
      />
    </Tab.Navigator>
  );
}

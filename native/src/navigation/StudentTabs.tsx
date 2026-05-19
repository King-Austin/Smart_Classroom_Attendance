/**
 * Smart Campus Presence — StudentTabs
 *
 * Bottom-tab navigator for authenticated students.
 *
 *  Tab 1 — Home    → StudentStack (Dashboard → Verification / Ledger)
 *  Tab 2 — History → AttendanceLedgerScreen (no sessionId → full history)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, ClipboardList } from 'lucide-react-native';

import type { StudentStackParamList } from './types';
import { Colors } from '@/theme/colors';

// Screen implementations are in @/screens — written by parallel agents
import StudentDashboardScreen from '@/screens/StudentDashboardScreen';
import AttendanceVerificationScreen from '@/screens/AttendanceVerificationScreen';
import AttendanceLedgerScreen from '@/screens/AttendanceLedgerScreen';

// ---------------------------------------------------------------------------
// Student stack (lives inside the Home tab)
// ---------------------------------------------------------------------------

const StudentNav = createNativeStackNavigator<StudentStackParamList>();

function StudentStack() {
  return (
    <StudentNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <StudentNav.Screen name="StudentDashboard" component={StudentDashboardScreen} />
      <StudentNav.Screen
        name="AttendanceVerification"
        component={AttendanceVerificationScreen}
      />
      <StudentNav.Screen name="AttendanceLedger" component={AttendanceLedgerScreen} />
    </StudentNav.Navigator>
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

function HomeIcon({ color, size }: TabIconProps) {
  return <Home color={color} size={size} strokeWidth={2} />;
}

function HistoryIcon({ color, size }: TabIconProps) {
  return <ClipboardList color={color} size={size} strokeWidth={2} />;
}

// ---------------------------------------------------------------------------
// History tab wrapper — passes undefined sessionId so the screen shows all
// records for the current student.
// ---------------------------------------------------------------------------

function HistoryTabScreen() {
  // AttendanceLedgerScreen is rendered directly; sessionId is undefined which
  // signals "full history mode" to the screen implementation.
  return (
    <View style={styles.fill}>
      <AttendanceLedgerScreen
        // The screen will receive navigation & route from the tab navigator.
        // We cast here because we're embedding it without a stack wrapper;
        // the screen must handle an absent sessionId gracefully.
        route={{ key: 'History', name: 'AttendanceLedger', params: { sessionId: undefined } } as any}
        navigation={undefined as any}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bottom tab navigator
// ---------------------------------------------------------------------------

const Tab = createBottomTabNavigator();

export default function StudentTabs() {
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
        name="Home"
        component={StudentStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryTabScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: HistoryIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

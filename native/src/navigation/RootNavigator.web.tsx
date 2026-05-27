/**
 * Web-only gallery navigator.
 *
 * Bypasses Supabase auth and exposes every screen via a URL so a headless
 * browser can visit each one for visual previews. Replaces the real
 * RootNavigator only on platform=web (metro picks `.web.tsx` automatically).
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Colors } from '@/theme/colors';

import LandingScreen from '@/screens/LandingScreen';
import LoginScreen from '@/screens/LoginScreen';
import LecturerRegisterScreen from '@/screens/LecturerRegisterScreen';
import BasicInfoScreen from '@/screens/register/BasicInfoScreen';
import CourseSelectScreen from '@/screens/register/CourseSelectScreen';
import FaceEnrollScreen from '@/screens/register/FaceEnrollScreen';
import StudentDashboardScreen from '@/screens/StudentDashboardScreen';
import LecturerDashboardScreen from '@/screens/LecturerDashboardScreen';
import CreateSessionScreen from '@/screens/CreateSessionScreen';
import LiveSessionScreen from '@/screens/LiveSessionScreen';
import AttendanceVerificationScreen from '@/screens/AttendanceVerificationScreen';
import AttendanceLedgerScreen from '@/screens/AttendanceLedgerScreen';
import AnalyticsScreen from '@/screens/AnalyticsScreen';
import NotFoundScreen from '@/screens/NotFoundScreen';

const Gallery = createNativeStackNavigator();

const linking = {
  prefixes: ['http://localhost'],
  config: {
    screens: {
      Landing: '',
      Login: 'login',
      LecturerRegister: 'lecturer-register',
      BasicInfo: 'register/basic',
      CourseSelect: 'register/courses',
      FaceEnroll: 'register/face',
      StudentDashboard: 'student',
      LecturerDashboard: 'lecturer',
      CreateSession: 'lecturer/create',
      LiveSession: 'lecturer/live/:sessionId',
      AttendanceVerification: 'student/verify/:sessionId',
      AttendanceLedger: 'student/ledger',
      Analytics: 'lecturer/analytics',
      NotFound: 'not-found',
    },
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer
      linking={linking}
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
      <Gallery.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Gallery.Screen name="Landing" component={LandingScreen} />
        <Gallery.Screen name="Login" component={LoginScreen} />
        <Gallery.Screen name="LecturerRegister" component={LecturerRegisterScreen} />
        <Gallery.Screen name="BasicInfo" component={BasicInfoScreen} />
        <Gallery.Screen
          name="CourseSelect"
          component={CourseSelectScreen}
          initialParams={{
            fullName: 'Jane Doe',
            email: 'jane@university.edu',
            password: '••••••••',
            regNumber: '2021364001',
            faculty: 'Engineering',
            department: 'Electronic and Computer Engineering',
            level: '300',
            semester: '1',
          }}
        />
        <Gallery.Screen
          name="FaceEnroll"
          component={FaceEnrollScreen}
          initialParams={{
            fullName: 'Jane Doe',
            email: 'jane@university.edu',
            password: '••••••••',
            regNumber: '2021364001',
            faculty: 'Engineering',
            department: 'Electronic and Computer Engineering',
            level: '300',
            semester: '1',
            courseIds: [],
          }}
        />
        <Gallery.Screen name="StudentDashboard" component={StudentDashboardScreen} />
        <Gallery.Screen name="LecturerDashboard" component={LecturerDashboardScreen} />
        <Gallery.Screen name="CreateSession" component={CreateSessionScreen} />
        <Gallery.Screen
          name="LiveSession"
          component={LiveSessionScreen}
          initialParams={{ sessionId: 'preview-session' }}
        />
        <Gallery.Screen
          name="AttendanceVerification"
          component={AttendanceVerificationScreen}
          initialParams={{ sessionId: 'preview-session' }}
        />
        <Gallery.Screen name="AttendanceLedger" component={AttendanceLedgerScreen} />
        <Gallery.Screen name="Analytics" component={AnalyticsScreen} />
        <Gallery.Screen name="NotFound" component={NotFoundScreen} />
      </Gallery.Navigator>
    </NavigationContainer>
  );
}

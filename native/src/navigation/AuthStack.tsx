/**
 * Smart Campus Presence — AuthStack
 *
 * Hosts all unauthenticated screens including the multi-step student
 * registration sub-navigator (RegisterStack).
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList, RegisterStackParamList } from './types';

// Screen implementations are in @/screens — written by parallel agents
import LandingScreen from '@/screens/LandingScreen';
import LoginScreen from '@/screens/LoginScreen';
import LecturerRegisterScreen from '@/screens/LecturerRegisterScreen';
import BasicInfoScreen from '@/screens/register/BasicInfoScreen';
import CourseSelectScreen from '@/screens/register/CourseSelectScreen';
import FaceEnrollScreen from '@/screens/register/FaceEnrollScreen';

// ---------------------------------------------------------------------------
// Nested registration stack
// ---------------------------------------------------------------------------

const RegisterNav = createNativeStackNavigator<RegisterStackParamList>();

function RegisterStack() {
  return (
    <RegisterNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0E0E12' },
        animation: 'slide_from_right',
      }}
    >
      <RegisterNav.Screen name="BasicInfo" component={BasicInfoScreen} />
      <RegisterNav.Screen name="CourseSelect" component={CourseSelectScreen} />
      <RegisterNav.Screen name="FaceEnroll" component={FaceEnrollScreen} />
    </RegisterNav.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Main auth stack
// ---------------------------------------------------------------------------

const AuthNav = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <AuthNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0E0E12' },
        animation: 'fade',
      }}
    >
      <AuthNav.Screen name="Landing" component={LandingScreen} />
      <AuthNav.Screen name="Login" component={LoginScreen} />
      {/*
       * RegisterStack is a component that renders its own NativeStackNavigator.
       * We wrap it as a screen so the auth navigator can push onto it without
       * exposing the nested screens in the auth param list.
       */}
      <AuthNav.Screen
        name="RegisterStack"
        component={RegisterStack}
        options={{ animation: 'slide_from_right' }}
      />
      <AuthNav.Screen name="LecturerRegister" component={LecturerRegisterScreen} />
    </AuthNav.Navigator>
  );
}

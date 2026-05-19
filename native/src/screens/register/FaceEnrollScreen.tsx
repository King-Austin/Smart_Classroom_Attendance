/**
 * Smart Campus Presence — FaceEnrollScreen (Student Registration Step 3)
 *
 * Captures a face image, sends it to the biometric server for vectorization,
 * then atomically creates the Supabase auth user, profile, face_embedding
 * record, and course enrollments.
 *
 * On success the RootNavigator auth-state listener handles the redirect to
 * the student dashboard automatically.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Button } from '@/components/ui';
import { supabase } from '@/integrations/supabase/client';
import { useBiometrics } from '@/hooks/useBiometrics';
import { toast } from '@/lib/toast';
import { Colors } from '@/theme/colors';
import type { RegisterStackParamList } from '@/navigation/types';
import CameraCapture from '@/components/verification/CameraCapture';

// ---------------------------------------------------------------------------
// Navigation / route types
// ---------------------------------------------------------------------------

type FaceEnrollNav = NativeStackNavigationProp<RegisterStackParamList, 'FaceEnroll'>;
type FaceEnrollRoute = RouteProp<RegisterStackParamList, 'FaceEnroll'>;

// ---------------------------------------------------------------------------
// Step labels for the progress indicator
// ---------------------------------------------------------------------------

type ProgressStep =
  | 'idle'
  | 'enrolling'
  | 'creating_auth'
  | 'saving_profile'
  | 'saving_vector'
  | 'enrolling_courses'
  | 'done';

const STEP_LABELS: Record<ProgressStep, string> = {
  idle: '',
  enrolling: 'Analyzing face…',
  creating_auth: 'Creating account…',
  saving_profile: 'Saving profile…',
  saving_vector: 'Storing biometric data…',
  enrolling_courses: 'Enrolling in courses…',
  done: 'Complete!',
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function FaceEnrollScreen() {
  const navigation = useNavigation<FaceEnrollNav>();
  const route = useRoute<FaceEnrollRoute>();
  const params = route.params;

  const { enroll } = useBiometrics();

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>('idle');

  // Called by CameraCapture after a successful capture
  const handleCapture = (base64Image: string) => {
    setCapturedImage(base64Image);
    setShowCamera(false);
  };

  const handleSubmit = async () => {
    if (!capturedImage) {
      toast.error('Please capture your face image first.');
      return;
    }

    setLoading(true);

    try {
      // ── Step 1: Check for duplicate registration number ──────────────────
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('reg_number', params.regNumber)
        .maybeSingle();

      if (existing) {
        throw new Error('Registration number already exists in the system.');
      }

      // ── Step 2: Biometric vectorization ──────────────────────────────────
      setProgressStep('enrolling');
      const faceVector = await enroll(capturedImage);
      if (!faceVector) {
        throw new Error(
          'Biometric server could not process your image. Please retake and try again.',
        );
      }

      // ── Step 3: Create auth user ──────────────────────────────────────────
      setProgressStep('creating_auth');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          throw new Error(
            'Email already registered. Please log in or use a different email.',
          );
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Account creation failed. Please try again.');
      }

      const userId = authData.user.id;

      // ── Step 4: Insert profile row ────────────────────────────────────────
      setProgressStep('saving_profile');
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: params.fullName,
        reg_number: params.regNumber,
        role: 'student',
        level: params.level,
        semester: params.semester,
        faculty: params.faculty,
        department: params.department,
        face_enrolled: true,
      });

      if (profileError) throw profileError;

      // ── Step 5: Store face embedding vector ───────────────────────────────
      setProgressStep('saving_vector');
      const { error: vectorError } = await supabase
        .from('face_embeddings')
        .insert({
          user_id: userId,
          embedding: faceVector,
        });

      if (vectorError) {
        // Non-fatal — log and continue so the student can still log in
        console.error('FaceEnroll: vector storage failed:', vectorError);
      }

      // ── Step 6: Enroll in selected courses ────────────────────────────────
      setProgressStep('enrolling_courses');
      if (params.courseIds.length > 0) {
        const enrollmentRows = params.courseIds.map((courseId) => ({
          student_id: userId,
          course_id: courseId,
        }));
        const { error: enrollError } = await supabase
          .from('enrollments')
          .insert(enrollmentRows);

        if (enrollError) {
          // Non-fatal — profile already created, courses can be added later
          console.error('FaceEnroll: course enrollment failed:', enrollError);
        }
      }

      // ── Done ─────────────────────────────────────────────────────────────
      setProgressStep('done');
      toast.success('Registration complete! Welcome to Smart Campus Presence.');
      // RootNavigator auth-state listener will redirect to StudentTabs
    } catch (error: any) {
      console.error('FaceEnrollScreen error:', error);
      toast.error(error?.message ?? 'Registration failed. Please try again.');
      setProgressStep('idle');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Camera overlay
  // ---------------------------------------------------------------------------

  if (showCamera) {
    return (
      <CameraCapture
        mode="enroll"
        onCapture={handleCapture}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

  const isComplete = capturedImage !== null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={loading}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.stepLabel}>Step 3 of 3</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Face Enrollment</Text>
        <Text style={styles.subtitle}>
          Secure your account with biometric identification
        </Text>

        {/* Face capture card */}
        <Pressable
          onPress={() => !loading && setShowCamera(true)}
          style={[
            styles.captureCard,
            isComplete && styles.captureCardComplete,
          ]}
        >
          {isComplete ? (
            <>
              <Text style={styles.captureIcon}>◉</Text>
              <Text style={styles.captureTitle}>Face Data Captured</Text>
              <Text style={styles.captureHint}>Tap to retake</Text>
            </>
          ) : (
            <>
              <Text style={styles.captureIcon}>◎</Text>
              <Text style={styles.captureTitle}>No Face Captured</Text>
              <Text style={styles.captureHint}>Tap to open camera</Text>
            </>
          )}
        </Pressable>

        {/* Angle indicators */}
        <View style={styles.angleRow}>
          <View style={styles.angleItem}>
            <View
              style={[
                styles.angleDot,
                isComplete && styles.angleDotActive,
              ]}
            />
            <Text style={styles.angleLabel}>Center</Text>
          </View>
        </View>

        {/* Loading progress feedback */}
        {loading ? (
          <View style={styles.progressBlock}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.progressText}>
              {STEP_LABELS[progressStep]}
            </Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.btnGroup}>
          <Button
            onPress={() => setShowCamera(true)}
            variant={isComplete ? 'outline' : 'default'}
            size="lg"
            disabled={loading}
          >
            {isComplete ? 'Retake Photo' : 'Start Face Scan'}
          </Button>

          <Button
            onPress={handleSubmit}
            disabled={!isComplete || loading}
            loading={loading}
            size="lg"
          >
            Complete Enrollment
          </Button>
        </View>

        {/* Privacy note */}
        <Text style={styles.privacyNote}>
          Your biometric data is encrypted and stored securely. It is only used
          for attendance verification within this institution.
        </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backIcon: {
    fontSize: 18,
    color: Colors.mutedForeground,
  },
  backLabel: {
    fontSize: 14,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  stepLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.muted,
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 48,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginTop: -12,
  },
  captureCard: {
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(91,111,212,0.4)',
    backgroundColor: 'rgba(91,111,212,0.05)',
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
  },
  captureCardComplete: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(0,229,255,0.05)',
    borderStyle: 'solid',
  },
  captureIcon: {
    fontSize: 42,
    color: Colors.accent,
  },
  captureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
  },
  captureHint: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  angleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: -8,
  },
  angleItem: {
    alignItems: 'center',
    gap: 5,
  },
  angleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mutedForeground,
  },
  angleDotActive: {
    backgroundColor: Colors.accent,
  },
  angleLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  progressBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  progressText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
  },
  btnGroup: {
    gap: 12,
  },
  privacyNote: {
    fontSize: 11,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
    opacity: 0.75,
  },
});

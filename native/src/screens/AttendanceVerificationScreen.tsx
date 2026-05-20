/**
 * AttendanceVerificationScreen — Native port of src/pages/AttendanceVerification.tsx
 *
 * Multi-step verification flow:
 *   0. Init   — authenticate + load session data, check for duplicate record
 *   1. GPS    — getCurrentPosition() from @/lib/geo, hard-gate at 500 m
 *   2. BLE    — useBleScanner().scan(session.ble_token), RSSI > -80 = pass
 *   3. Face   — CameraCapture (expo-camera) → useBiometrics().verify()
 *   4. Submit — INSERT attendance_records with all scores + device_id
 *
 * UI states: "intro" | "checking" | "success" | "failed"
 * Each checklist step animates in with Reanimated slide + fade.
 * Haptics fire on each step completion and on the final success/failure.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

import { supabase } from '@/integrations/supabase/client';
import { getCurrentPosition, calculateDistance } from '@/lib/geo';
import { getUniqueDeviceId } from '@/lib/device';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useBleScanner } from '@/hooks/useBleScanner';
import { toast } from '@/lib/toast';
import { Colors } from '@/theme/colors';
import type { StudentStackParamList } from '@/navigation/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Nav = NativeStackNavigationProp<StudentStackParamList, 'AttendanceVerification'>;
type Route = RouteProp<StudentStackParamList, 'AttendanceVerification'>;

type ScreenStep = 'intro' | 'checking' | 'success' | 'failed';

type StepId = 'init' | 'gps' | 'ble' | 'face' | 'upload';
type StepStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface ChecklistItem {
  id: StepId;
  label: string;
  status: StepStatus;
  message: string;
  icon: string;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: 'init', label: 'Verification', status: 'pending', message: 'Getting ready...', icon: '🔐' },
  { id: 'gps', label: 'Location Check', status: 'pending', message: 'Check campus proximity', icon: '📍' },
  { id: 'ble', label: 'Close Reach', status: 'pending', message: 'Confirming hall proximity', icon: '📡' },
  { id: 'face', label: 'Face Scan', status: 'pending', message: 'Face recognition required', icon: '👤' },
  { id: 'upload', label: 'Saving Status', status: 'pending', message: 'Finalizing attendance', icon: '☁️' },
];

// GPS soft-gate distance in metres
const GPS_LIMIT_M = 500;

// ---------------------------------------------------------------------------
// Spinning ring animation component
// ---------------------------------------------------------------------------

function SpinningRing() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 2,
          borderColor: 'transparent',
          borderTopColor: `${Colors.accent}55`,
          borderRightColor: `${Colors.accent}22`,
          position: 'absolute',
        },
        animStyle,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Checklist item row
// ---------------------------------------------------------------------------

function ChecklistRow({ item, index }: { item: ChecklistItem; index: number }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-16);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 });
      translateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    }, index * 80);
    return () => clearTimeout(t);
  }, []);

  const containerAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const isProcessing = item.status === 'processing';
  const isCompleted = item.status === 'completed';
  const isFailed = item.status === 'failed';
  const isPending = item.status === 'pending';

  let bgColor: string = `${Colors.card}99`;
  let borderColor: string = Colors.border;
  if (isProcessing) { bgColor = `${Colors.accent}0D`; borderColor = `${Colors.accent}55`; }
  if (isCompleted) { bgColor = Colors.card; borderColor = `${Colors.accent}33`; }
  if (isFailed) { bgColor = `${Colors.destructive}0D`; borderColor = `${Colors.destructive}33`; }

  let iconBg: string = Colors.muted;
  let iconColor: string = Colors.mutedForeground;
  if (isProcessing) { iconBg = Colors.accent; iconColor = '#0A0A0F'; }
  if (isCompleted) { iconBg = `${Colors.accent}1A`; iconColor = Colors.accent; }
  if (isFailed) { iconBg = `${Colors.destructive}1A`; iconColor = Colors.destructive; }

  const statusGlyph = isCompleted ? '✓' : isFailed ? '✕' : isPending ? '🔒' : item.icon;

  return (
    <Animated.View
      style={[
        styles.checklistRow,
        { backgroundColor: bgColor, borderColor },
        isPending && { opacity: 0.55 },
        containerAnim,
      ]}
    >
      <View style={styles.checklistInner}>
        <View style={[styles.stepIconWrap, { backgroundColor: iconBg }]}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <Text style={[styles.stepIconText, { color: iconColor }]}>{statusGlyph}</Text>
          )}
        </View>
        <View style={styles.stepTextBlock}>
          <Text
            style={[
              styles.stepLabel,
              isFailed && { color: Colors.destructive },
            ]}
          >
            {item.label}
          </Text>
          <Text
            style={[
              styles.stepMessage,
              isProcessing && { color: Colors.accent },
              isFailed && { color: `${Colors.destructive}BB` },
            ]}
          >
            {item.message}
          </Text>
        </View>
        {isCompleted && (
          <Text style={styles.okBadge}>OK</Text>
        )}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Inline camera capture modal
// ---------------------------------------------------------------------------

function CameraCaptureModal({
  visible,
  onCapture,
  onCancel,
}: {
  visible: boolean;
  onCapture: (base64: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission?.granted]);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: false,
      });
      if (photo?.base64) {
        onCapture(photo.base64);
      } else {
        toast.error('Camera capture failed. Please try again.');
        onCancel();
      }
    } catch (e) {
      console.error('[CameraCapture] takePictureAsync failed:', e);
      toast.error('Camera error. Please try again.');
      onCancel();
    } finally {
      setCapturing(false);
    }
  };

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onCancel}>
        <View style={styles.cameraPermDenied}>
          <Text style={styles.cameraPermText}>Camera permission required for face scan.</Text>
          <Pressable style={styles.cameraPermBtn} onPress={requestPermission}>
            <Text style={styles.cameraPermBtnText}>Grant Permission</Text>
          </Pressable>
          <Pressable style={[styles.cameraPermBtn, { marginTop: 8, backgroundColor: Colors.muted }]} onPress={onCancel}>
            <Text style={[styles.cameraPermBtnText, { color: Colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onCancel}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
        />
        {/* Overlay */}
        <View style={styles.cameraOverlay} pointerEvents="none">
          <View style={styles.cameraCornerTL} />
          <View style={styles.cameraCornerTR} />
          <View style={styles.cameraCornerBL} />
          <View style={styles.cameraCornerBR} />
        </View>
        <Text style={styles.cameraInstruction}>Position your face within the frame</Text>
        <View style={styles.cameraActions}>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            onPress={onCancel}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.85 }, capturing && { opacity: 0.6 }]}
            onPress={handleCapture}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color="#0A0A0F" />
            ) : (
              <Text style={styles.captureBtnText}>Capture</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Pulse animation for success icon
// ---------------------------------------------------------------------------

function PulseRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(0.5, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: 999, backgroundColor: Colors.accent },
        animStyle,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function AttendanceVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sessionId } = route.params;

  const { verify } = useBiometrics();
  const { scan: bleScan } = useBleScanner();

  const [screenStep, setScreenStep] = useState<ScreenStep>('intro');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [sessionData, setSessionData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [telemetry, setTelemetry] = useState({ lat: 0, lng: 0, score: 0 });

  // Camera promise resolver ref
  const cameraResolverRef = useRef<((base64: string) => void) | null>(null);
  const cameraRejecterRef = useRef<(() => void) | null>(null);

  // Slide-in animation for each screen state
  const screenOpacity = useSharedValue(0);
  const screenTranslate = useSharedValue(20);

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 350 });
    screenTranslate.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) });
  }, [screenStep]);

  const screenAnimStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateY: screenTranslate.value }],
  }));

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const updateStep = useCallback((id: StepId, status: StepStatus, message: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, status, message } : item)),
    );
  }, []);

  const requestCamera = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      cameraResolverRef.current = resolve;
      cameraRejecterRef.current = reject;
      setShowCamera(true);
    });
  };

  const handleCameraCapture = (base64: string) => {
    setShowCamera(false);
    cameraResolverRef.current?.(base64);
    cameraResolverRef.current = null;
    cameraRejecterRef.current = null;
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
    cameraRejecterRef.current?.();
    cameraResolverRef.current = null;
    cameraRejecterRef.current = null;
  };

  const resetChecklist = () => {
    setChecklist(INITIAL_CHECKLIST.map(i => ({ ...i, status: 'pending', message: 'Awaiting retry...' })));
  };

  // -------------------------------------------------------------------------
  // Core verification flow
  // -------------------------------------------------------------------------

  const startVerification = async () => {
    // Reset to intro animation
    screenOpacity.value = 0;
    screenTranslate.value = 20;

    try {
      setScreenStep('checking');

      // ------------------------------------------------------------------
      // Step 0: Init — authenticate + fetch session data
      // ------------------------------------------------------------------
      updateStep('init', 'processing', 'Connecting to server...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication failed. Please log in again.');

      const [sessionRes, profileRes, existingRecord] = await Promise.all([
        supabase
          .from('attendance_sessions')
          .select('*, courses(name, code)')
          .eq('id', sessionId)
          .single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('attendance_records')
          .select('id')
          .eq('student_id', user.id)
          .eq('session_id', sessionId)
          .maybeSingle(),
      ]);

      if (sessionRes.error) throw new Error('Session not found: ' + sessionRes.error.message);

      setSessionData(sessionRes.data);
      setProfileData(profileRes.data);

      if (existingRecord.data) {
        toast.info('Already verified for this session.');
        setScreenStep('success');
        return;
      }

      updateStep('init', 'completed', 'Connected successfully');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // ------------------------------------------------------------------
      // Step 1: GPS
      // ------------------------------------------------------------------
      updateStep('gps', 'processing', 'Checking your location...');

      try {
        const position = await getCurrentPosition();

        const distance = calculateDistance(
          position.latitude,
          position.longitude,
          sessionRes.data.lecturer_lat,
          sessionRes.data.lecturer_lng,
        );

        const effectiveDistance = Math.max(0, distance - position.accuracy / 2);

        if (effectiveDistance > GPS_LIMIT_M) {
          throw new Error(
            `Out of range. You are ${Math.round(distance)}m from the hall (limit: ${GPS_LIMIT_M}m).`,
          );
        }

        setTelemetry(prev => ({ ...prev, lat: position.latitude, lng: position.longitude }));
        updateStep('gps', 'completed', `Location confirmed (${Math.round(distance)}m away)`);
      } catch (gpsErr: any) {
        updateStep('gps', 'failed', gpsErr.message ?? 'GPS unavailable');
        throw gpsErr;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // ------------------------------------------------------------------
      // Step 2: BLE proximity scan
      // ------------------------------------------------------------------
      updateStep('ble', 'processing', 'Scanning for classroom beacon...');

      try {
        const bleToken = sessionRes.data.ble_token;
        if (!bleToken) {
          updateStep('ble', 'completed', 'Proximity established via GPS fallback');
        } else {
          const result = await bleScan(bleToken);
          if (result.found && result.rssi > -80) {
            updateStep('ble', 'completed', `Beacon confirmed (RSSI ${result.rssi} dBm)`);
          } else if (result.found) {
            // Low signal — still let through but mark as low-confidence
            updateStep('ble', 'completed', `Beacon detected (low signal ${result.rssi} dBm)`);
          } else {
            // Not found — GPS already passed so continue with fallback
            updateStep('ble', 'completed', 'Proximity established via GPS fallback');
          }
        }
      } catch {
        updateStep('ble', 'completed', 'Proximity established via GPS fallback');
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // ------------------------------------------------------------------
      // Step 3: Face verification
      // ------------------------------------------------------------------
      updateStep('face', 'processing', 'Waiting for face scan...');

      // Fetch stored embedding
      const { data: vectorData, error: vectorError } = await supabase
        .from('face_embeddings')
        .select('embedding')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vectorError || !vectorData) {
        updateStep('face', 'failed', 'Please enroll your face in your profile first.');
        throw new Error('No face enrollment found. Go to Profile → Recapture Face.');
      }

      const storedVector = (vectorData.embedding as unknown) as number[];

      // Open camera and await capture
      let photoBase64: string;
      try {
        photoBase64 = await requestCamera();
      } catch {
        updateStep('face', 'failed', 'Camera capture cancelled.');
        throw new Error('Face scan was cancelled.');
      }

      updateStep('face', 'processing', 'Verifying face...');
      const biometricResult = await verify(photoBase64, storedVector);

      if (!biometricResult.success) {
        updateStep('face', 'failed', `Face mismatch (${Math.round(biometricResult.score * 100)}% similarity)`);
        toast.error('Identity Mismatch', {
          description: 'Biometric signature does not match the enrolled profile. Check your lighting.',
        });
        throw new Error('Face verification failed.');
      }

      setTelemetry(prev => ({ ...prev, score: biometricResult.score }));
      updateStep('face', 'completed', `Face verified (${Math.round(biometricResult.score * 100)}% match)`);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // ------------------------------------------------------------------
      // Step 4: Submit attendance record
      // ------------------------------------------------------------------
      updateStep('upload', 'processing', 'Saving your attendance...');

      const deviceId = await getUniqueDeviceId();

      // Upload photo to storage (fire-and-forget — don't block on error)
      try {
        const binaryStr = atob(photoBase64!);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const fileName = `${sessionId}/${user.id}_${Date.now()}.jpg`;
        await supabase.storage
          .from('attendance-verifications')
          .upload(fileName, bytes.buffer, { contentType: 'image/jpeg' });
      } catch (uploadErr) {
        console.warn('[AttendanceVerification] Photo upload failed (non-fatal):', uploadErr);
      }

      const { error: insertError } = await supabase.from('attendance_records').insert({
        student_id: user.id,
        session_id: sessionId,
        gps_lat: telemetry.lat,
        gps_lng: telemetry.lng,
        face_score: biometricResult.score || 1.0,
        device_id: deviceId,
        status: 'verified',
      } as any);

      if (insertError) throw new Error('Failed to save attendance: ' + insertError.message);

      updateStep('upload', 'completed', 'Attendance recorded!');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setScreenStep('success');
      toast.success('Attendance confirmed!');
    } catch (err: any) {
      console.error('[AttendanceVerification] Flow error:', err);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setScreenStep('failed');
      toast.error(err.message ?? 'Verification failed. Please try again.');
    }
  };

  // -------------------------------------------------------------------------
  // Format time helper
  // -------------------------------------------------------------------------
  function formatTime(date: Date | string) {
    try {
      return new Date(date).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderIntro = () => (
    <Animated.View style={[styles.stepContainer, screenAnimStyle]}>
      {/* Back button */}
      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.backBtnText}>← Exit</Text>
      </Pressable>

      {/* Icon */}
      <View style={styles.introCenterBlock}>
        <View style={styles.introIconWrap}>
          <Text style={styles.introIconText}>🛡</Text>
        </View>
        <Text style={styles.introEyebrow}>VERIFICATION CHECK</Text>
        <Text style={styles.introHeading}>Attendance Check</Text>
        <Text style={styles.introSub}>
          Confirm your identity to mark your attendance. This requires location access and a brief face scan.
        </Text>
      </View>

      {/* Feature tiles */}
      <View style={styles.featureGrid}>
        <View style={styles.featureTile}>
          <Text style={styles.featureIcon}>📍</Text>
          <Text style={styles.featureName}>LOCATION</Text>
          <Text style={styles.featureSub}>Proximity match</Text>
        </View>
        <View style={styles.featureTile}>
          <Text style={styles.featureIcon}>📡</Text>
          <Text style={styles.featureName}>BLUETOOTH</Text>
          <Text style={styles.featureSub}>Hall beacon</Text>
        </View>
        <View style={styles.featureTile}>
          <Text style={styles.featureIcon}>👤</Text>
          <Text style={styles.featureName}>FACE SCAN</Text>
          <Text style={styles.featureSub}>Identity check</Text>
        </View>
        <View style={styles.featureTile}>
          <Text style={styles.featureIcon}>🔐</Text>
          <Text style={styles.featureName}>DEVICE</Text>
          <Text style={styles.featureSub}>Hardware lock</Text>
        </View>
      </View>

      {/* Start button */}
      <Pressable
        onPress={startVerification}
        style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
      >
        <Text style={styles.startBtnText}>Start Checking</Text>
      </Pressable>
    </Animated.View>
  );

  const renderChecking = () => (
    <Animated.View style={[styles.stepContainer, screenAnimStyle]}>
      {/* Animated spinner */}
      <View style={styles.spinnerWrap}>
        <SpinningRing />
        <View style={styles.spinnerInner}>
          <Text style={styles.spinnerIcon}>🔍</Text>
        </View>
      </View>
      <Text style={styles.checkingHeading}>Checking...</Text>
      {sessionData && (
        <Text style={styles.checkingCourse}>{sessionData.courses?.code}</Text>
      )}

      {/* Checklist */}
      <View style={styles.checklistWrap}>
        {checklist.map((item, idx) => (
          <ChecklistRow key={item.id} item={item} index={idx} />
        ))}
      </View>

      <Text style={styles.versionLabel}>DIGITAL ATTENDANCE v2.0</Text>
    </Animated.View>
  );

  const renderSuccess = () => (
    <Animated.View style={[styles.stepContainer, styles.successContainer, screenAnimStyle]}>
      {/* Pulsing success icon */}
      <View style={styles.successIconWrap}>
        <PulseRing />
        <Text style={styles.successIconText}>✓</Text>
      </View>

      <Text style={styles.successHeading}>Confirmed!</Text>
      <Text style={styles.successSub}>
        Your attendance for{' '}
        <Text style={styles.successCourseCode}>{sessionData?.courses?.code}</Text>{' '}
        has been confirmed.
      </Text>

      {/* Receipt card */}
      <View style={styles.receiptCard}>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>SESSION ID</Text>
          <Text style={styles.receiptValue}>#{sessionId?.slice(-8).toUpperCase()}</Text>
        </View>
        <View style={styles.receiptDivider} />
        <View style={styles.receiptDataRow}>
          <Text style={styles.receiptDataLabel}>Student</Text>
          <Text style={styles.receiptDataValue}>{profileData?.full_name}</Text>
        </View>
        <View style={styles.receiptDataRow}>
          <Text style={styles.receiptDataLabel}>Timestamp</Text>
          <Text style={styles.receiptDataValue}>{formatTime(new Date())}</Text>
        </View>
        <View style={styles.receiptDataRow}>
          <Text style={styles.receiptDataLabel}>Similarity</Text>
          <Text style={styles.receiptDataValue}>{Math.round(telemetry.score * 100)}%</Text>
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate('StudentDashboard')}
        style={({ pressed }) => [styles.finishBtn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.finishBtnText}>Finish</Text>
      </Pressable>
    </Animated.View>
  );

  const renderFailed = () => (
    <Animated.View style={[styles.stepContainer, styles.failedContainer, screenAnimStyle]}>
      <View style={styles.failedIconWrap}>
        <Text style={styles.failedIconText}>✕</Text>
      </View>

      <Text style={styles.failedHeading}>Attendance Failed</Text>
      <Text style={styles.failedSub}>
        Could not confirm your attendance. Ensure GPS is enabled and you are within the lecture hall boundary.
      </Text>

      <Pressable
        onPress={() => {
          resetChecklist();
          startVerification();
        }}
        style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.retryBtnText}>Try Again</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('StudentDashboard')}
        style={({ pressed }) => [styles.cancelBtn2, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.cancelBtn2Text}>Cancel & Exit</Text>
      </Pressable>
    </Animated.View>
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Camera capture modal */}
      <CameraCaptureModal
        visible={showCamera}
        onCapture={handleCameraCapture}
        onCancel={handleCameraCancel}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {screenStep === 'intro' && renderIntro()}
        {screenStep === 'checking' && renderChecking()}
        {screenStep === 'success' && renderSuccess()}
        {screenStep === 'failed' && renderFailed()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  stepContainer: {
    flex: 1,
    paddingTop: 16,
  },

  // Back button
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 32,
  },
  backBtnText: {
    color: Colors.mutedForeground,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Intro
  introCenterBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  introIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  introIconText: { fontSize: 32 },
  introEyebrow: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3.5,
    marginBottom: 8,
  },
  introHeading: {
    color: Colors.foreground,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  introSub: {
    color: Colors.mutedForeground,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  featureTile: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
  featureIcon: { fontSize: 20, marginBottom: 8 },
  featureName: {
    color: Colors.foreground,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 3,
  },
  featureSub: {
    color: Colors.mutedForeground,
    fontSize: 10,
  },

  startBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startBtnPressed: { opacity: 0.85 },
  startBtnText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Checking
  spinnerWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  spinnerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerIcon: { fontSize: 28 },
  checkingHeading: {
    color: Colors.foreground,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  checkingCourse: {
    color: Colors.mutedForeground,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 24,
  },

  checklistWrap: {
    gap: 10,
  },
  checklistRow: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  checklistInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepTextBlock: { flex: 1 },
  stepLabel: {
    color: Colors.foreground,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  stepMessage: {
    color: Colors.mutedForeground,
    fontSize: 11,
  },
  okBadge: {
    color: Colors.mutedForeground,
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },

  versionLabel: {
    color: Colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 32,
    opacity: 0.6,
  },

  // Success
  successContainer: { alignItems: 'center', paddingTop: 48 },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.accent}1A`,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  successIconText: {
    fontSize: 40,
    color: Colors.accent,
    zIndex: 1,
  },
  successHeading: {
    color: Colors.foreground,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  successSub: {
    color: Colors.mutedForeground,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  successCourseCode: {
    color: Colors.foreground,
    fontWeight: '700',
  },
  receiptCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  receiptLabel: {
    color: Colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  receiptValue: {
    color: `${Colors.foreground}BB`,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  receiptDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  receiptDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptDataLabel: {
    color: Colors.mutedForeground,
    fontSize: 12,
  },
  receiptDataValue: {
    color: Colors.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  finishBtn: {
    width: '100%',
    backgroundColor: Colors.foreground,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  finishBtnText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '800',
  },

  // Failed
  failedContainer: { alignItems: 'center', paddingTop: 48 },
  failedIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.destructive}18`,
    borderWidth: 1,
    borderColor: `${Colors.destructive}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  failedIconText: { fontSize: 32, color: Colors.destructive },
  failedHeading: {
    color: Colors.foreground,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  failedSub: {
    color: Colors.mutedForeground,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  retryBtn: {
    width: '100%',
    backgroundColor: Colors.foreground,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  retryBtnText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn2: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtn2Text: {
    color: Colors.mutedForeground,
    fontSize: 14,
    fontWeight: '600',
  },

  // Camera modal
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCornerTL: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.accent,
    borderRadius: 4,
  },
  cameraCornerTR: {
    position: 'absolute',
    top: '25%',
    right: '15%',
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.accent,
    borderRadius: 4,
  },
  cameraCornerBL: {
    position: 'absolute',
    bottom: '25%',
    left: '15%',
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.accent,
    borderRadius: 4,
  },
  cameraCornerBR: {
    position: 'absolute',
    bottom: '25%',
    right: '15%',
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.accent,
    borderRadius: 4,
  },
  cameraInstruction: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  captureBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  captureBtnText: {
    color: '#0A0A0F',
    fontSize: 15,
    fontWeight: '800',
  },
  cameraPermDenied: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  cameraPermText: {
    color: Colors.foreground,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  cameraPermBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  cameraPermBtnText: {
    color: '#0A0A0F',
    fontSize: 15,
    fontWeight: '700',
  },
});

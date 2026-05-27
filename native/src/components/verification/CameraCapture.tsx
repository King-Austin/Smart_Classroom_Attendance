/**
 * CameraCapture — Native face-capture component for enrollment & verification.
 *
 * Uses expo-camera v54:
 *   - CameraView          → the live preview
 *   - useCameraPermissions → request/check permission
 *   - ref.takePictureAsync → snapshot with base64
 *
 * No web APIs (no document / window / localStorage).
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '@/theme/colors';

// CameraViewRef is the imperative handle type for CameraView.
// It exposes takePictureAsync, recordAsync, etc.
// We type the ref as `any` to remain compatible whether or not the
// ambient type declaration is present in the current node_modules state;
// the runtime contract is identical.
type CameraViewRef = InstanceType<typeof CameraView>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CameraCaptureProps {
  /** Called with a base64-encoded JPEG string (no data-URI prefix) */
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
  mode: 'enroll' | 'verify';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CameraCapture({ onCapture, onCancel, mode }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraViewRef>(null);
  const [capturing, setCapturing] = useState(false);

  // ── 1. Permission not yet determined ──────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // ── 2. Permission denied ───────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <View style={styles.permissionBox}>
          {/* Icon ring */}
          <View style={styles.iconRing}>
            <Text style={styles.iconEmoji}>📷</Text>
          </View>

          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionBody}>
            Smart Campus Presence needs your camera to{' '}
            {mode === 'enroll' ? 'register your face' : 'verify your identity'}.
            Your image is only processed for attendance — never stored on device.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.grantButton,
              pressed && styles.grantButtonPressed,
            ]}
            onPress={requestPermission}
          >
            <Text style={styles.grantButtonText}>Grant Camera Permission</Text>
          </Pressable>

          <Pressable onPress={onCancel} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── 3. Camera ready ────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        // skipProcessing keeps it fast on Android
        skipProcessing: false,
      });
      if (photo?.base64) {
        onCapture(photo.base64);
      }
    } catch (err) {
      console.error('CameraCapture: takePictureAsync failed', err);
    } finally {
      setCapturing(false);
    }
  };

  const instructionText =
    mode === 'verify'
      ? 'Center your face in the frame'
      : 'Look directly at camera';

  const modeLabelText = mode === 'verify' ? 'VERIFY' : 'ENROLL';

  return (
    <View style={styles.root}>
      {/* ── Live camera preview ── */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
      />

      {/* ── Dark vignette gradient overlay ── */}
      <View style={styles.vignette} pointerEvents="none" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Pressable
          onPress={onCancel}
          hitSlop={12}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && { opacity: 0.65 },
          ]}
        >
          <Text style={styles.cancelButtonText}>✕</Text>
        </Pressable>

        <View style={styles.modePill}>
          <Text style={styles.modePillText}>{modeLabelText}</Text>
        </View>

        {/* Spacer to balance the row */}
        <View style={styles.cancelButton} />
      </View>

      {/* ── Oval face-guide frame ── */}
      <View style={styles.ovalWrapper} pointerEvents="none">
        <View style={styles.oval} />
        {/* Corner accent dots for premium feel */}
        <View style={[styles.cornerDot, styles.cornerTopLeft]} />
        <View style={[styles.cornerDot, styles.cornerTopRight]} />
        <View style={[styles.cornerDot, styles.cornerBottomLeft]} />
        <View style={[styles.cornerDot, styles.cornerBottomRight]} />
      </View>

      {/* ── Instruction text ── */}
      <View style={styles.instructionWrapper} pointerEvents="none">
        <Text style={styles.instructionText}>{instructionText}</Text>
        <Text style={styles.instructionSub}>
          {mode === 'verify'
            ? 'Hold still for accurate matching'
            : 'Ensure good lighting for best results'}
        </Text>
      </View>

      {/* ── Capture button ── */}
      <View style={styles.captureWrapper}>
        <Pressable
          onPress={handleCapture}
          disabled={capturing}
          style={({ pressed }) => [
            styles.captureRing,
            pressed && styles.captureRingPressed,
            capturing && styles.captureRingDisabled,
          ]}
        >
          {capturing ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <View style={styles.captureInner} />
          )}
        </Pressable>

        <Text style={styles.captureLabel}>
          {capturing ? 'Processing…' : 'Capture'}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const OVAL_WIDTH = 220;
const OVAL_HEIGHT = 280;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },

  // ── Permission screen ──────────────────────────────────────────────────────
  permissionBox: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 32,
  },

  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  iconEmoji: {
    fontSize: 28,
  },

  permissionTitle: {
    color: Colors.foreground,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 12,
  },

  permissionBody: {
    color: Colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },

  grantButton: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },

  grantButtonPressed: {
    opacity: 0.78,
  },

  grantButtonText: {
    color: '#0A0A0F',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  cancelLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  cancelLinkText: {
    color: Colors.mutedForeground,
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Camera screen ──────────────────────────────────────────────────────────
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56, // safe area approximation — wrap in SafeAreaView at screen level
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },

  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14,14,18,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: Colors.foreground,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },

  modePill: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(0,229,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.35)',
  },

  modePillText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },

  // ── Oval guide ────────────────────────────────────────────────────────────
  ovalWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Push oval slightly upward so it sits above the capture button
    marginBottom: 100,
  },

  oval: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.accent,
    // Subtle glow via shadow
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 8,
    // Scrim outside the oval — simulated by making the oval background
    // transparent; the dark vignette layer provides the rest.
    backgroundColor: 'transparent',
  },

  // Four small accent dots at oval "corners" for a high-tech look
  cornerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },

  cornerTopLeft: {
    top: '50%',
    left: '50%',
    // Offset relative to oval center
    marginTop: -(OVAL_HEIGHT / 2) - 4,
    marginLeft: -(OVAL_WIDTH / 2) - 4,
  },

  cornerTopRight: {
    top: '50%',
    left: '50%',
    marginTop: -(OVAL_HEIGHT / 2) - 4,
    marginLeft: OVAL_WIDTH / 2 - 4,
  },

  cornerBottomLeft: {
    top: '50%',
    left: '50%',
    marginTop: OVAL_HEIGHT / 2 - 4,
    marginLeft: -(OVAL_WIDTH / 2) - 4,
  },

  cornerBottomRight: {
    top: '50%',
    left: '50%',
    marginTop: OVAL_HEIGHT / 2 - 4,
    marginLeft: OVAL_WIDTH / 2 - 4,
  },

  // ── Instruction text ───────────────────────────────────────────────────────
  instructionWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 160,
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  instructionText: {
    color: Colors.foreground,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 6,
    // Subtle text-shadow to keep readable over camera feed
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  instructionSub: {
    color: Colors.mutedForeground,
    fontSize: 13,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ── Capture button ─────────────────────────────────────────────────────────
  captureWrapper: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
  },

  captureRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.08)',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },

  captureRingPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.93 }],
  },

  captureRingDisabled: {
    borderColor: Colors.mutedForeground,
    shadowOpacity: 0,
  },

  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
  },

  captureLabel: {
    color: Colors.foreground,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

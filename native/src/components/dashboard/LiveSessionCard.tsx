/**
 * LiveSessionCard — Native port of src/components/dashboard/LiveSessionCard.tsx
 *
 * Props:
 *   session   SessionWithDetails  — enriched session row from useLiveSessions
 *   onJoin    () => void          — called when the student taps "Mark Attendance"
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/theme/colors';
import { SessionWithDetails } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveSessionCardProps {
  session: SessionWithDetails;
  onJoin: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function computeTimeLeft(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = start + 30 * 60 * 1000; // 30-min window
  const diff = end - Date.now();
  if (diff <= 0) return 'Ended';
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// LiveDot — pulsing indicator shown when session is active
// ---------------------------------------------------------------------------

function LiveDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700 }),
        withTiming(1, { duration: 700 }),
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
    <View style={styles.liveDotWrapper}>
      <Animated.View style={[styles.liveDotCore, animStyle]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LiveSessionCard({ session, onJoin }: LiveSessionCardProps) {
  const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(session.started_at ?? ''));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(computeTimeLeft(session.started_at ?? ''));
    }, 1000);
    return () => clearInterval(id);
  }, [session.started_at]);

  const isEnded = timeLeft === 'Ended';
  const isMarked = session.has_marked ?? false;
  const isDisabled = isEnded || isMarked;

  // Fade-in animation on mount
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(12);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
    slideAnim.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) });
  }, []);

  const containerAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  // Attendee avatars (up to 3)
  const visibleRecords = session.attendance_records?.slice(0, 3) ?? [];
  const extraCount = Math.max(0, (session.attendee_count ?? 0) - 3);

  return (
    <Animated.View style={[styles.card, containerAnimStyle]}>
      {/* Already-marked badge overlay */}
      {isMarked && (
        <View style={styles.markedOverlay}>
          <Text style={styles.markedOverlayText}>✓</Text>
        </View>
      )}

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.courseCode} numberOfLines={1}>
            {session.courses?.code} — {session.courses?.name}
          </Text>
          <Text style={styles.lecturerName} numberOfLines={1}>
            {session.lecturer?.full_name ?? 'Unknown Lecturer'}
            {session.topic ? ` · ${session.topic}` : ''}
          </Text>
        </View>

        {/* Live / Ended badge */}
        <View style={[styles.statusBadge, isEnded ? styles.statusEnded : styles.statusLive]}>
          {!isEnded && <LiveDot />}
          <Text style={[styles.statusText, isEnded ? styles.statusTextEnded : styles.statusTextLive]}>
            {isEnded ? 'EXPIRED' : 'LIVE'}
          </Text>
        </View>
      </View>

      {/* Divider row: avatars + timer */}
      <View style={styles.metaRow}>
        {/* Stacked avatar initials */}
        <View style={styles.avatarsRow}>
          {visibleRecords.map((record, i) => (
            <View
              key={i}
              style={[
                styles.avatarCircle,
                { marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i },
              ]}
            >
              <Text style={styles.avatarInitial}>
                {getInitials(record.profiles?.full_name)}
              </Text>
            </View>
          ))}
          {extraCount > 0 && (
            <View style={[styles.avatarCircle, styles.avatarExtra, { marginLeft: -8 }]}>
              <Text style={styles.avatarExtraText}>+{extraCount}</Text>
            </View>
          )}
          <Text style={styles.nearbyLabel}>
            {session.attendee_count ?? 0} checked in
          </Text>
        </View>

        {/* Countdown timer */}
        <View style={styles.timerRow}>
          <Text style={styles.timerIcon}>⏱</Text>
          <Text style={[styles.timerText, isEnded && styles.timerTextEnded]}>
            {timeLeft}
          </Text>
        </View>
      </View>

      {/* Action button */}
      <Pressable
        onPress={isDisabled ? undefined : onJoin}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.joinButton,
          isMarked && styles.joinButtonMarked,
          isEnded && styles.joinButtonEnded,
          !isDisabled && pressed && styles.joinButtonPressed,
          isDisabled && styles.joinButtonDisabled,
        ]}
      >
        <Text
          style={[
            styles.joinButtonText,
            isMarked && styles.joinButtonTextMarked,
            isEnded && styles.joinButtonTextEnded,
          ]}
        >
          {isMarked
            ? '✓  Marked Present'
            : isEnded
            ? 'Session Expired'
            : 'Mark Attendance →'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,   // accent with low opacity
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  markedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: `${Colors.accent}33`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  markedOverlayText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTextBlock: {
    flex: 1,
    marginRight: 8,
  },
  courseCode: {
    color: Colors.foreground,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  lecturerName: {
    color: Colors.mutedForeground,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  statusLive: {
    backgroundColor: `${Colors.accent}1A`,
  },
  statusEnded: {
    backgroundColor: Colors.muted,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusTextLive: {
    color: Colors.accent,
  },
  statusTextEnded: {
    color: Colors.mutedForeground,
  },
  liveDotWrapper: {
    width: 7,
    height: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotCore: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accent,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: `${Colors.border}80`,
    paddingVertical: 8,
    marginBottom: 12,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    borderWidth: 1.5,
    borderColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.mutedForeground,
    fontSize: 8,
    fontWeight: '700',
  },
  avatarExtra: {
    backgroundColor: '#1A1A28',
    borderColor: Colors.border,
  },
  avatarExtraText: {
    color: Colors.accent,
    fontSize: 8,
    fontWeight: '700',
  },
  nearbyLabel: {
    color: Colors.mutedForeground,
    fontSize: 11,
    marginLeft: 8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerIcon: {
    fontSize: 12,
  },
  timerText: {
    color: Colors.accent,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  timerTextEnded: {
    color: Colors.mutedForeground,
  },
  joinButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinButtonMarked: {
    backgroundColor: 'rgba(36,176,117,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(36,176,117,0.25)',
  },
  joinButtonEnded: {
    backgroundColor: Colors.muted,
  },
  joinButtonPressed: {
    opacity: 0.78,
  },
  joinButtonDisabled: {
    opacity: 0.65,
  },
  joinButtonText: {
    color: '#0A0A0F',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  joinButtonTextMarked: {
    color: Colors.success,
  },
  joinButtonTextEnded: {
    color: Colors.mutedForeground,
  },
});

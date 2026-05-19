/**
 * StudentDashboardScreen — Native port of src/pages/StudentDashboard.tsx
 *
 * Home tab content only (navigation tabs are handled by StudentTabs navigator).
 * Shows:
 *   - Greeting header with student name + avatar initials
 *   - AttendanceScoreboard with overall stats + per-course breakdown
 *   - Live sessions list (each with a "Join" button)
 *   - Recent attendance history (last 5 records)
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useLiveSessions } from '@/hooks/useLiveSessions';
import { useAttendanceStats } from '@/hooks/useAttendanceStats';
import { getUniqueDeviceId } from '@/lib/device';
import { toast } from '@/lib/toast';
import { Colors } from '@/theme/colors';
import { LiveSessionCard } from '@/components/dashboard/LiveSessionCard';
import { AttendanceScoreboard } from '@/components/dashboard/AttendanceScoreboard';
import { PresenceLoader } from '@/components/PresenceLoader';
import type { StudentStackParamList } from '@/navigation/types';
import type { SessionWithDetails } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Nav = NativeStackNavigationProp<StudentStackParamList, 'StudentDashboard'>;

interface HistoryRecord {
  id: string;
  session_id: string;
  created_at: string;
  status: string;
  attendance_sessions?: {
    courses?: {
      name: string;
      code: string;
    };
  };
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

function formatRelativeDate(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// FadeSlide wrapper — simple fade-in+slide-up animation on mount
// ---------------------------------------------------------------------------

function FadeSlide({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const timerId = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.ease) });
    }, delay);
    return () => clearTimeout(timerId);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// History item row
// ---------------------------------------------------------------------------

function HistoryItem({
  item,
  index,
  onPress,
}: {
  item: HistoryRecord;
  index: number;
  onPress: () => void;
}) {
  const isVerified = item.status === 'verified';
  const courseCode = item.attendance_sessions?.courses?.code ?? '—';

  return (
    <FadeSlide delay={index * 60}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.historyItem, pressed && styles.historyItemPressed]}
      >
        <View
          style={[
            styles.historyIcon,
            isVerified ? styles.historyIconVerified : styles.historyIconFailed,
          ]}
        >
          <Text style={styles.historyIconText}>{isVerified ? '✓' : '✕'}</Text>
        </View>
        <View style={styles.historyTextBlock}>
          <Text style={styles.historyCourseCode}>{courseCode}</Text>
          <Text style={styles.historyMeta}>
            {formatRelativeDate(item.created_at)} · {formatTime(item.created_at)}
          </Text>
        </View>
        <Text style={styles.historyChevron}>›</Text>
      </Pressable>
    </FadeSlide>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function StudentDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, loading: profileLoading } = useProfile();
  const { sessions: liveSessions, loading: sessionsLoading } = useLiveSessions(profile?.id);
  const { stats, loading: statsLoading } = useAttendanceStats(profile?.id);

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Device binding check on profile load
  useEffect(() => {
    if (!profile || profileLoading) return;

    const checkDevice = async () => {
      const deviceId = await getUniqueDeviceId();
      if (!profile.device_info) {
        // Auto-bind on first launch
        await supabase
          .from('profiles')
          .update({ device_info: deviceId } as any)
          .eq('id', profile.id);
      } else if (profile.device_info !== deviceId) {
        toast.warning('New device detected. Please re-verify your identity.');
      }
    };

    checkDevice();
  }, [profile, profileLoading]);

  // Fetch recent history
  useEffect(() => {
    if (!profile) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const { data } = await supabase
          .from('attendance_records')
          .select('id, session_id, created_at, status, attendance_sessions(courses(name, code))')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (data) setHistory(data as any);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [profile]);

  const handleJoin = (session: SessionWithDetails) => {
    navigation.navigate('AttendanceVerification', { sessionId: session.id });
  };

  const handleHistoryPress = (sessionId: string) => {
    navigation.navigate('AttendanceLedger', { sessionId });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Loading state
  if (profileLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <PresenceLoader message="Loading profile..." />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <FadeSlide>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>STUDENT PROFILE</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Avatar initials circle */}
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {getInitials(profile?.full_name)}
                </Text>
              </View>
              {/* Logout */}
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.logoutIcon}>⏻</Text>
              </Pressable>
            </View>
          </View>
        </FadeSlide>

        {/* ---------------------------------------------------------------- */}
        {/* Greeting sub-row                                                 */}
        {/* ---------------------------------------------------------------- */}
        {profile && (
          <FadeSlide delay={80}>
            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.greetingName}>{profile.full_name}</Text>
                {profile.reg_number ? (
                  <Text style={styles.greetingReg}>{profile.reg_number}</Text>
                ) : null}
              </View>
              <View style={styles.bioStatusRow}>
                <View
                  style={[
                    styles.bioStatusDot,
                    (profile as any).face_enrolled
                      ? styles.bioStatusDotActive
                      : styles.bioStatusDotInactive,
                  ]}
                />
                <Text style={styles.bioStatusText}>
                  {(profile as any).face_enrolled ? 'Face enrolled' : 'No biometrics'}
                </Text>
              </View>
            </View>
          </FadeSlide>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Attendance Scoreboard                                            */}
        {/* ---------------------------------------------------------------- */}
        <FadeSlide delay={120}>
          <AttendanceScoreboard
            progress={stats.overallProgress}
            attended={stats.attendedSessions}
            total={stats.totalSessions}
            courseBreakdown={stats.courseBreakdown}
            loading={statsLoading}
          />
        </FadeSlide>

        {/* ---------------------------------------------------------------- */}
        {/* Live Sessions                                                    */}
        {/* ---------------------------------------------------------------- */}
        <FadeSlide delay={180}>
          <View style={styles.sectionHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.sectionTitle}>LIVE SESSIONS</Text>
          </View>
        </FadeSlide>

        {sessionsLoading ? (
          <View style={styles.centerRow}>
            <ActivityIndicator color={Colors.accent} />
          </View>
        ) : liveSessions.length === 0 ? (
          <FadeSlide delay={200}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyTitle}>NO CURRENT CLASSES</Text>
              <Text style={styles.emptySubtitle}>Check back when your lecture starts.</Text>
            </View>
          </FadeSlide>
        ) : (
          liveSessions.map((session, idx) => (
            <FadeSlide key={session.id} delay={200 + idx * 60}>
              <LiveSessionCard
                session={session}
                onJoin={() => handleJoin(session)}
              />
            </FadeSlide>
          ))
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Recent History                                                   */}
        {/* ---------------------------------------------------------------- */}
        {(historyLoading || history.length > 0) && (
          <>
            <FadeSlide delay={260}>
              <Text style={[styles.sectionTitle, styles.historySectionTitle]}>
                RECENT ATTENDANCE
              </Text>
            </FadeSlide>

            {historyLoading ? (
              <View style={styles.centerRow}>
                <ActivityIndicator color={Colors.accent} size="small" />
              </View>
            ) : (
              <View style={styles.historyList}>
                {history.map((item, index) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    index={index}
                    onPress={() => handleHistoryPress(item.session_id)}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerEyebrow: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 2,
  },
  headerTitle: {
    color: Colors.foreground,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.accent}22`,
    borderWidth: 1.5,
    borderColor: `${Colors.accent}55`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    color: Colors.destructive,
    fontSize: 16,
  },

  // Greeting sub-row
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  greetingName: {
    color: Colors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  greetingReg: {
    color: Colors.mutedForeground,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  bioStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bioStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  bioStatusDotActive: {
    backgroundColor: Colors.success,
  },
  bioStatusDotInactive: {
    backgroundColor: Colors.destructive,
  },
  bioStatusText: {
    color: Colors.mutedForeground,
    fontSize: 10,
    fontWeight: '600',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  sectionTitle: {
    color: Colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  historySectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  // Empty state
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: `${Colors.card}66`,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  emptyTitle: {
    color: Colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: `${Colors.mutedForeground}99`,
    fontSize: 12,
    textAlign: 'center',
  },

  // History
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  historyItemPressed: {
    opacity: 0.75,
    borderColor: `${Colors.accent}55`,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  historyIconVerified: {
    backgroundColor: `${Colors.accent}18`,
  },
  historyIconFailed: {
    backgroundColor: `${Colors.destructive}18`,
  },
  historyIconText: {
    fontSize: 16,
    color: Colors.foreground,
  },
  historyTextBlock: {
    flex: 1,
  },
  historyCourseCode: {
    color: Colors.foreground,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  historyMeta: {
    color: Colors.mutedForeground,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  historyChevron: {
    color: Colors.mutedForeground,
    fontSize: 20,
    fontWeight: '300',
  },

  centerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },

  bottomSpacer: {
    height: 32,
  },
});

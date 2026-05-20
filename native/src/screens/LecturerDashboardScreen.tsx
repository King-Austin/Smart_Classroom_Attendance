/**
 * Smart Campus Presence — LecturerDashboardScreen
 *
 * Main lecturer home screen:
 *  • Greeting header + logout
 *  • Three stat cards (Total Students, Course Count, Avg Attendance Rate)
 *  • Active sessions list — each with a "Manage" button → LiveSessionScreen
 *  • Recent (ended) sessions in a FlatList
 *  • "Create New Session" CTA → CreateSessionScreen
 *  • Pull-to-refresh via RefreshControl
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Activity,
  Plus,
  ChevronRight,
  Calendar,
  BarChart3,
  Users,
  TrendingUp,
} from 'lucide-react-native';

import { Colors } from '@/theme/colors';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useProfile } from '@/hooks/useProfile';
import { useLecturerData } from '@/hooks/useLecturerData';
import { supabase } from '@/integrations/supabase/client';
import { calculatePercentage } from '@/lib/utils';
import type { LecturerStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<LecturerStackParamList, 'LecturerDashboard'>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSessionDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}

function StatCard({ label, value, icon, accent = false }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        borderRadius: 18,
        backgroundColor: accent ? 'rgba(0,229,255,0.06)' : Colors.card,
        borderWidth: 1,
        borderColor: accent ? 'rgba(0,229,255,0.22)' : Colors.border,
      }}
    >
      <View style={{ marginBottom: 8 }}>{icon}</View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '800',
          color: accent ? Colors.accent : Colors.foreground,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 9,
          fontWeight: '700',
          color: Colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginTop: 3,
          opacity: 0.7,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Active Session Row
// ---------------------------------------------------------------------------

interface ActiveSessionRowProps {
  session: any;
  onManage: () => void;
}

function ActiveSessionRow({ session, onManage }: ActiveSessionRowProps) {
  return (
    <Pressable
      onPress={onManage}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 18,
        borderRadius: 24,
        backgroundColor: pressed
          ? 'rgba(0,229,255,0.06)'
          : Colors.card,
        borderWidth: 1,
        borderColor: pressed ? 'rgba(0,229,255,0.35)' : Colors.border,
        marginBottom: 10,
      })}
    >
      {/* Icon + live dot */}
      <View style={{ position: 'relative', flexShrink: 0 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: 'rgba(0,229,255,0.10)',
            borderWidth: 1,
            borderColor: 'rgba(0,229,255,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Activity size={22} color={Colors.accent} strokeWidth={2} />
        </View>
        {/* Live indicator dot */}
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 11,
            height: 11,
            borderRadius: 5.5,
            backgroundColor: Colors.accent,
            borderWidth: 2,
            borderColor: Colors.background,
          }}
        />
      </View>

      {/* Course info */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 15,
            fontWeight: '800',
            color: Colors.foreground,
            letterSpacing: -0.3,
            marginBottom: 3,
          }}
        >
          {session.courses?.code ?? 'Course'}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: Colors.mutedForeground,
            fontStyle: 'italic',
            marginBottom: 6,
            opacity: 0.75,
          }}
        >
          {session.topic ?? 'Monitoring Attendance'}
        </Text>
        {/* Present badge */}
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: 'rgba(0,229,255,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(0,229,255,0.25)',
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: '800',
              color: Colors.accent,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {session.present ?? 0} Students Present
          </Text>
        </View>
      </View>

      {/* Manage arrow */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          backgroundColor: 'rgba(0,229,255,0.10)',
          borderWidth: 1,
          borderColor: 'rgba(0,229,255,0.22)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: '800',
            color: Colors.accent,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Manage
        </Text>
        <ChevronRight size={12} color={Colors.accent} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Recent Session Row
// ---------------------------------------------------------------------------

interface RecentSessionRowProps {
  session: any;
  onPress: () => void;
}

function RecentSessionRow({ session, onPress }: RecentSessionRowProps) {
  const pct = calculatePercentage(session.present ?? 0, session.total ?? 0);
  const codePrefix = (session.courses?.code ?? '??').substring(0, 2);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 20,
        backgroundColor: pressed
          ? 'rgba(255,255,255,0.03)'
          : 'rgba(20,20,28,0.6)',
        borderWidth: 1,
        borderColor: pressed ? 'rgba(0,229,255,0.25)' : Colors.border,
        marginBottom: 8,
      })}
    >
      {/* Code avatar */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: Colors.muted,
          borderWidth: 1,
          borderColor: Colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            color: Colors.mutedForeground,
            textTransform: 'uppercase',
          }}
        >
          {codePrefix}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: '800',
              color: Colors.foreground,
              letterSpacing: -0.2,
              marginRight: 8,
            }}
          >
            {session.courses?.code ?? 'Course'}
          </Text>
          <Text
            style={{
              fontSize: 9,
              fontWeight: '700',
              color: Colors.mutedForeground,
              opacity: 0.6,
            }}
          >
            {formatSessionDate(session.created_at)}
          </Text>
        </View>

        {/* Mini progress bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: Colors.muted,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${pct}%`,
                height: 4,
                backgroundColor: 'rgba(0,229,255,0.6)',
                borderRadius: 2,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: Colors.accent,
              minWidth: 32,
              textAlign: 'right',
            }}
          >
            {pct}%
          </Text>
        </View>

        <Text
          style={{
            fontSize: 9,
            fontWeight: '700',
            color: Colors.mutedForeground,
            textTransform: 'uppercase',
            letterSpacing: 1,
            opacity: 0.55,
          }}
        >
          {session.present ?? 0} Present / {session.total ?? '—'} Total
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LecturerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, loading: profileLoading } = useProfile();
  const { sessions, stats, loading: dataLoading } = useLecturerData(profile?.id);
  const [refreshing, setRefreshing] = useState(false);

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const recentSessions = sessions.filter((s) => s.status !== 'active').slice(0, 8);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    // RootNavigator auth listener handles the redirect automatically
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // useLecturerData already listens to realtime; a brief delay gives the
    // illusion of a network refresh while the hook re-fetches internally.
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (profileLoading && !profile) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 11,
            fontWeight: '700',
            color: Colors.mutedForeground,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          Fetching Faculty Data…
        </Text>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <DashboardHeader profile={profile} onLogout={handleLogout} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* ------------------------------------------------------------------ */}
        {/* Stat cards row                                                       */}
        {/* ------------------------------------------------------------------ */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <StatCard
            label="Total Students"
            value={stats.totalStudents}
            icon={<Users size={16} color={Colors.mutedForeground} strokeWidth={2} />}
          />
          <StatCard
            label="Courses"
            value={stats.courseCount}
            icon={<BarChart3 size={16} color={Colors.mutedForeground} strokeWidth={2} />}
          />
          <StatCard
            label="Avg Rate"
            value={`${stats.avgRate}%`}
            icon={<TrendingUp size={16} color={Colors.accent} strokeWidth={2} />}
            accent
          />
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Create New Session CTA                                              */}
        {/* ------------------------------------------------------------------ */}
        <Pressable
          onPress={() => navigation.navigate('CreateSession')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 20,
            borderRadius: 24,
            backgroundColor: pressed ? 'rgba(0,229,255,0.15)' : Colors.accent,
            marginBottom: 28,
          })}
        >
          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: Colors.background,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 3,
                opacity: 0.7,
              }}
            >
              Add Session
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '900',
                color: Colors.background,
                letterSpacing: -0.3,
              }}
            >
              Start New Class
            </Text>
          </View>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: 'rgba(14,14,18,0.20)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={24} color={Colors.background} strokeWidth={2.5} />
          </View>
        </Pressable>

        {/* ------------------------------------------------------------------ */}
        {/* Active Sessions                                                     */}
        {/* ------------------------------------------------------------------ */}
        {activeSessions.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                paddingHorizontal: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Pulsing dot */}
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: Colors.accent,
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: Colors.foreground,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                  }}
                >
                  Live Sessions
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: 'rgba(0,229,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                }}
              >
                {activeSessions.length} Active
              </Text>
            </View>

            {activeSessions.map((session) => (
              <ActiveSessionRow
                key={session.id}
                session={session}
                onManage={() =>
                  navigation.navigate('LiveSession', { sessionId: session.id })
                }
              />
            ))}
          </View>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Recent / Past Sessions                                              */}
        {/* ------------------------------------------------------------------ */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              paddingHorizontal: 4,
            }}
          >
            <Calendar size={14} color={Colors.mutedForeground} strokeWidth={2} />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: Colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Past Sessions
            </Text>
          </View>

          {recentSessions.length === 0 ? (
            <View
              style={{
                paddingVertical: 48,
                alignItems: 'center',
                borderRadius: 24,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: Colors.border,
                backgroundColor: 'rgba(20,20,28,0.25)',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: Colors.mutedForeground,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  opacity: 0.45,
                }}
              >
                No Sessions Found
              </Text>
            </View>
          ) : (
            recentSessions.map((session) => (
              <RecentSessionRow
                key={session.id}
                session={session}
                onPress={() =>
                  navigation.navigate('LiveSession', { sessionId: session.id })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

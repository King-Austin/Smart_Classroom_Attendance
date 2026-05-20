import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, Modal,
  ActivityIndicator, SafeAreaView, StyleSheet, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, StopCircle, Wifi, Clock, ChevronRight, Download } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useSessionData } from '@/hooks/useSessionData';
import { useBlePeripheral } from '@/hooks/useBlePeripheral';
import { calculatePercentage } from '@/lib/utils';
import { SESSION_STATUS, ATTENDANCE_STATUS } from '@/constants';
import { SessionHeader } from '@/components/live-session/SessionHeader';
import { SessionStats } from '@/components/live-session/SessionStats';
import { AttendanceFeed } from '@/components/live-session/AttendanceFeed';
import { EngagementChart } from '@/components/live-session/EngagementChart';
import { ManualEntry } from '@/components/live-session/ManualEntry';
import type { LecturerStackParamList } from '@/navigation/types';

type Route = RouteProp<LecturerStackParamList, 'LiveSession'>;

const formatDuration = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

export default function LiveSessionScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { sessionId } = route.params;

  const { session, records, totalEnrolled, loading, refresh } = useSessionData(sessionId);
  const ble = useBlePeripheral(sessionId);
  const [ending, setEnding] = useState(false);

  const presentCount = records.filter(
    (r) => r.status === ATTENDANCE_STATUS.VERIFIED || r.status === 'present'
  ).length;
  const presentRate = calculatePercentage(presentCount, totalEnrolled);
  const isEnded = session?.status === SESSION_STATUS.ENDED;

  const handleEndSession = async () => {
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          setEnding(true);
          try {
            await ble.stopBroadcast();
            const { error } = await supabase
              .from('attendance_sessions')
              .update({ status: SESSION_STATUS.ENDED, ended_at: new Date().toISOString() })
              .eq('id', sessionId);
            if (error) throw error;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success('Session ended.');
            navigation.goBack();
          } catch (err: any) {
            toast.error('Failed to end session: ' + err.message);
          } finally {
            setEnding(false);
          }
        },
      },
    ]);
  };

  if (loading && !session) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#00E5FF" size="large" />
        <Text style={styles.loadingText}>Synchronizing Live Feed...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
          <ArrowLeft size={16} color="#8A8FA8" />
          <Text style={styles.backText}>Dashboard</Text>
        </Pressable>
        <View style={[styles.statusPill, isEnded && styles.statusPillEnded]}>
          <View style={[styles.statusDot, isEnded && styles.statusDotEnded]} />
          <Text style={[styles.statusText, isEnded && styles.statusTextEnded]}>
            {isEnded ? 'Session Ended' : 'Live Monitoring'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SessionHeader session={session} />

        {/* BLE token card (active) or summary card (ended) */}
        {!isEnded ? (
          <View style={styles.bleCard}>
            <View style={styles.bleIcon}>
              <Wifi size={24} color="#00E5FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bleLabel}>Proximity ID</Text>
              <Text style={styles.bleToken}>{session?.ble_token}</Text>
            </View>
            <Text style={styles.broadcasting}>Broadcasting</Text>
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Final Ledger Summary</Text>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryValue}>
                  {session?.started_at && session?.ended_at
                    ? formatDuration(session.started_at, session.ended_at)
                    : '---'}
                </Text>
                <Text style={styles.summarySubLabel}>Duration</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View>
                <Text style={[styles.summaryValue, { color: '#00E5FF' }]}>{records.length}</Text>
                <Text style={styles.summarySubLabel}>Verified</Text>
              </View>
            </View>
          </View>
        )}

        <SessionStats
          total={totalEnrolled}
          present={presentCount}
          rate={presentRate}
        />

        <EngagementChart records={records} />

        {!isEnded && (
          <ManualEntry
            sessionId={sessionId}
            onAdded={refresh}
            existingRecords={records}
          />
        )}

        <AttendanceFeed records={records} />

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.exportBtn} onPress={() => toast.info('Export coming soon!')}>
            <Download size={16} color="#EEF0F4" />
            <Text style={styles.exportBtnText}>Export</Text>
          </Pressable>

          {!isEnded && (
            <Pressable
              style={[styles.endBtn, ending && { opacity: 0.7 }]}
              onPress={handleEndSession}
              disabled={ending}
            >
              {ending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <StopCircle size={16} color="#fff" />
                  <Text style={styles.endBtnText}>End Session</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E12' },
  loadingScreen: { flex: 1, backgroundColor: '#0E0E12', alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#8A8FA8', fontSize: 13 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: '#8A8FA8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
  },
  statusPillEnded: { backgroundColor: '#1E1E2A', borderColor: '#2A2A38' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E5FF' },
  statusDotEnded: { backgroundColor: '#8A8FA8' },
  statusText: { fontSize: 9, fontWeight: '900', color: '#00E5FF', textTransform: 'uppercase', letterSpacing: 1.5 },
  statusTextEnded: { color: '#8A8FA8' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  bleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#14141C', borderWidth: 1, borderColor: '#2A2A38',
    borderRadius: 24, padding: 16, marginBottom: 16,
  },
  bleIcon: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  bleLabel: { fontSize: 10, color: '#8A8FA8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  bleToken: { fontSize: 14, fontWeight: '700', color: '#EEF0F4', fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' },
  broadcasting: { fontSize: 9, color: '#00E5FF', fontWeight: '900', letterSpacing: 1 },
  summaryCard: {
    backgroundColor: '#14141C', borderWidth: 1, borderColor: '#2A2A38',
    borderRadius: 24, padding: 20, marginBottom: 16,
  },
  summaryLabel: { fontSize: 10, color: '#00E5FF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  summaryValue: { fontSize: 28, fontWeight: '900', color: '#EEF0F4' },
  summarySubLabel: { fontSize: 10, color: '#8A8FA8', fontWeight: '700', textTransform: 'uppercase', opacity: 0.6 },
  summaryDivider: { width: 1, height: 48, backgroundColor: 'rgba(42,42,56,0.5)' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  exportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 56, borderRadius: 20, backgroundColor: '#14141C',
    borderWidth: 1, borderColor: '#2A2A38',
  },
  exportBtnText: { color: '#EEF0F4', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  endBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 56, borderRadius: 20, backgroundColor: '#EF4444',
  },
  endBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
});

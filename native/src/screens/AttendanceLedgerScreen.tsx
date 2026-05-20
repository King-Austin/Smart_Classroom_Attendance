import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Search, User, Clock, UserCheck } from 'lucide-react-native';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { ATTENDANCE_STATUS } from '@/constants';
import type { StudentStackParamList } from '@/navigation/types';

type Route = RouteProp<StudentStackParamList, 'AttendanceLedger'>;

interface LedgerStudent {
  index: number;
  name: string;
  regNumber: string;
  time: string;
  studentId: string;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function AttendanceLedgerScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const sessionId = route.params?.sessionId;

  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<LedgerStudent[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    fetchLedgerData();
  }, [sessionId]);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*, courses(name, code), profiles!lecturer_id(full_name)')
        .eq('id', sessionId!)
        .single();
      if (sessionError) throw sessionError;
      setSession(sessionData);

      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('id, created_at, student_id')
        .eq('session_id', sessionId!)
        .eq('status', ATTENDANCE_STATUS.VERIFIED)
        .order('created_at', { ascending: true });
      if (recordsError) throw recordsError;

      if (records && records.length > 0) {
        const studentIds = records.map((r) => r.student_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, reg_number')
          .in('id', studentIds);

        const profileMap = Object.fromEntries(
          (profiles ?? []).map((p) => [p.id, p])
        );

        setStudents(
          records.map((r, i) => ({
            index: i + 1,
            studentId: r.student_id,
            name: profileMap[r.student_id]?.full_name ?? 'Unknown Student',
            regNumber: profileMap[r.student_id]?.reg_number ?? 'REG/None',
            time: formatTime(r.created_at),
          }))
        );
      } else {
        setStudents([]);
      }
    } catch (error: any) {
      toast.error('Error loading ledger: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#8A8FA8" />
        </Pressable>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Attendance Ledger</Text>
        </View>
      </View>

      {/* Session info card */}
      {session && (
        <View style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>
            {session.courses?.code}: {session.courses?.name}
          </Text>
          <View style={styles.sessionMeta}>
            <View style={styles.metaItem}>
              <User size={13} color="#8A8FA8" />
              <Text style={styles.metaText}>{(session as any).profiles?.full_name}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={13} color="#8A8FA8" />
              <Text style={styles.metaText}>{formatDate(session.created_at)}</Text>
            </View>
            <View style={styles.metaItem}>
              <UserCheck size={13} color="#00E5FF" />
              <Text style={[styles.metaText, { color: '#00E5FF', fontWeight: '700' }]}>
                {students.length} Present
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Text style={styles.sectionLabel}>Attendees</Text>
        <View style={styles.searchBox}>
          <Search size={14} color="#8A8FA8" />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search students..."
            placeholderTextColor="#8A8FA8"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00E5FF" size="large" />
          <Text style={styles.loadingText}>Decrypting Ledger...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.studentId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No matching records</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.indexBox}>
                <Text style={styles.indexText}>{item.index}</Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.regNumber}>{item.regNumber}</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={styles.presentPill}>
                  <Text style={styles.presentPillText}>Present</Text>
                </View>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
            </View>
          )}
        />
      )}

      {!loading && students.length > 0 && (
        <Text style={styles.footer}>End of Ledger</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#14141C', borderWidth: 1, borderColor: '#2A2A38',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#00E5FF', textTransform: 'uppercase', letterSpacing: 1.5 },
  sessionCard: {
    marginHorizontal: 20, padding: 20,
    borderRadius: 24, backgroundColor: '#14141C',
    borderWidth: 1, borderColor: '#2A2A38', marginBottom: 16,
  },
  sessionTitle: { fontSize: 18, fontWeight: '700', color: '#EEF0F4', marginBottom: 12 },
  sessionMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#8A8FA8' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#8A8FA8', textTransform: 'uppercase', letterSpacing: 1.5 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1E1E2A', borderWidth: 1, borderColor: '#2A2A38',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, flex: 1, marginLeft: 12,
  },
  searchInput: { flex: 1, color: '#EEF0F4', fontSize: 13 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyBox: {
    paddingVertical: 60, alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2A38', borderRadius: 24,
    borderStyle: 'dashed', backgroundColor: 'rgba(30,30,42,0.3)',
  },
  emptyText: { fontSize: 11, fontWeight: '700', color: '#8A8FA8', textTransform: 'uppercase', letterSpacing: 1.5 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(42,42,56,0.5)',
    backgroundColor: 'rgba(30,30,42,0.3)',
  },
  indexBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(42,42,56,0.5)', borderWidth: 1, borderColor: '#2A2A38',
    alignItems: 'center', justifyContent: 'center',
  },
  indexText: { fontSize: 11, fontWeight: '700', color: '#8A8FA8' },
  rowInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#EEF0F4' },
  regNumber: { fontSize: 10, color: '#8A8FA8', fontFamily: 'monospace', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  presentPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, backgroundColor: 'rgba(36,176,117,0.1)',
    borderWidth: 1, borderColor: 'rgba(36,176,117,0.2)',
  },
  presentPillText: { fontSize: 9, fontWeight: '700', color: '#24B075', textTransform: 'uppercase' },
  timeText: { fontSize: 9, color: '#8A8FA8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#8A8FA8', fontSize: 12 },
  footer: {
    textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#8A8FA8',
    textTransform: 'uppercase', letterSpacing: 2, paddingVertical: 16,
  },
});

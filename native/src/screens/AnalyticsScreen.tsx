import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useProfile } from '@/hooks/useProfile';
import { useLecturerData } from '@/hooks/useLecturerData';
import { BarChart3 } from 'lucide-react-native';

export default function AnalyticsScreen() {
  const { profile } = useProfile();
  const { sessions, stats } = useLecturerData(profile?.id);

  const sessionsByStatus = sessions.reduce(
    (acc, s) => {
      if (s.status === 'active') acc.active++;
      else acc.ended++;
      return acc;
    },
    { active: 0, ended: 0 }
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BarChart3 size={20} color="#00E5FF" />
        <Text style={styles.title}>Analytics</Text>
      </View>

      <View style={styles.grid}>
        {[
          { label: 'Total Students', value: stats.totalStudents },
          { label: 'Courses', value: stats.courseCount },
          { label: 'Avg Rate', value: `${stats.avgRate}%` },
          { label: 'Total Sessions', value: sessions.length },
          { label: 'Active Now', value: sessionsByStatus.active },
          { label: 'Completed', value: sessionsByStatus.ended },
        ].map((item) => (
          <View key={item.label} style={styles.card}>
            <Text style={styles.cardValue}>{item.value}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E12' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#EEF0F4' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    width: '47%', backgroundColor: '#14141C',
    borderWidth: 1, borderColor: '#2A2A38',
    borderRadius: 16, padding: 16, alignItems: 'center',
  },
  cardValue: { fontSize: 28, fontWeight: '900', color: '#00E5FF', marginBottom: 4 },
  cardLabel: { fontSize: 11, color: '#8A8FA8', fontWeight: '600', textAlign: 'center' },
});

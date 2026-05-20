import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { UserPlus, X, Search, Check } from 'lucide-react-native';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { ATTENDANCE_STATUS } from '@/constants';

interface ManualEntryProps {
  sessionId: string | undefined;
  onAdded: () => void;
  existingRecords: any[];
}

export const ManualEntry = ({ sessionId, onAdded, existingRecords }: ManualEntryProps) => {
  const [visible, setVisible] = useState(false);
  const [manualReg, setManualReg] = useState('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);

  const handleSearch = async () => {
    if (!manualReg.trim()) return;
    setSearching(true);
    setFoundStudent(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, reg_number, department')
        .eq('reg_number', manualReg.toUpperCase().trim())
        .single();
      if (error || !data) { toast.error('Student not found'); return; }
      const alreadyRecorded = existingRecords.some((r) => r.student_id === data.id);
      if (alreadyRecorded) { toast.info('Student already has a record for this session'); return; }
      setFoundStudent(data);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!foundStudent || !sessionId) return;
    setAdding(true);
    try {
      const { error } = await supabase.from('attendance_records').insert({
        session_id: sessionId,
        student_id: foundStudent.id,
        status: ATTENDANCE_STATUS.MANUAL,
        is_manual: true,
      });
      if (error) throw error;
      toast.success(`Manual entry added for ${foundStudent.full_name}`);
      setFoundStudent(null);
      setManualReg('');
      onAdded();
      setVisible(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <UserPlus size={16} color="#00E5FF" />
        <Text style={styles.triggerText}>Add Manual Entry</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Manual Entry</Text>
              <Pressable onPress={() => setVisible(false)}>
                <X size={20} color="#8A8FA8" />
              </Pressable>
            </View>

            <View style={styles.row}>
              <TextInput
                value={manualReg}
                onChangeText={setManualReg}
                placeholder="Student Reg Number"
                placeholderTextColor="#8A8FA8"
                style={styles.input}
                autoCapitalize="characters"
              />
              <Pressable style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
                {searching ? <ActivityIndicator size="small" color="#0E0E12" /> : <Search size={18} color="#0E0E12" />}
              </Pressable>
            </View>

            {foundStudent && (
              <View style={styles.studentCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{foundStudent.full_name}</Text>
                  <Text style={styles.studentReg}>{foundStudent.reg_number}</Text>
                </View>
                <Pressable style={styles.addBtn} onPress={handleAdd} disabled={adding}>
                  {adding ? <ActivityIndicator size="small" color="#0E0E12" /> : <Check size={18} color="#0E0E12" />}
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,229,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  },
  triggerText: { color: '#00E5FF', fontSize: 13, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#14141C', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, borderWidth: 1, borderColor: '#2A2A38',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#EEF0F4' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: {
    flex: 1, backgroundColor: '#1E1E2A', borderWidth: 1, borderColor: '#2A2A38',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: '#EEF0F4', fontSize: 14, fontFamily: 'monospace',
  },
  searchBtn: {
    width: 50, backgroundColor: '#00E5FF', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  studentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1E1E2A', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#2A2A38',
  },
  studentName: { fontSize: 14, fontWeight: '700', color: '#EEF0F4' },
  studentReg: { fontSize: 11, color: '#8A8FA8', marginTop: 2, fontFamily: 'monospace' },
  addBtn: {
    width: 44, height: 44, backgroundColor: '#24B075', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});

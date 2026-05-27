/**
 * Smart Campus Presence — BasicInfoScreen (Student Registration Step 1)
 *
 * Collects personal and academic info via controlled TextInputs.
 * Validates inline and navigates to CourseSelectScreen passing all form
 * data as route params.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { toast } from '@/lib/toast';
import { Colors } from '@/theme/colors';
import {
  FACULTIES,
  DEPARTMENTS,
  LEVELS,
  SEMESTERS,
  DEFAULT_FACULTY,
  DEFAULT_DEPARTMENT,
} from '@/constants';
import type { RegisterStackParamList } from '@/navigation/types';

// ---------------------------------------------------------------------------
// Navigation type
// ---------------------------------------------------------------------------

type BasicInfoNav = NativeStackNavigationProp<RegisterStackParamList, 'BasicInfo'>;

// ---------------------------------------------------------------------------
// Reusable modal-based picker
// ---------------------------------------------------------------------------

interface PickerFieldProps {
  label: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  onSelect: (val: string) => void;
  disabled?: boolean;
}

function PickerField({
  label,
  value,
  options,
  placeholder = 'Select…',
  onSelect,
  disabled = false,
}: PickerFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[styles.pickerBtn, disabled && { opacity: 0.45 }]}
      >
        <Text
          style={[
            styles.pickerBtnText,
            !value ? { color: Colors.mutedForeground } : undefined,
          ]}
        >
          {value || placeholder}
        </Text>
        <Text style={styles.pickerChevron}>›</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options as string[]}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => <View style={styles.modalSep} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    item === value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      item === value ? { color: Colors.accent } : undefined,
                    ]}
                  >
                    {item}
                  </Text>
                  {item === value ? (
                    <Text style={{ color: Colors.accent, fontSize: 16 }}>✓</Text>
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BasicInfoScreen() {
  const navigation = useNavigation<BasicInfoNav>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [faculty, setFaculty] = useState(DEFAULT_FACULTY);
  const [department, setDepartment] = useState(DEFAULT_DEPARTMENT);
  const [level, setLevel] = useState('');
  const [semester, setSemester] = useState('');

  const handleNext = () => {
    if (!fullName.trim()) {
      toast.error('Full name is required.');
      return;
    }
    if (!regNumber.trim()) {
      toast.error('Registration number is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (!faculty) {
      toast.error('Please select your faculty.');
      return;
    }
    if (!department) {
      toast.error('Please select your department.');
      return;
    }
    if (!level) {
      toast.error('Please select your level.');
      return;
    }
    if (!semester) {
      toast.error('Please select your semester.');
      return;
    }

    navigation.navigate('CourseSelect', {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      regNumber: regNumber.trim(),
      faculty,
      department,
      level,
      semester,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '33%' }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Personal Info</Text>
          <Text style={styles.subtitle}>Let's get you registered</Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Input
              label="Registration Number"
              value={regNumber}
              onChangeText={setRegNumber}
              placeholder="2021364001"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="john@university.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
            />

            {/* Faculty picker */}
            <PickerField
              label="Faculty"
              value={faculty}
              options={FACULTIES}
              placeholder="Select faculty"
              onSelect={(v) => {
                setFaculty(v);
                setDepartment('');
              }}
            />

            {/* Department picker — depends on faculty */}
            <PickerField
              label="Department"
              value={department}
              options={DEPARTMENTS[faculty] ?? []}
              placeholder="Select department"
              onSelect={setDepartment}
              disabled={!faculty}
            />

            {/* Level + Semester in a row */}
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <PickerField
                  label="Level"
                  value={level}
                  options={LEVELS}
                  placeholder="Level"
                  onSelect={setLevel}
                />
              </View>
              <View style={styles.rowItem}>
                <PickerField
                  label="Semester"
                  value={semester}
                  options={SEMESTERS}
                  placeholder="Semester"
                  onSelect={setSemester}
                />
              </View>
            </View>

            <Button onPress={handleNext} size="lg">
              Next  →
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginBottom: 28,
  },
  form: {
    gap: 18,
  },
  fieldLabel: {
    color: Colors.mutedForeground,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  pickerBtn: {
    backgroundColor: Colors.muted,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerBtnText: {
    fontSize: 15,
    color: Colors.foreground,
    flex: 1,
  },
  pickerChevron: {
    fontSize: 20,
    color: Colors.mutedForeground,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  modalSep: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(0,229,255,0.06)',
  },
  modalOptionText: {
    fontSize: 15,
    color: Colors.foreground,
    fontWeight: '500',
    flex: 1,
  },
});

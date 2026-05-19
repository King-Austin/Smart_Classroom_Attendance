/**
 * Smart Campus Presence — BasicInfoScreen (Student Registration Step 1)
 *
 * Collects personal and academic info. Validates with react-hook-form + zod,
 * then navigates to CourseSelectScreen passing all form data as route params.
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
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
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
// Validation schema
// ---------------------------------------------------------------------------

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  regNumber: z.string().min(4, 'Enter a valid registration number'),
  faculty: z.string().min(1, 'Select a faculty'),
  department: z.string().min(1, 'Select a department'),
  level: z.string().min(1, 'Select your level'),
  semester: z.string().min(1, 'Select a semester'),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Reusable select-picker component
// ---------------------------------------------------------------------------

interface PickerFieldProps {
  label: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  onSelect: (val: string) => void;
  error?: string;
  disabled?: boolean;
}

function PickerField({
  label,
  value,
  options,
  placeholder = 'Select…',
  onSelect,
  error,
  disabled = false,
}: PickerFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[
          styles.pickerBtn,
          error ? { borderColor: Colors.destructive } : undefined,
          disabled ? { opacity: 0.45 } : undefined,
        ]}
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
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

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
                    item === value ? styles.modalOptionSelected : undefined,
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

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      regNumber: '',
      faculty: DEFAULT_FACULTY,
      department: DEFAULT_DEPARTMENT,
      level: '',
      semester: '',
    },
  });

  const watchedFaculty = watch('faculty');

  const onNext = (data: FormValues) => {
    navigation.navigate('CourseSelect', {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      regNumber: data.regNumber,
      faculty: data.faculty,
      department: data.department,
      level: data.level,
      semester: data.semester,
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
            {/* Full Name */}
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name"
                  value={value}
                  onChangeText={onChange}
                  placeholder="John Doe"
                  autoCapitalize="words"
                  returnKeyType="next"
                  error={errors.fullName?.message}
                />
              )}
            />

            {/* Registration Number */}
            <Controller
              control={control}
              name="regNumber"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Registration Number"
                  value={value}
                  onChangeText={onChange}
                  placeholder="2021364001"
                  autoCapitalize="none"
                  returnKeyType="next"
                  error={errors.regNumber?.message}
                />
              )}
            />

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  placeholder="john@university.edu"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  error={errors.email?.message}
                />
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  error={errors.password?.message}
                />
              )}
            />

            {/* Faculty picker */}
            <Controller
              control={control}
              name="faculty"
              render={({ field: { onChange, value } }) => (
                <PickerField
                  label="Faculty"
                  value={value}
                  options={FACULTIES}
                  placeholder="Select faculty"
                  onSelect={(v) => {
                    onChange(v);
                    setValue('department', '');
                  }}
                  error={errors.faculty?.message}
                />
              )}
            />

            {/* Department picker — depends on faculty */}
            <Controller
              control={control}
              name="department"
              render={({ field: { onChange, value } }) => (
                <PickerField
                  label="Department"
                  value={value}
                  options={DEPARTMENTS[watchedFaculty] ?? []}
                  placeholder="Select department"
                  onSelect={onChange}
                  error={errors.department?.message}
                  disabled={!watchedFaculty}
                />
              )}
            />

            {/* Level + Semester row */}
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Controller
                  control={control}
                  name="level"
                  render={({ field: { onChange, value } }) => (
                    <PickerField
                      label="Level"
                      value={value}
                      options={LEVELS}
                      placeholder="Level"
                      onSelect={onChange}
                      error={errors.level?.message}
                    />
                  )}
                />
              </View>
              <View style={styles.rowItem}>
                <Controller
                  control={control}
                  name="semester"
                  render={({ field: { onChange, value } }) => (
                    <PickerField
                      label="Semester"
                      value={value}
                      options={SEMESTERS}
                      placeholder="Semester"
                      onSelect={onChange}
                      error={errors.semester?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Button onPress={handleSubmit(onNext)} size="lg">
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
  fieldError: {
    color: Colors.destructive,
    fontSize: 12,
    fontWeight: '500',
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
  // Modal
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

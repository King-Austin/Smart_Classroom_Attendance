/**
 * Smart Campus Presence — LecturerRegisterScreen
 *
 * Single-step registration for lecturers. Collects personal and academic info,
 * signs up via Supabase auth, inserts a `profiles` row with role='lecturer',
 * then the RootNavigator auth-state listener redirects to LecturerTabs.
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { Colors } from '@/theme/colors';
import {
  FACULTIES,
  DEPARTMENTS,
  DEFAULT_FACULTY,
  DEFAULT_DEPARTMENT,
} from '@/constants';
import type { AuthStackParamList } from '@/navigation/types';

// ---------------------------------------------------------------------------
// Navigation type
// ---------------------------------------------------------------------------

type LecturerRegisterNav = NativeStackNavigationProp<
  AuthStackParamList,
  'LecturerRegister'
>;

// ---------------------------------------------------------------------------
// Inline picker (same pattern as BasicInfoScreen, no shared component needed)
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

export default function LecturerRegisterScreen() {
  const navigation = useNavigation<LecturerRegisterNav>();

  const [form, setForm] = useState({
    fullName: '',
    staffId: '',
    email: '',
    password: '',
    faculty: DEFAULT_FACULTY,
    department: DEFAULT_DEPARTMENT,
  });
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    // Basic client-side validation
    if (!form.fullName.trim()) {
      toast.error('Full name is required.');
      return;
    }
    if (!form.staffId.trim()) {
      toast.error('Staff ID is required.');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email address is required.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (!form.faculty || !form.department) {
      toast.error('Please select your faculty and department.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Account creation failed. Please try again.');

      // 2. Insert profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: form.fullName.trim(),
        staff_id: form.staffId.trim(),
        role: 'lecturer',
        faculty: form.faculty,
        department: form.department,
      });

      if (profileError) throw profileError;

      toast.success('Registration successful! Welcome aboard.');
      // RootNavigator will detect the new session and route to LecturerTabs
    } catch (error: any) {
      console.error('LecturerRegister error:', error);
      toast.error(error?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Lecturer Registration</Text>
          <Text style={styles.subtitle}>Set up your lecturer account</Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={form.fullName}
              onChangeText={(v) => update('fullName', v)}
              placeholder="Dr. Jane Smith"
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Input
              label="Staff ID"
              value={form.staffId}
              onChangeText={(v) => update('staffId', v)}
              placeholder="STAFF/2024/001"
              autoCapitalize="characters"
              returnKeyType="next"
            />

            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => update('email', v)}
              placeholder="jane@university.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Input
              label="Password"
              value={form.password}
              onChangeText={(v) => update('password', v)}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <PickerField
              label="Faculty"
              value={form.faculty}
              options={FACULTIES}
              placeholder="Select faculty"
              onSelect={(v) => {
                update('faculty', v);
                update('department', '');
              }}
            />

            {form.faculty ? (
              <PickerField
                label="Department"
                value={form.department}
                options={DEPARTMENTS[form.faculty] ?? []}
                placeholder="Select department"
                onSelect={(v) => update('department', v)}
              />
            ) : null}

            <Button
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              size="lg"
            >
              Create Account
            </Button>

            {/* Sign-in link */}
            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => [styles.signInLink, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.signInText}>
                Already have an account?{' '}
                <Text style={styles.signInAccent}>Sign In</Text>
              </Text>
            </Pressable>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
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
  signInLink: {
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 4,
  },
  signInText: {
    fontSize: 13,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  signInAccent: {
    color: Colors.accent,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
    maxHeight: '60%',
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

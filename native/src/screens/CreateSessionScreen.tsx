/**
 * Smart Campus Presence — CreateSessionScreen
 *
 * Form to create a new attendance session:
 *  • Level (Modal picker), Semester (Modal picker), Course (Modal picker)
 *  • Topic (TextInput)
 *  • Toggle switches: GPS, BLE, Face
 *  • "Get My Location" button
 *  • "Launch Session" button — inserts into DB, starts BLE broadcast, navigates
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  MapPin,
  Wifi,
  Camera,
  Rocket,
  CheckCircle2,
  ChevronDown,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/theme/colors';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { getCurrentPosition } from '@/lib/geo';
import { useBlePeripheral } from '@/hooks/useBlePeripheral';
import { LEVELS, SEMESTERS, SESSION_STATUS } from '@/constants';
import type { Course } from '@/types';
import type { LecturerStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<LecturerStackParamList, 'CreateSession'>;

// ---------------------------------------------------------------------------
// Generic picker modal
// ---------------------------------------------------------------------------

interface PickerOption {
  label: string;
  value: string;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: PickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: Colors.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: Colors.border,
            paddingBottom: Platform.OS === 'ios' ? 34 : 16,
            maxHeight: '70%',
          }}
          onPress={() => {}} // prevent propagation
        >
          {/* Handle + title */}
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.border,
                marginBottom: 12,
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: Colors.foreground,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              {title}
            </Text>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }: ListRenderItemInfo<PickerOption>) => (
              <Pressable
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  backgroundColor:
                    item.value === selected
                      ? 'rgba(0,229,255,0.06)'
                      : pressed
                      ? 'rgba(255,255,255,0.03)'
                      : 'transparent',
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.border,
                })}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: item.value === selected ? '800' : '600',
                    color:
                      item.value === selected
                        ? Colors.accent
                        : Colors.foreground,
                  }}
                >
                  {item.label}
                </Text>
                {item.value === selected && (
                  <CheckCircle2
                    size={18}
                    color={Colors.accent}
                    strokeWidth={2.5}
                  />
                )}
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Select trigger button
// ---------------------------------------------------------------------------

interface SelectButtonProps {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}

function SelectButton({ label, value, placeholder, onPress }: SelectButtonProps) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: Colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 13,
          borderRadius: 14,
          backgroundColor: pressed ? Colors.muted : Colors.card,
          borderWidth: 1,
          borderColor: value ? 'rgba(0,229,255,0.30)' : Colors.border,
        })}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: '700',
            color: value ? Colors.foreground : Colors.mutedForeground,
          }}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={Colors.mutedForeground} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Toggle row
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ icon, label, value, onChange, disabled }: ToggleRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: value ? 'rgba(0,229,255,0.22)' : Colors.border,
        marginBottom: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: Colors.foreground,
          }}
        >
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{
          false: Colors.border,
          true: 'rgba(0,229,255,0.4)',
        }}
        thumbColor={value ? Colors.accent : Colors.mutedForeground}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

interface FormState {
  level: string;
  semester: string;
  courseId: string;
  topic: string;
  faceVerification: boolean;
  gpsVerification: boolean;
  bleVerification: boolean;
}

interface LocationState {
  lat: number | null;
  lng: number | null;
  captured: boolean;
}

export default function CreateSessionScreen() {
  const navigation = useNavigation<Nav>();
  const ble = useBlePeripheral();

  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [location, setLocation] = useState<LocationState>({
    lat: null,
    lng: null,
    captured: false,
  });

  const [form, setForm] = useState<FormState>({
    level: '',
    semester: '',
    courseId: '',
    topic: '',
    faceVerification: true,
    gpsVerification: true,
    bleVerification: true,
  });

  // Picker modal visibility
  const [picker, setPicker] = useState<
    'level' | 'semester' | 'course' | null
  >(null);

  // ---------------------------------------------------------------------------
  // Fetch profile once
  // ---------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch courses when level / semester / department change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!form.level || !form.semester || !profile?.department) {
      setCourses([]);
      return;
    }
    (async () => {
      setFetchingCourses(true);
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('level', form.level)
        .eq('semester', form.semester)
        .eq('department', profile.department);
      setCourses((data as Course[]) ?? []);
      setFetchingCourses(false);
    })();
  }, [form.level, form.semester, profile]);

  const updateForm = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  // ---------------------------------------------------------------------------
  // Get location
  // ---------------------------------------------------------------------------
  const handleGetLocation = useCallback(async () => {
    setFetchingLocation(true);
    try {
      const pos = await getCurrentPosition();
      setLocation({ lat: pos.latitude, lng: pos.longitude, captured: true });
      toast.success('Location anchored', `${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}`);
    } catch (err: any) {
      toast.error('Location error', err.message);
    } finally {
      setFetchingLocation(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Launch session
  // ---------------------------------------------------------------------------
  const handleLaunch = useCallback(async () => {
    if (!form.courseId) {
      toast.error('Select a course first');
      return;
    }
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Capture GPS if needed (and not already captured)
      let lat = location.lat;
      let lng = location.lng;
      if (form.gpsVerification && !location.captured) {
        const pos = await getCurrentPosition();
        lat = pos.latitude;
        lng = pos.longitude;
        setLocation({ lat, lng, captured: true });
      }

      // 2. Generate BLE token
      const bleToken = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      // 3. Insert session
      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert({
          course_id: form.courseId,
          lecturer_id: user.id,
          topic: form.topic || null,
          day_number: 1,
          verification_rules: {
            face: form.faceVerification,
            gps: form.gpsVerification,
            ble: form.bleVerification,
          },
          ble_token: bleToken,
          lecturer_lat: lat,
          lecturer_lng: lng,
          geo_radius_meters: 150,
          status: SESSION_STATUS.ACTIVE,
        })
        .select()
        .single();

      if (error) throw error;

      // 4. Start BLE broadcast
      if (form.bleVerification && data) {
        await ble.startBroadcast(bleToken);
      }

      // 5. Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      toast.success('Session launched!', 'Students can now join.');

      navigation.replace('LiveSession', { sessionId: data.id });
    } catch (err: any) {
      console.error('[CreateSession] launch error:', err);
      toast.error('Failed to launch session', err.message);
    } finally {
      setLoading(false);
    }
  }, [form, location, ble, navigation]);

  // ---------------------------------------------------------------------------
  // Picker option lists
  // ---------------------------------------------------------------------------
  const levelOptions: PickerOption[] = LEVELS.map((l) => ({
    label: l,
    value: l,
  }));
  const semesterOptions: PickerOption[] = SEMESTERS.map((s) => ({
    label: s,
    value: s,
  }));
  const courseOptions: PickerOption[] = courses.map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.id,
  }));
  const selectedCourse = courses.find((c) => c.id === form.courseId);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ArrowLeft size={18} color={Colors.mutedForeground} strokeWidth={2} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: Colors.mutedForeground,
              }}
            >
              Back
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 26,
              fontWeight: '900',
              color: Colors.foreground,
              letterSpacing: -0.5,
              marginBottom: 4,
            }}
          >
            Create Session
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: Colors.mutedForeground,
              marginBottom: 28,
            }}
          >
            Set up a new attendance session
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* Level + Semester row                                             */}
          {/* ---------------------------------------------------------------- */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <SelectButton
              label="Level"
              value={form.level}
              placeholder="Select"
              onPress={() => setPicker('level')}
            />
            <SelectButton
              label="Semester"
              value={
                form.semester
                  ? form.semester === '1st Semester'
                    ? 'Sem 1'
                    : 'Sem 2'
                  : ''
              }
              placeholder="Select"
              onPress={() => setPicker('semester')}
            />
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* Course                                                           */}
          {/* ---------------------------------------------------------------- */}
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: Colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 6,
              }}
            >
              Course
            </Text>
            {fetchingCourses ? (
              <View
                style={{
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: Colors.card,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <ActivityIndicator color={Colors.accent} size="small" />
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.mutedForeground,
                    fontStyle: 'italic',
                  }}
                >
                  Loading courses…
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() =>
                  courses.length > 0 ? setPicker('course') : undefined
                }
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: pressed ? Colors.muted : Colors.card,
                  borderWidth: 1,
                  borderColor: form.courseId
                    ? 'rgba(0,229,255,0.30)'
                    : Colors.border,
                  opacity: courses.length === 0 ? 0.5 : 1,
                })}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: '700',
                    color: form.courseId
                      ? Colors.foreground
                      : Colors.mutedForeground,
                  }}
                >
                  {selectedCourse
                    ? `${selectedCourse.code} — ${selectedCourse.name}`
                    : courses.length === 0 && form.level && form.semester
                    ? 'No courses available'
                    : 'Select course'}
                </Text>
                <ChevronDown
                  size={16}
                  color={Colors.mutedForeground}
                  strokeWidth={2}
                />
              </Pressable>
            )}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* Topic                                                            */}
          {/* ---------------------------------------------------------------- */}
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: Colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 6,
              }}
            >
              Topic (optional)
            </Text>
            <TextInput
              value={form.topic}
              onChangeText={(v) => updateForm('topic', v)}
              placeholder="e.g. Binary Trees"
              placeholderTextColor={Colors.mutedForeground}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 13,
                borderRadius: 14,
                backgroundColor: Colors.card,
                borderWidth: 1,
                borderColor: form.topic
                  ? 'rgba(0,229,255,0.30)'
                  : Colors.border,
                fontSize: 14,
                fontWeight: '600',
                color: Colors.foreground,
              }}
            />
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* Get My Location                                                  */}
          {/* ---------------------------------------------------------------- */}
          <Pressable
            onPress={handleGetLocation}
            disabled={fetchingLocation}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: location.captured
                ? 'rgba(36,176,117,0.12)'
                : pressed
                ? Colors.muted
                : Colors.card,
              borderWidth: 1,
              borderColor: location.captured
                ? 'rgba(36,176,117,0.35)'
                : Colors.border,
              marginBottom: 20,
              opacity: fetchingLocation ? 0.7 : 1,
            })}
          >
            {fetchingLocation ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <MapPin
                size={16}
                color={location.captured ? Colors.success : Colors.accent}
                strokeWidth={2}
              />
            )}
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: location.captured ? Colors.success : Colors.accent,
              }}
            >
              {fetchingLocation
                ? 'Getting Location…'
                : location.captured
                ? `Anchored  (${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)})`
                : 'Get My Location'}
            </Text>
          </Pressable>

          {/* ---------------------------------------------------------------- */}
          {/* Verification toggles                                             */}
          {/* ---------------------------------------------------------------- */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: Colors.mutedForeground,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            Verification Layers
          </Text>

          <ToggleRow
            icon={
              <Camera size={16} color={Colors.accent} strokeWidth={2} />
            }
            label="Face Recognition"
            value={form.faceVerification}
            onChange={(v) => updateForm('faceVerification', v)}
          />
          <ToggleRow
            icon={
              <MapPin size={16} color={Colors.accent} strokeWidth={2} />
            }
            label="GPS / Geo-fence"
            value={form.gpsVerification}
            onChange={(v) => updateForm('gpsVerification', v)}
          />
          <ToggleRow
            icon={<Wifi size={16} color={Colors.accent} strokeWidth={2} />}
            label="BLE Detection"
            value={form.bleVerification}
            onChange={(v) => updateForm('bleVerification', v)}
          />

          {/* ---------------------------------------------------------------- */}
          {/* Launch button                                                    */}
          {/* ---------------------------------------------------------------- */}
          <Pressable
            onPress={handleLaunch}
            disabled={loading || !form.courseId}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              paddingVertical: 16,
              borderRadius: 18,
              backgroundColor:
                loading || !form.courseId
                  ? Colors.muted
                  : pressed
                  ? 'rgba(0,229,255,0.8)'
                  : Colors.accent,
              marginTop: 24,
            })}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <Rocket
                size={18}
                color={
                  form.courseId ? Colors.background : Colors.mutedForeground
                }
                strokeWidth={2.5}
              />
            )}
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color:
                  form.courseId ? Colors.background : Colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              {loading ? 'Launching…' : 'Launch Session'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* -------------------------------------------------------------------- */}
      {/* Picker modals                                                        */}
      {/* -------------------------------------------------------------------- */}
      <PickerModal
        visible={picker === 'level'}
        title="Select Level"
        options={levelOptions}
        selected={form.level}
        onSelect={(v) => updateForm('level', v)}
        onClose={() => setPicker(null)}
      />
      <PickerModal
        visible={picker === 'semester'}
        title="Select Semester"
        options={semesterOptions}
        selected={form.semester}
        onSelect={(v) => updateForm('semester', v)}
        onClose={() => setPicker(null)}
      />
      <PickerModal
        visible={picker === 'course'}
        title="Select Course"
        options={courseOptions}
        selected={form.courseId}
        onSelect={(v) => updateForm('courseId', v)}
        onClose={() => setPicker(null)}
      />
    </SafeAreaView>
  );
}

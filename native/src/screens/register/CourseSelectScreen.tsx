/**
 * Smart Campus Presence — CourseSelectScreen (Student Registration Step 2)
 *
 * Fetches courses filtered by the student's department, level, and semester.
 * The student checks off the courses they are taking this semester, then
 * continues to face-enrollment.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Button } from '@/components/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { Colors } from '@/theme/colors';
import type { RegisterStackParamList } from '@/navigation/types';
import type { Course } from '@/types';

// ---------------------------------------------------------------------------
// Navigation / route types
// ---------------------------------------------------------------------------

type CourseSelectNav = NativeStackNavigationProp<RegisterStackParamList, 'CourseSelect'>;
type CourseSelectRoute = RouteProp<RegisterStackParamList, 'CourseSelect'>;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CourseSelectScreen() {
  const navigation = useNavigation<CourseSelectNav>();
  const route = useRoute<CourseSelectRoute>();
  const params = route.params;

  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('level', params.level)
          .eq('semester', params.semester);

        if (error) throw error;
        setCourses(data ?? []);
      } catch {
        toast.error('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [params.level, params.semester]);

  const toggleCourse = (courseId: string) => {
    setSelected((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const handleNext = () => {
    if (selected.length === 0) {
      toast.error('Please select at least one course.');
      return;
    }
    navigation.navigate('FaceEnroll', {
      ...params,
      courseIds: selected,
    });
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderCourse = ({ item }: { item: Course }) => {
    const isSelected = selected.includes(item.id);
    return (
      <Pressable
        onPress={() => toggleCourse(item.id)}
        style={({ pressed }) => [
          styles.courseCard,
          isSelected && styles.courseCardSelected,
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={styles.courseInfo}>
          <Text style={styles.courseCode}>{item.code}</Text>
          <Text style={styles.courseName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.courseMeta}>{item.semester}</Text>
        </View>

        {/* Checkbox indicator */}
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected ? <View style={styles.checkboxDot} /> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.stepLabel}>Step 2 of 3</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '66%' }]} />
      </View>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Course Selection</Text>
        <Text style={styles.subtitle}>
          Select the courses you are offering this semester
        </Text>
      </View>

      {/* Course list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading courses…</Text>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            No courses found for your level and semester.
          </Text>
          <Text style={styles.emptySubtext}>
            {params.level} · {params.semester}
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourse}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Footer CTA */}
      <View style={styles.footer}>
        {selected.length > 0 ? (
          <Text style={styles.selectionCount}>
            {selected.length} course{selected.length !== 1 ? 's' : ''} selected
          </Text>
        ) : null}
        <Button
          onPress={handleNext}
          disabled={selected.length === 0 || loading}
          size="lg"
        >
          Next  →
        </Button>
      </View>
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
  titleBlock: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
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
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  courseCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    opacity: 0.75,
  },
  courseCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(0,229,255,0.05)',
    opacity: 1,
  },
  courseInfo: {
    flex: 1,
    gap: 3,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: 0.5,
  },
  courseName: {
    fontSize: 13,
    color: Colors.foreground,
    opacity: 0.85,
    lineHeight: 18,
  },
  courseMeta: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.mutedForeground,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkboxDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#0A0A0F',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.mutedForeground,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.mutedForeground,
    textAlign: 'center',
    opacity: 0.7,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

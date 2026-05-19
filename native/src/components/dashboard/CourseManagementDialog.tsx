import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { supabase } from '@/integrations/supabase/client';

interface CourseManagementDialogProps {
  visible: boolean;
  studentId: string;
  onClose: () => void;
}

interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  level: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  courses: Course;
}

interface StudentProfile {
  level: string | null;
  department: string | null;
}

export default function CourseManagementDialog({
  visible,
  studentId,
  onClose,
}: CourseManagementDialogProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'enrolled' | 'add'>('enrolled');

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);

    try {
      // Fetch student profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('level, department')
        .eq('id', studentId)
        .single();

      setProfile(profileData ?? null);

      // Fetch current enrollments with course details
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('id, course_id, courses(id, code, name, department, level)')
        .eq('student_id', studentId);

      if (enrollmentData) {
        setEnrollments(enrollmentData as unknown as Enrollment[]);
      }

      // Fetch available courses filtered by student level/department
      if (profileData) {
        let query = supabase
          .from('courses')
          .select('id, code, name, department, level');

        if (profileData.level) {
          query = query.eq('level', profileData.level);
        }
        if (profileData.department) {
          query = query.eq('department', profileData.department);
        }

        const { data: coursesData } = await query;

        if (coursesData) {
          const enrolledIds = new Set(
            (enrollmentData ?? []).map((e: any) => e.course_id),
          );
          setAvailableCourses(
            coursesData.filter((c) => !enrolledIds.has(c.id)),
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, fetchData]);

  const handleRemove = async (enrollmentId: string, courseId: string) => {
    setActionLoading(enrollmentId);
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (!error) {
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      const removed = enrollments.find((e) => e.id === enrollmentId);
      if (removed) {
        setAvailableCourses((prev) => [...prev, removed.courses]);
      }
    }
    setActionLoading(null);
  };

  const handleAdd = async (course: Course) => {
    setActionLoading(course.id);
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ student_id: studentId, course_id: course.id })
      .select('id, course_id, courses(id, code, name, department, level)')
      .single();

    if (!error && data) {
      setEnrollments((prev) => [...prev, data as unknown as Enrollment]);
      setAvailableCourses((prev) => prev.filter((c) => c.id !== course.id));
    }
    setActionLoading(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Manage Courses</Text>
                <TouchableOpacity onPress={onClose} hitSlop={12}>
                  <Text style={styles.closeText}>Done</Text>
                </TouchableOpacity>
              </View>

              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, tab === 'enrolled' && styles.tabActive]}
                  onPress={() => setTab('enrolled')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      tab === 'enrolled' && styles.tabTextActive,
                    ]}
                  >
                    Enrolled ({enrollments.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, tab === 'add' && styles.tabActive]}
                  onPress={() => setTab('add')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      tab === 'add' && styles.tabTextActive,
                    ]}
                  >
                    Add Course
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              {loading ? (
                <View style={styles.centered}>
                  <ActivityIndicator color="#00F5FF" />
                </View>
              ) : tab === 'enrolled' ? (
                <FlatList
                  data={enrollments}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No courses enrolled yet.</Text>
                  }
                  renderItem={({ item }) => (
                    <View style={styles.courseRow}>
                      <View style={styles.courseInfo}>
                        <Text style={styles.courseCode}>
                          {item.courses?.code}
                        </Text>
                        <Text style={styles.courseName} numberOfLines={1}>
                          {item.courses?.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() =>
                          handleRemove(item.id, item.course_id)
                        }
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Text style={styles.removeText}>Remove</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
              ) : (
                <FlatList
                  data={availableCourses}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      No additional courses available for your level/department.
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <View style={styles.courseRow}>
                      <View style={styles.courseInfo}>
                        <Text style={styles.courseCode}>{item.code}</Text>
                        <Text style={styles.courseName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAdd(item)}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? (
                          <ActivityIndicator size="small" color="#00F5FF" />
                        ) : (
                          <Text style={styles.addText}>+ Add</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#14141C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00F5FF',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabActive: {
    backgroundColor: 'rgba(0, 245, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  tabTextActive: {
    color: '#00F5FF',
    fontWeight: '700',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 8,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00F5FF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  courseName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    minWidth: 72,
    alignItems: 'center',
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 245, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    minWidth: 64,
    alignItems: 'center',
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00F5FF',
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 14,
    paddingVertical: 32,
    lineHeight: 20,
  },
});

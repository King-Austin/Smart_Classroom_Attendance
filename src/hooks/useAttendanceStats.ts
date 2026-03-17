import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAttendanceStats = (studentId: string | undefined) => {
  const [stats, setStats] = useState({
    overallProgress: 0,
    totalSessions: 0,
    attendedSessions: 0,
    courseBreakdown: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // 1. Get all enrollments
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id, courses(id, name, code)")
          .eq("student_id", studentId);

        if (!enrollments) return;

        // 2. Get all sessions for these courses (remove 'completed' filter to include active ones)
        const courseIds = enrollments.map(e => e.course_id);
        const { data: sessions } = await supabase
          .from("attendance_sessions")
          .select("id, course_id, status")
          .in("course_id", courseIds);

        // 3. Get all records for this student
        const { data: records } = await supabase
          .from("attendance_records")
          .select("session_id")
          .eq("student_id", studentId);

        const recordSet = new Set(records?.map(r => r.session_id) || []);

        // 4. Calculate stats per course
        const breakdown = enrollments.map(e => {
          const courseSessions = sessions?.filter(s => s.course_id === e.course_id) || [];
          const courseAttended = courseSessions.filter(s => recordSet.has(s.id)).length;
          const percentage = courseSessions.length > 0 
            ? Math.round((courseAttended / courseSessions.length) * 100) 
            : 100;

          return {
            id: e.course_id,
            code: e.courses?.code,
            name: e.courses?.name,
            total: courseSessions.length,
            attended: courseAttended,
            percentage
          };
        });

        const totalSess = sessions?.length || 0;
        const attendedSess = sessions?.filter(s => recordSet.has(s.id)).length || 0;
        const progress = totalSess > 0 ? Math.round((attendedSess / totalSess) * 100) : 100;

        setStats({
          overallProgress: progress,
          totalSessions: totalSess,
          attendedSessions: attendedSess,
          courseBreakdown: breakdown
        });
      } catch (err) {
        console.error("useAttendanceStats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Subscribe to both records and sessions for real-time updates
    const channel = supabase
      .channel(`attendance-stats-${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records', filter: `student_id=eq.${studentId}` },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_sessions' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  return { stats, loading };
};

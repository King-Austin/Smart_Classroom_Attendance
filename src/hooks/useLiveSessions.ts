import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SessionWithDetails } from "@/types";

export const useLiveSessions = (studentId: string | undefined) => {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", studentId);
        
        const courseIds = enrollments?.map(e => e.course_id) || [];

        if (courseIds.length > 0) {
          const { data, error } = await supabase
            .from("attendance_sessions")
            .select(`
              *,
              courses!inner(name, code),
              lecturer:profiles!lecturer_id(full_name),
              attendance_records(
                id,
                student_id,
                profiles!student_id(full_name, avatar_url)
              )
            `)
            .eq("status", "active")
            .in("course_id", courseIds);
          
          if (error) throw error;

          // Map the sessions to include has_marked and attendee_count
          const enhancedSessions = (data as any[]).map(session => ({
            ...session,
            attendee_count: session.attendance_records?.length || 0,
            has_marked: session.attendance_records?.some((r: any) => r.student_id === studentId) || false
          }));

          setSessions(enhancedSessions as any);
        }
      } catch (err) {
        console.error("useLiveSessions error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    const channel = supabase
      .channel('live-sessions-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_sessions' },
        () => fetchSessions()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records' },
        () => fetchSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  return { sessions, loading };
};

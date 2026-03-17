import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SessionWithDetails, AttendanceRecordWithProfile } from "@/types";
import { toast } from "sonner";

export const useSessionData = (sessionId: string | undefined) => {
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [records, setRecords] = useState<AttendanceRecordWithProfile[]>([]);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      // 1. Fetch Session
      const { data: sessionData, error: sessionError } = await supabase
        .from("attendance_sessions")
        .select("*, courses(name, code), lecturer:profiles!lecturer_id(full_name)")
        .eq("id", sessionId)
        .single();
      
      if (sessionError) throw sessionError;
      setSession(sessionData as any);

      // 2. Fetch Records
      const { data: recordsData, error: recordsError } = await supabase
        .from("attendance_records")
        .select("*, profiles!student_id(full_name, reg_number, avatar_url)")
        .eq("session_id", sessionId)
        .order('created_at', { ascending: false });
      
      if (recordsError) throw recordsError;
      setRecords(recordsData as any);

      // 3. Fetch Total Enrolled
      if (sessionData) {
        const { count } = await supabase
          .from("enrollments")
          .select("*", { count: 'exact', head: true })
          .eq("course_id", sessionData.course_id);
        setTotalEnrolled(count || 0);
      }
    } catch (err: any) {
      console.error("useSessionData error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`session-realtime-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance_records",
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          // Fetch profile for the new record
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, reg_number, avatar_url")
            .eq("id", payload.new.student_id)
            .single();

          const newRecord = {
            ...payload.new,
            profiles: profile
          };
          
          setRecords((prev) => [newRecord as any, ...prev]);
          toast.success(`New Check-in: ${profile?.full_name || 'Student'}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, records, totalEnrolled, loading, refresh: fetchData, setRecords };
};

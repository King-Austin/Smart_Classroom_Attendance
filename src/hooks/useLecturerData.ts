import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats, SessionWithDetails } from "@/types";
import { calculatePercentage } from "@/lib/utils";

export const useLecturerData = (lecturerId: string | undefined) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    courseCount: 0,
    avgRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lecturerId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: sessionsData } = await supabase
          .from("attendance_sessions")
          .select(`
            *,
            courses(name, code),
            attendance_records(id, status)
          `)
          .eq("lecturer_id", lecturerId)
          .order("created_at", { ascending: false });

        if (sessionsData) {
          const sessionsWithStats = await Promise.all(sessionsData.map(async (s: any) => {
            const { count: totalEnrolled } = await supabase
              .from("enrollments")
              .select("*", { count: 'exact', head: true })
              .eq("course_id", s.course_id);
            
            const present = s.attendance_records?.filter((r: any) => r.status === 'verified').length || 0;
            return {
              ...s,
              present,
              total: totalEnrolled || 0,
            };
          }));
          setSessions(sessionsWithStats);

          const uniqueCourseIds = new Set(sessionsData.map(s => s.course_id));
          const { data: assignments } = await supabase
            .from("enrollments")
            .select("student_id")
            .in("course_id", Array.from(uniqueCourseIds));
          const totalStudents = new Set(assignments?.map(a => a.student_id)).size;

          const totalPresent = sessionsWithStats.reduce((acc, s) => acc + s.present, 0);
          const totalPossible = sessionsWithStats.reduce((acc, s) => acc + s.total, 0);
          const avgRate = calculatePercentage(totalPresent, totalPossible);

          setStats({
            totalStudents,
            courseCount: uniqueCourseIds.size,
            avgRate
          });
        }
      } catch (err) {
        console.error("useLecturerData error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lecturerId]);

  return { sessions, stats, loading };
};

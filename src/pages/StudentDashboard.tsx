import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, BarChart3, User, CheckCircle2, XCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useLiveSessions } from "@/hooks/useLiveSessions";
import { calculatePercentage } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/date";
import { ATTENDANCE_STATUS } from "@/constants";

// Sub-components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LiveSessionCard } from "@/components/dashboard/LiveSessionCard";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const { profile, loading: profileLoading } = useProfile();
  const { sessions: liveSessions, loading: sessionsLoading } = useLiveSessions(profile?.id);
  
  const [history, setHistory] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoryAndCourses = async () => {
      if (!profile) return;
      setLoading(true);
      
      // Fetch Courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, courses(*)")
        .eq("student_id", profile.id);
      
      setCourses(enrollments?.map(e => e.courses) || []);

      // Fetch History
      const { data: historyData } = await supabase
        .from("attendance_records")
        .select("*, attendance_sessions(courses(name, code))")
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (historyData) setHistory(historyData);
      setLoading(false);
    };

    fetchHistoryAndCourses();
  }, [profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (profileLoading && !profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="safe-top" />
      
      <DashboardHeader profile={profile} onLogout={handleLogout} />

      {activeTab === "home" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-5">
          {/* Live Sessions */}
          {liveSessions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Live Sessions
              </h2>
              {liveSessions.map((session) => (
                <LiveSessionCard key={session.id} session={session} />
              ))}
            </div>
          )}

          {/* Course Attendance */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 font-heading">My Courses</h2>
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="p-4 rounded-xl bg-card border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{course.code} - {course.name}</p>
                    <span className="text-xs font-bold text-accent">Active</span>
                  </div>
                  <Progress value={100} className="h-1.5 rounded-full" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">{course.level} Level · {course.semester} Semester</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent History */}
          {history.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Recent History</h2>
              <div className="space-y-2">
                {history.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    {item.status === ATTENDANCE_STATUS.VERIFIED ? (
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.attendance_sessions?.courses?.code}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(item.created_at)} · {formatTime(item.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${item.status === ATTENDANCE_STATUS.VERIFIED ? "text-accent" : "text-destructive"}`}>
                        {item.status === ATTENDANCE_STATUS.VERIFIED ? "Present" : "Failed"}
                      </span>
                      <button 
                        onClick={() => navigate(`/ledger/${item.session_id}`)}
                        className="text-[9px] text-zinc-500 font-bold uppercase hover:text-accent transition-colors"
                      >
                        Ledger →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Analytics & Profile Tabs truncated for brevity, same pattern applies */}
      {activeTab === "analytics" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5">
          <h2 className="text-lg font-bold font-heading mb-4">Analytics</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-accent">{calculatePercentage(history.filter(h => h.status === 'verified').length, history.length)}%</p>
              <p className="text-xs text-muted-foreground">Recent Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-xs text-muted-foreground">Enrolled Courses</p>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5">
          <h2 className="text-lg font-bold font-heading mb-4">Profile</h2>
          <div className="p-5 rounded-xl bg-card border border-border space-y-4">
             {/* Profile content using profile state from hook */}
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-primary" />
            </div>
            {[
              ["Name", profile?.full_name],
              ["Reg Number", profile?.reg_number],
              ["Level", profile?.level],
              ["Faculty", profile?.faculty],
              ["Department", profile?.department],
              ["Face Status", profile?.face_enrolled ? "✓ Enrolled" : "Not Enrolled"],
              ["Device Binding", profile?.device_binding ? "✓ Active" : "Inactive"],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label as string}</span>
                <span className="font-medium">{value as string}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: "home", icon: BookOpen, label: "Home" },
          { id: "analytics", icon: BarChart3, label: "Analytics" },
          { id: "profile", icon: User, label: "Profile" },
        ]}
      />
    </div>
  );
};

export default StudentDashboard;

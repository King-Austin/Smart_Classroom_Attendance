import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, Bell, BarChart3, User, Clock, CheckCircle2, XCircle,
  AlertTriangle, ChevronRight, LogOut
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { useEffect, useState } from "react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState<any>(null);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // 2. Fetch Active Sessions for enrolled courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, courses(*)")
        .eq("student_id", user.id);
      
      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
      const enrolledCourses = enrollments?.map(e => e.courses) || [];
      setCourses(enrolledCourses);

      if (enrolledCourseIds.length > 0) {
        // Use explicit join syntax and ensure we only get active sessions
        const { data: sessions, error: sessionError } = await supabase
          .from("attendance_sessions")
          .select(`
            *,
            courses!inner(name, code),
            lecturer:profiles!lecturer_id(full_name)
          `)
          .eq("status", "active")
          .in("course_id", enrolledCourseIds);
        
        if (sessionError) console.error("Session fetch error:", sessionError);
        if (sessions) setLiveSessions(sessions);
      }

      // 3. Fetch History
      const { data: historyData } = await supabase
        .from("attendance_records")
        .select("*, attendance_sessions(courses(name, code))")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (historyData) setHistory(historyData);
      setLoading(false);
    };

    fetchDashboardData();

    // 4. Realtime subscription for sessions
    const channel = supabase
      .channel('live-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_sessions',
          filter: 'status=eq.active'
        },
        async () => {
          // Re-fetch all active sessions for enrolled courses when any session changes
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: enrollments } = await supabase
            .from("enrollments")
            .select("course_id")
            .eq("student_id", user.id);
          
          const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
          
          if (enrolledCourseIds.length > 0) {
            const { data: sessions } = await supabase
              .from("attendance_sessions")
              .select(`
                *,
                courses!inner(name, code),
                lecturer:profiles!lecturer_id(full_name)
              `)
              .eq("status", "active")
              .in("course_id", enrolledCourseIds);
            
            if (sessions) setLiveSessions(sessions);
          } else {
            setLiveSessions([]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="safe-top" />
      
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-foreground">Hi, {profile?.full_name?.split(' ')[0] || 'Student'} 👋</h1>
          <p className="text-xs text-muted-foreground">{profile?.department} · {profile?.level} Level</p>
        </div>
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <Bell className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <LogOut className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

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
                <motion.div
                  key={session.id}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl bg-card border border-accent/20 shadow-sm mb-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{session.courses?.code} - {session.courses?.name}</p>
                      <p className="text-xs text-muted-foreground">{session.lecturer?.full_name} · {session.topic}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent/10 text-accent uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Started {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex flex-col gap-2 w-full mt-2">
                       <Button 
                         onClick={(e) => { e.stopPropagation(); navigate(`/student/verify/${session.id}`); }}
                         className="h-9 rounded-xl bg-accent text-accent-foreground text-xs font-bold w-full"
                       >
                         Mark Attendance <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                       </Button>
                       <Button 
                         variant="outline"
                         onClick={(e) => { e.stopPropagation(); navigate(`/ledger/${session.id}`); }}
                         className="h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider w-full"
                       >
                         View Ledger
                       </Button>
                    </div>
                  </div>
                </motion.div>
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
                    {item.status === "verified" ? (
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.attendance_sessions?.courses?.code}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${item.status === "verified" ? "text-accent" : "text-destructive"}`}>
                        {item.status === "verified" ? "Present" : "Failed"}
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

      {activeTab === "analytics" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5">
          <h2 className="text-lg font-bold font-heading mb-4">Analytics</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-accent">{Math.round((history.filter(h => h.status === 'verified').length / (history.length || 1)) * 100)}%</p>
              <p className="text-xs text-muted-foreground">Recent Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-xs text-muted-foreground">Enrolled Courses</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-accent">{history.filter(h => h.status === 'verified').length}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-destructive">{history.filter(h => h.status === 'failed').length}</p>
              <p className="text-xs text-muted-foreground">Failed/Absent</p>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5">
          <h2 className="text-lg font-bold font-heading mb-4">Profile</h2>
          <div className="p-5 rounded-xl bg-card border border-border space-y-4">
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

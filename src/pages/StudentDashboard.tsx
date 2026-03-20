import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, BarChart3, User, CheckCircle2, XCircle, Edit2, LogOut, ChevronRight, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { CourseManagementDialog } from "@/components/dashboard/CourseManagementDialog";
import { AttendanceScoreboard } from "@/components/dashboard/AttendanceScoreboard";
import { useAttendanceStats } from "@/hooks/useAttendanceStats";
import { getUniqueDeviceId } from "@/lib/device";
import LivenessScanner from "@/components/verification/LivenessScanner";
import { toast } from "sonner";
import { PresenceLoader } from "@/components/PresenceLoader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [editMode, setEditMode] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { profile, loading: profileLoading } = useProfile();
  const { sessions: liveSessions, loading: sessionsLoading } = useLiveSessions(profile?.id);
  const { stats, loading: statsLoading } = useAttendanceStats(profile?.id);
  
  const [history, setHistory] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeviceVerification, setShowDeviceVerification] = useState(false);
  const [isVerifyingDevice, setIsVerifyingDevice] = useState(false);

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

  // Device Binding & Verification Logic
  useEffect(() => {
    const checkDeviceBinding = async () => {
      if (!profile || isVerifyingDevice) return;

      const currentDeviceId = await getUniqueDeviceId();
      
      // If profile has a bound device and it doesn't match current
      if (profile.device_info && profile.device_info !== currentDeviceId) {
        setIsVerifyingDevice(true);
        setShowDeviceVerification(true);
        toast.warning("New Device Detected", {
          description: "Please complete a liveness check to verify your identity."
        });
      } 
      // Auto-bind if not set yet
      else if (!profile.device_info) {
        await supabase
          .from("profiles")
          .update({ device_info: currentDeviceId } as any)
          .eq("id", profile.id);
      }
    };

    if (profile && !profileLoading) {
      checkDeviceBinding();
    }
  }, [profile, profileLoading]);

  const handleDeviceVerified = async (images: string[]) => {
    try {
      if (images.length < 3) throw new Error("Incomplete biometric capture");

      const currentDeviceId = await getUniqueDeviceId();
      const { error } = await supabase
        .from("profiles")
        .update({ 
          device_info: currentDeviceId,
          device_binding: true
        } as any)
        .eq("id", profile?.id);

      if (error) throw error;
      
      toast.success("Identity Verified", {
        description: "Your session has been securely bound to this device."
      });
      setShowDeviceVerification(false);
      setIsVerifyingDevice(false);
    } catch (err) {
      toast.error("Verification Update Failed");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PresenceLoader message="Synchronizing Protocol..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 selection:bg-accent/30">
      <div className="safe-top" />
      
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="px-5 pt-6 pb-4 flex items-center justify-between relative z-20">
        <div>
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-1">Student Node</p>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Active Portal</h1>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <button 
            onClick={() => setIsLogoutOpen(true)}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showDeviceVerification && (
        <LivenessScanner 
          onVerify={handleDeviceVerified}
          onCancel={() => setShowDeviceVerification(false)}
        />
      )}

      <AnimatePresence mode="wait">
        {activeTab === "home" && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="px-5 space-y-6 relative z-10"
          >
            {/* Attendance Scoreboard */}
            <AttendanceScoreboard 
              progress={stats.overallProgress}
              attended={stats.attendedSessions}
              total={stats.totalSessions}
              ranking={
                stats.overallProgress >= 95 ? "Top 5% of your department" :
                stats.overallProgress >= 85 ? "Top 15% of your department" :
                stats.overallProgress >= 70 ? "Top 30% of your department" :
                stats.overallProgress >= 50 ? "Top 50% of your department" :
                "Keep pushing for Top 50%!"
              }
              loading={statsLoading}
            />

            {/* Live Sessions */}
            {liveSessions.length > 0 ? (
              <div>
                <h2 className="text-xs font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-widest px-1">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Live Sessions
                </h2>
                <div className="space-y-4">
                  {liveSessions.map((session) => (
                    <LiveSessionCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center rounded-[2.5rem] border border-dashed border-border bg-card/30 backdrop-blur-md">
                 <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-zinc-400" />
                 </div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No Active Sessions</p>
                 <p className="text-xs text-zinc-500 mt-1">Check back when your lecture starts.</p>
              </div>
            )}

            {/* Recent History */}
            {history.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-muted-foreground mb-4 px-1 uppercase tracking-widest">Recent Activity</h2>
                <div className="space-y-3">
                  {history.map((item, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="flex items-center gap-4 p-4 rounded-3xl bg-card border border-border shadow-sm group hover:border-accent/30 transition-all"
                    >
                      {item.status === ATTENDANCE_STATUS.VERIFIED ? (
                        <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                           <CheckCircle2 className="w-5 h-5 text-accent" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                           <XCircle className="w-5 h-5 text-destructive" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{item.attendance_sessions?.courses?.code}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                          {formatDate(item.created_at)} · {formatTime(item.created_at)}
                        </p>
                      </div>
                      <ChevronRight 
                        onClick={() => navigate(`/ledger/${item.session_id}`)}
                        className="w-4 h-4 text-zinc-300 group-hover:text-accent cursor-pointer transition-all" 
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="px-5 relative z-10"
          >
            <h2 className="text-xl font-bold font-heading mb-6 px-1 tracking-tight">Analytics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[2.5rem] bg-card border border-border text-center shadow-lg">
                <p className="text-3xl font-bold text-accent font-heading">{calculatePercentage(history.filter(h => h.status === 'verified').length, history.length)}%</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Consistency</p>
              </div>
              <div className="p-6 rounded-[2.5rem] bg-card border border-border text-center shadow-lg">
                <p className="text-3xl font-bold text-foreground font-heading">{courses.length}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Enrollments</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="px-5 space-y-6 relative z-10"
          >
            <h2 className="text-xl font-bold font-heading mb-6 px-1 tracking-tight">Identity & Vault</h2>
            
            {/* Identity Card */}
            <div className="p-6 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-2xl">
               <div className="flex items-center gap-5 mb-8">
                  <div className="w-20 h-20 rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 border border-border/50 flex items-center justify-center overflow-hidden">
                     {profile?.avatar_url ? (
                       <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                     ) : (
                       <User className="w-8 h-8 text-zinc-400" />
                     )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{profile?.full_name}</h3>
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-0.5">{profile?.reg_number}</p>
                    <p className="text-[9px] text-muted-foreground mt-1 font-bold uppercase tracking-tighter">{profile?.department}</p>
                  </div>
               </div>

               <div className="space-y-2">
                 {[
                   ["Level", profile?.level],
                   ["Faculty", profile?.faculty],
                   ["Biometrics", profile?.face_enrolled ? "✓ Active" : "Missing"],
                   ["Hardware", profile?.device_info ? "✓ Bound" : "Unbound"],
                 ].map(([label, value]) => (
                   <div key={label as string} className="flex justify-between items-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-border/40">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label as string}</span>
                      <span className="text-xs font-bold">{value as string}</span>
                   </div>
                 ))}
               </div>

               <Button 
                onClick={() => setIsLogoutOpen(true)}
                variant="destructive"
                className="w-full mt-6 h-14 rounded-2xl font-bold uppercase tracking-widest text-[11px]"
              >
                End Session
              </Button>
            </div>

            {/* Courses Section (Moved from Home) */}
            <div className="bg-card/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-border relative overflow-hidden">
               {/* Background detail */}
               <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/5 blur-3xl rounded-full" />
               
              <div className="flex items-center justify-between mb-8 px-1">
                <div>
                  <h2 className="text-xs font-black text-accent uppercase tracking-[0.3em] flex items-center gap-2 mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Protocol Registry
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Active Course Enrollment</p>
                </div>
                <button 
                  onClick={() => setEditMode(true)}
                  className="text-[10px] font-black text-accent uppercase tracking-widest px-4 py-2.5 rounded-2xl bg-accent/5 border border-accent/20 hover:bg-accent/10 active:scale-95 transition-all shadow-sm"
                >
                  Edit Bundle
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {courses.map((course, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={course.id} 
                    whileHover={{ y: -4 }}
                    className="relative group cursor-pointer"
                  >
                    <div className="absolute inset-x-0 -bottom-2 h-12 bg-accent/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-5 rounded-[2rem] bg-background border border-border flex flex-col gap-3 shadow-sm hover:border-accent/40 hover:shadow-xl transition-all relative z-10 overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                           <span className="text-[10px] font-black text-foreground/40 group-hover:text-accent transition-colors">{course.code?.substring(0,2)}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-accent/30 group-hover:bg-accent animate-pulse" />
                      </div>
                      
                      <div>
                        <span className="text-sm font-black tracking-tighter block mb-0.5">{course.code}</span>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">{course.name}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {courses.length === 0 && (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-border rounded-[2rem] opacity-30 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                       <ShieldCheck className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Registry Empty</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: "home", icon: BookOpen, label: "Home" },
          { id: "analytics", icon: BarChart3, label: "Analytics" },
          { id: "profile", icon: User, label: "Profile" },
        ]}
      />

      <CourseManagementDialog
        isOpen={editMode}
        onClose={() => {
          setEditMode(false);
          // Refresh courses after edit
          window.location.reload(); 
        }}
        studentId={profile?.id}
        level={profile?.level}
        semester={profile?.semester}
        department={profile?.department}
        currentCourseIds={courses.map(c => c.id)}
      />

      <LogoutConfirmDialog 
        isOpen={isLogoutOpen} 
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default StudentDashboard;

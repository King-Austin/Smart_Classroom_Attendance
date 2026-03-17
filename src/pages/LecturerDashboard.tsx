import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Eye, UserPlus, LogOut, BookOpen, BarChart3, User,
  Users, Activity, ChevronRight, TrendingUp, Calendar, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { useLecturerData } from "@/hooks/useLecturerData";
import { calculatePercentage } from "@/lib/utils";
import { formatSessionDate } from "@/lib/date";
import { AttendancePinger } from "@/components/dashboard/AttendancePinger";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { PresenceLoader } from "@/components/PresenceLoader";

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { profile, loading: profileLoading } = useProfile();
  const { sessions, stats, loading: dataLoading } = useLecturerData(profile?.id);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if ((profileLoading || dataLoading) && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PresenceLoader message="Fetching Faculty Data..." />
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

      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-1">Faculty Portal</p>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Hi, {profile?.full_name?.split(' ')[0] || 'Lecturer'} 👋</h1>
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

      <AnimatePresence mode="wait">
        {activeTab === "home" && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 space-y-6 relative z-10"
          >
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Plus, label: "Create\nSession", color: "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950", action: () => navigate("/lecturer/create-session") },
                { icon: Eye, label: "Active\nFeed", color: "bg-accent/10 text-accent border border-accent/20", action: () => {} },
                { icon: UserPlus, label: "Manage\nStudents", color: "bg-card text-foreground border border-border", action: () => {} },
              ].map(({ icon: Icon, label, color, action }) => (
                <motion.button
                  key={label}
                  whileTap={{ scale: 0.95 }}
                  onClick={action}
                  className={`p-4 rounded-3xl flex flex-col items-center gap-2 ${color} shadow-sm backdrop-blur-md transition-all`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-center whitespace-pre-line leading-tight">{label}</span>
                </motion.button>
              ))}
            </div>

            {/* Performance Overview (New Visual Metrics) */}
            <div className="p-6 rounded-[2.5rem] bg-zinc-900 text-white border border-zinc-800 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Activity className="w-20 h-20 text-accent" />
               </div>
               <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1">Average Presence</p>
                      <h2 className="text-4xl font-bold font-heading">{stats.avgRate}%</h2>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Students</p>
                       <p className="text-xl font-bold">{stats.totalStudents}</p>
                    </div>
                  </div>
                  
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.avgRate}%` }}
                      className="h-full bg-accent shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    />
                  </div>
                  
                  <div className="flex justify-between gap-4">
                     <div className="flex-1 p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/30">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Courses</p>
                        <p className="text-lg font-bold font-heading">{stats.courseCount}</p>
                     </div>
                     <div className="flex-1 p-3 rounded-2xl bg-accent/10 border border-accent/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="w-3 h-3 text-accent" />
                          <p className="text-[9px] font-bold text-accent uppercase tracking-widest">Growth</p>
                        </div>
                        <p className="text-lg font-bold font-heading">+12%</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Recent Sessions */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 text-foreground/80">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  Recent Sessions
                </h2>
                <button className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline">View All</button>
              </div>

              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="p-10 text-center bg-card/30 backdrop-blur-md rounded-3xl border border-dashed border-border opacity-60">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Empty Ledger</p>
                    <Button variant="link" onClick={() => navigate("/lecturer/create-session")} className="text-accent text-[11px] font-bold uppercase mt-2">Initialize Session</Button>
                  </div>
                ) : (
                  sessions.slice(0, 5).map((session) => (
                    <motion.div
                      key={session.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/lecturer/session/${session.id}`)}
                      className="group p-4 rounded-[2rem] bg-card/40 backdrop-blur-xl border border-border shadow-sm cursor-pointer hover:border-accent/40 hover:bg-card/60 transition-all flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                         <span className="text-xs font-black text-foreground/40 group-hover:text-accent uppercase">{session.courses?.code?.substring(0,2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-bold truncate pr-2">{session.courses?.code || 'Course'}</p>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">{formatSessionDate(session.created_at)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-2 truncate font-medium">{session.topic || 'General Lecture'}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                  <div key={i} className="w-5 h-5 rounded-full border-2 border-background bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                     <User className="w-2.5 h-2.5 text-zinc-400" />
                                  </div>
                                ))}
                             </div>
                             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                                {session.present} Attended
                             </span>
                          </div>
                          <div className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter ${
                            calculatePercentage(session.present, session.total) >= 75 
                            ? "bg-accent/10 border-accent/20 text-accent" 
                            : "bg-warning/10 border-warning/20 text-warning"
                          }`}>
                            {calculatePercentage(session.present, session.total)}%
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="px-5 relative z-10"
          >
            <h2 className="text-xl font-bold font-heading mb-6 tracking-tight px-1">Detailed Analytics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[2.5rem] bg-card border border-border text-center shadow-lg">
                <p className="text-3xl font-bold text-accent font-heading">{stats.avgRate}%</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Avg. Attendance</p>
              </div>
              <div className="p-6 rounded-[2.5rem] bg-card border border-border text-center shadow-lg">
                <p className="text-3xl font-bold text-foreground font-heading">{sessions.length}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Total Sessions</p>
              </div>
              <div className="col-span-2 p-8 rounded-[2.5rem] bg-zinc-950 text-white border border-border text-center shadow-xl">
                 <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-6 h-6 text-accent" />
                 </div>
                 <h3 className="font-heading font-bold text-lg mb-2">Performance Summary</h3>
                 <p className="text-xs text-zinc-400 leading-relaxed px-4">
                   Your attendance consistency is in the <span className="text-accent font-bold">top 10%</span> of the Faculty. Students are highly engaged in your courses.
                 </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="px-5 relative z-10"
          >
            <h2 className="text-xl font-bold font-heading mb-6 tracking-tight px-1 text-foreground/80">Staff Information</h2>
            <div className="p-6 rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-border shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full" />
              
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-accent flex items-center justify-center border-4 border-card">
                     <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold font-heading mt-4">{profile?.full_name}</h3>
                <p className="text-xs font-bold text-accent uppercase tracking-widest mt-1 italic">{profile?.department}</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Staff ID", value: profile?.staff_id, icon: LogOut },
                  { label: "Faculty", value: profile?.faculty, icon: Users },
                  { label: "Level", value: profile?.level, icon: BarChart3 },
                  { label: "Courses", value: stats.courseCount, icon: BookOpen },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-background/40 border border-border/50 group hover:border-accent/30 transition-all">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                          <Icon className="w-4 h-4 text-zinc-500 group-hover:text-accent" />
                       </div>
                       <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
                    </div>
                    <span className="text-sm font-bold tracking-tight">{value}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => setIsLogoutOpen(true)}
                variant="destructive"
                className="w-full mt-8 h-14 rounded-2xl font-bold uppercase tracking-widest text-[11px]"
              >
                Terminate Session
              </Button>
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
      
      <AttendancePinger />
      
      <LogoutConfirmDialog 
        isOpen={isLogoutOpen} 
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default LecturerDashboard;

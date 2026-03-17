import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, LogOut, BookOpen, BarChart3, User,
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
import { SessionActionsDialog } from "@/components/lecturer/SessionActionsDialog";
import { Edit2 } from "lucide-react";

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  
  const { profile, loading: profileLoading } = useProfile();
  const { sessions, stats, loading: dataLoading } = useLecturerData(profile?.id);

  const activeSessions = sessions.filter(s => s.status === 'active');
  const recentSessions = sessions.filter(s => s.status !== 'active');

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
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/lecturer/create-session")}
                className="flex-1 p-5 rounded-[2rem] bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-between shadow-xl group transition-all"
              >
                <div className="flex flex-col items-start gap-1">
                   <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Protocol Launch</p>
                   <span className="text-sm font-bold uppercase tracking-tight">Create Session</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 dark:bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Plus className="w-6 h-6" />
                </div>
              </motion.button>
            </div>

            {/* Performance Overview - Advanced Glassmorphism */}
            <div className="relative group">
              <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity" />
              <div className="p-8 rounded-[3rem] bg-zinc-900/90 text-white border border-zinc-800 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
                 {/* Internal Glass Highlight */}
                 <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                 
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Activity className="w-32 h-32 text-accent" />
                 </div>
                 
                 <div className="relative z-10 flex flex-col gap-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-2 leading-none">Global Presence Metric</p>
                        <h2 className="text-5xl font-black font-heading tracking-tighter tabular-nums">{stats.avgRate}%</h2>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 leading-none">Network Reach</p>
                         <p className="text-2xl font-black tabular-nums">{stats.totalStudents}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="h-3 bg-zinc-800/50 rounded-full overflow-hidden border border-white/5 p-[2px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.avgRate}%` }}
                          className="h-full bg-accent shadow-[0_0_20px_rgba(16,185,129,0.8)] rounded-full" 
                        />
                      </div>
                      <div className="flex justify-between px-1">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Protocol Floor: 0%</span>
                        <span className="text-[8px] font-bold text-accent uppercase tracking-widest">Target: 100%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Active Nodes</p>
                          <p className="text-xl font-black font-heading tabular-nums">{stats.courseCount}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 backdrop-blur-md">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-3.5 h-3.5 text-accent" />
                            <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">Efficiency</p>
                          </div>
                          <p className="text-xl font-black font-heading tabular-nums">+12.4%</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Segmented Sessions: Active */}
            {activeSessions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                      <h2 className="text-[10px] font-black text-foreground uppercase tracking-[0.4em]">Live Verification Nodes</h2>
                   </div>
                   <span className="text-[10px] font-bold text-accent/60 uppercase tracking-widest tabular-nums">{activeSessions.length} Active</span>
                </div>
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="relative group">
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/lecturer/session/${session.id}`)}
                        className="p-6 rounded-[2.5rem] bg-card/60 backdrop-blur-2xl border border-border shadow-lg cursor-pointer hover:border-accent/40 group-hover:bg-card transition-all flex items-center gap-5"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 relative">
                           <Activity className="w-7 h-7 text-accent" />
                           <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-4 border-card" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-black tracking-tight mb-1 truncate pr-12">{session.courses?.code || 'Course'}</p>
                          <p className="text-xs text-muted-foreground mb-3 truncate font-bold opacity-70 italic">{session.topic || 'Monitoring Attendance'}</p>
                          <div className="flex items-center gap-3">
                             <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
                                <span className="text-[9px] text-accent font-black uppercase tracking-widest tabular-nums">
                                   {session.present} Pulse Detected
                                </span>
                             </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </motion.div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                          setIsActionsOpen(true);
                        }}
                        className="absolute top-6 right-14 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-accent hover:bg-accent/10 transition-all z-20"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Segmented Sessions: Recent Ledger (System Console Aesthetic) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Historical Archival Ledger</h2>
              </div>
              <div className="space-y-4">
                {recentSessions.length === 0 ? (
                  <div className="p-16 text-center bg-card/10 backdrop-blur-md rounded-[3rem] border border-dashed border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">End of Transmission</p>
                  </div>
                ) : (
                  recentSessions.slice(0, 8).map((session) => (
                    <div key={session.id} className="relative group">
                      <motion.div
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate(`/lecturer/session/${session.id}`)}
                        className="p-5 rounded-[2.5rem] bg-card/30 backdrop-blur-xl border border-border/50 shadow-sm cursor-pointer hover:border-accent/40 hover:bg-card/50 transition-all flex items-center gap-5"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-border flex items-center justify-center flex-shrink-0 group-hover:border-accent/30 transition-colors overflow-hidden">
                           <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                           <span className="text-[10px] font-black text-foreground/40 group-hover:text-accent transition-colors uppercase relative z-10">{session.courses?.code?.substring(0,2)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm font-black tracking-tight truncate pr-12">{session.courses?.code || 'Course'}</p>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 tabular-nums">{formatSessionDate(session.created_at)}</span>
                          </div>
                          
                          {/* Mini Performance Bar */}
                          <div className="flex items-center gap-3 mb-2">
                             <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-accent/60" 
                                  style={{ width: `${calculatePercentage(session.present, session.total)}%` }}
                                />
                             </div>
                             <span className="text-[10px] text-accent font-black tabular-nums">
                                {calculatePercentage(session.present, session.total)}%
                             </span>
                          </div>

                          <div className="flex items-center justify-between">
                             <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest tabular-nums">
                                {session.present} Enrolled / {session.total || '---'} Total
                             </span>
                          </div>
                        </div>
                      </motion.div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                          setIsActionsOpen(true);
                        }}
                        className="absolute top-5 right-5 p-3 rounded-2xl bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-400 hover:text-accent transition-all z-10 border border-transparent hover:border-border"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
            <h2 className="text-xl font-bold font-heading mb-6 tracking-tight px-1 text-foreground/80">Faculty Analytics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[2.5rem] bg-card border border-border text-center shadow-lg">
                <p className="text-3xl font-bold text-accent font-heading">{stats.avgRate}%</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Avg. Presence</p>
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
                    <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 border border-border flex items-center justify-center overflow-hidden">
                       {profile?.avatar_url ? (
                         <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <User className="w-10 h-10 text-muted-foreground" />
                       )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-accent flex items-center justify-center border-4 border-card shadow-lg">
                       <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold font-heading mt-4">{profile?.full_name}</h3>
                  <p className="text-xs font-bold text-accent uppercase tracking-widest mt-1">{profile?.department}</p>
               </div>

               <div className="space-y-3">
                  {[
                    { label: "Staff ID", value: profile?.staff_id, icon: User },
                    { label: "Faculty", value: profile?.faculty, icon: Users },
                    { label: "Level", value: profile?.level, icon: BarChart3 },
                    { label: "Unit", value: "Departmental Board", icon: BookOpen },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-background/40 border border-border/50 group hover:border-accent/30 transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                            <Icon className="w-4 h-4 text-zinc-500 group-hover:text-accent" />
                         </div>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
                      </div>
                      <span className="text-sm font-bold tracking-tight">{value}</span>
                    </div>
                  ))}
               </div>

               <Button 
                 onClick={() => setIsLogoutOpen(true)}
                 variant="ghost" 
                 className="w-full mt-8 h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-destructive/10 text-destructive border border-destructive/20 transition-colors"
               >
                 <LogOut className="w-3.5 h-3.5 mr-2" /> Log Out
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

      <SessionActionsDialog 
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        session={selectedSession}
        onUpdated={() => {
          // Data refreshes via hook realtime/on-demand
        }}
      />
    </div>
  );
};

export default LecturerDashboard;

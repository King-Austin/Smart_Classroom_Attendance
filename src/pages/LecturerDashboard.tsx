import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Eye, UserPlus, Bell, LogOut, BookOpen, BarChart3, User,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { useLecturerData } from "@/hooks/useLecturerData";
import { calculatePercentage } from "@/lib/utils";
import { formatSessionDate } from "@/lib/date";

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const { profile, loading: profileLoading } = useProfile();
  const { sessions, stats, loading: dataLoading } = useLecturerData(profile?.id);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if ((profileLoading || dataLoading) && !profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="safe-top" />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Hi, {profile?.full_name?.split(' ')[0] || 'Lecturer'} 👋</h1>
          <p className="text-xs text-muted-foreground">{profile?.department} · {profile?.faculty}</p>
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
          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Plus, label: "Create\nSession", color: "bg-primary text-primary-foreground", action: () => navigate("/lecturer/create-session") },
              { icon: Eye, label: "View\nLive", color: "bg-accent text-accent-foreground", action: () => {} },
              { icon: UserPlus, label: "Add\nStudent", color: "bg-card text-foreground border border-border", action: () => {} },
            ].map(({ icon: Icon, label, color, action }) => (
              <motion.button
                key={label}
                whileTap={{ scale: 0.95 }}
                onClick={action}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 ${color} shadow-sm`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[11px] font-semibold text-center whitespace-pre-line leading-tight">{label}</span>
              </motion.button>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <p className="text-lg font-bold">{stats.totalStudents}</p>
              <p className="text-[10px] text-muted-foreground">Enrolled Students</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <p className="text-lg font-bold">{stats.courseCount}</p>
              <p className="text-[10px] text-muted-foreground">Active Courses</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border text-center">
              <p className="text-lg font-bold text-accent">{stats.avgRate}%</p>
              <p className="text-[10px] text-muted-foreground">Avg. Attendance</p>
            </div>
          </div>

          {/* Recent Sessions */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 font-heading">Recent Sessions</h2>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="p-10 text-center bg-card rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground">No sessions created yet.</p>
                  <Button variant="link" onClick={() => navigate("/lecturer/create-session")} className="text-accent text-xs">Create your first session</Button>
                </div>
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <motion.div
                    key={session.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/lecturer/session/${session.id}`)}
                    className="p-4 rounded-xl bg-card border border-border shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">{session.courses?.code || 'Course'}</p>
                      <span className="text-xs text-muted-foreground">{formatSessionDate(session.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 truncate">{session.topic || 'No topic'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {session.present}/{session.total} present
                      </span>
                      <span className={`text-xs font-bold ${calculatePercentage(session.present, session.total) >= 75 ? "text-accent" : "text-warning"}`}>
                        {calculatePercentage(session.present, session.total)}%
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "analytics" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5">
          <h2 className="text-lg font-bold font-heading mb-4">Analytics</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-accent">{stats.avgRate}%</p>
              <p className="text-xs text-muted-foreground">Avg. Attendance</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">Sessions Created</p>
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
              ["Staff ID", profile?.staff_id],
              ["Faculty", profile?.faculty],
              ["Department", profile?.department],
              ["Managed Courses", stats.courseCount.toString()],
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

export default LecturerDashboard;

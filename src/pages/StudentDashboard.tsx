import { useState } from "react";
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

// Mock data for UI
const COURSES = [
  { id: "1", name: "CSC 301 - Data Structures", attendance: 85, total: 20, attended: 17 },
  { id: "2", name: "CSC 305 - Operating Systems", attendance: 72, total: 18, attended: 13 },
  { id: "3", name: "CSC 311 - Algorithms", attendance: 60, total: 15, attended: 9 },
];

const LIVE_SESSIONS = [
  { id: "s1", course: "CSC 301 - Data Structures", lecturer: "Dr. Adeyemi", topic: "Binary Trees", startTime: "10:00 AM" },
];

const HISTORY = [
  { course: "CSC 301", date: "Today", status: "present" as const },
  { course: "CSC 305", date: "Today", status: "absent" as const },
  { course: "CSC 311", date: "Yesterday", status: "present" as const },
  { course: "CSC 301", date: "Yesterday", status: "present" as const },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

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
          <h1 className="text-xl font-bold font-heading">Hi, Student 👋</h1>
          <p className="text-xs text-muted-foreground">CSC · 300 Level · 1st Semester</p>
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
          {LIVE_SESSIONS.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Live Sessions
              </h2>
              {LIVE_SESSIONS.map((session) => (
                <motion.div
                  key={session.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/student/verify/${session.id}`)}
                  className="p-4 rounded-xl bg-card border border-accent/30 shadow-sm cursor-pointer"
                  style={{ boxShadow: "0 0 0 1px hsl(var(--accent) / 0.15), var(--shadow-card)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{session.course}</p>
                      <p className="text-xs text-muted-foreground">{session.lecturer} · {session.topic}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent/10 text-accent uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Started {session.startTime}
                    </span>
                    <Button size="sm" className="h-8 rounded-lg bg-accent text-accent-foreground text-xs font-semibold">
                      Mark Attendance <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Course Attendance */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Course Attendance</h2>
            <div className="space-y-3">
              {COURSES.map((course) => (
                <div key={course.id} className="p-4 rounded-xl bg-card border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{course.name}</p>
                    <span className={`text-xs font-bold ${course.attendance < 75 ? "text-destructive" : "text-accent"}`}>
                      {course.attendance}%
                    </span>
                  </div>
                  <Progress value={course.attendance} className="h-1.5 rounded-full" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">{course.attended}/{course.total} lectures</span>
                    {course.attendance < 75 && (
                      <span className="text-[10px] text-destructive flex items-center gap-0.5 font-medium">
                        <AlertTriangle className="w-3 h-3" /> At Risk
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent History */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Recent History</h2>
            <div className="space-y-2">
              {HISTORY.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  {item.status === "present" ? (
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.course}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <span className={`text-xs font-medium ${item.status === "present" ? "text-accent" : "text-destructive"}`}>
                    {item.status === "present" ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "analytics" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5">
          <h2 className="text-lg font-bold font-heading mb-4">Analytics</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-accent">72%</p>
              <p className="text-xs text-muted-foreground">Overall Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-foreground">39</p>
              <p className="text-xs text-muted-foreground">Total Classes</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-accent">28</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-2xl font-bold text-destructive">11</p>
              <p className="text-xs text-muted-foreground">Absent</p>
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
              ["Name", "John Doe"],
              ["Reg Number", "REG/2024/001"],
              ["Level", "300"],
              ["Faculty", "Engineering"],
              ["Department", "Computer Science"],
              ["Face Status", "✓ Enrolled"],
              ["Device Binding", "✓ Active"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
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

import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Users, CheckCircle2, XCircle, AlertTriangle, UserPlus,
  Download, StopCircle, Wifi, Plus, User, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const LiveSession = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [manualReg, setManualReg] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalEnrolled, setTotalEnrolled] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase
        .from("attendance_sessions")
        .select("*, courses(name, code), lecturer:profiles!lecturer_id(full_name)")
        .eq("id", sessionId)
        .single();
      
      if (sessionData) setSession(sessionData);

      const { data: records } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("session_id", sessionId)
        .order('created_at', { ascending: false });
      
      if (records) {
        const studentIds = records.map(r => r.student_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, reg_number")
          .in("id", studentIds);

        const profileMap = Object.fromEntries(profiles?.map(p => [p.id, p]) || []);

        setStudents(records.map(r => ({
          id: r.id,
          name: profileMap[r.student_id]?.full_name || "Unknown Student",
          regNumber: profileMap[r.student_id]?.reg_number || "REG/None",
          status: r.status,
          faceScore: r.face_score,
          time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          method: r.is_manual ? "manual" : "auto"
        })));
      }

      if (sessionData) {
        const { count } = await supabase
          .from("enrollments")
          .select("*", { count: 'exact', head: true })
          .eq("course_id", sessionData.course_id);
        setTotalEnrolled(count || 0);
      }

      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel(`attendance-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance_records",
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, reg_number")
            .eq("id", payload.new.student_id)
            .single();

          const newStudent = {
            id: payload.new.id,
            name: profile?.full_name || "Unknown Student",
            regNumber: profile?.reg_number || "REG/None",
            status: payload.new.status,
            faceScore: payload.new.face_score,
            time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            method: payload.new.is_manual ? "manual" : "auto"
          };
          
          setStudents((prev) => [newStudent, ...prev]);
          toast.success(`Check-in: ${newStudent.name}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const presentCount = students.filter((s) => s.status === "verified" || s.status === "present").length;
  const absentCount = Math.max(0, totalEnrolled - presentCount);
  const presentRate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  const handleSearchStudent = async () => {
    if (!manualReg.trim()) return;
    setSearching(true);
    setFoundStudent(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, reg_number, department")
        .eq("reg_number", manualReg.toUpperCase())
        .single();
      
      if (error) throw new Error("Student not found");
      setFoundStudent(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleManualAdd = async () => {
    if (!foundStudent) return;
    try {
      const alreadyPresent = students.find(s => s.regNumber === foundStudent.reg_number);
      if (alreadyPresent) {
        toast.error("Student already marked present");
        return;
      }

      const { error } = await supabase.from("attendance_records").insert({
        session_id: sessionId,
        student_id: foundStudent.id,
        status: "verified",
        face_score: 1.0,
        is_manual: true
      });

      if (error) throw error;
      setFoundStudent(null);
      setManualReg("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEndSession = async () => {
    await supabase
      .from("attendance_sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", sessionId);
    
    toast.success("Session ended.");
    navigate("/lecturer");
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
         <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-accent/30 selection:text-white pb-10">
      <div className="safe-top" />
      
      {/* Background Accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/lecturer")} className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900/50 border border-zinc-800">
             <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#10b981]" />
             <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Live</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 max-w-sm mx-auto"
        >
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-xl font-bold font-heading tracking-tight mb-0.5 text-white">
              {session?.courses?.code}: {session?.courses?.name}
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
              {session?.lecturer?.full_name} · {new Date(session?.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* BLE/Token Card - More Compact */}
          <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm flex items-center gap-3 mb-5 group transition-all hover:bg-zinc-900 hover:border-zinc-700">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-accent">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Proximity ID</p>
              <p className="text-xs font-mono text-white tracking-widest uppercase">{session?.ble_token}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[9px] text-accent font-bold animate-pulse">Broadcasting</p>
            </div>
          </div>

          {/* Stats Grid - Cleaner 2-column layout */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Enrolled", value: totalEnrolled, color: "text-zinc-400", bg: "bg-zinc-900/30", sub: "Students" },
              { label: "Present", value: presentCount, color: "text-[#10b981]", bg: "bg-[#10b981]/5 border-[#10b981]/20", accent: "h-1 bg-[#10b981]/20", sub: `${presentRate}% Rate` },
            ].map((stat, i) => (
              <div key={i} className={`p-4 rounded-2xl border border-zinc-800/80 ${stat.bg} shadow-lg relative overflow-hidden`}>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className={`text-xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
                  <span className="text-[9px] text-zinc-600 font-bold uppercase">{stat.sub}</span>
                </div>
                {stat.accent && <div className={`absolute bottom-0 left-0 right-0 ${stat.accent}`} />}
              </div>
            ))}
          </div>

          {/* Realtime Attendance Status Chart Area - Refined for Mobile */}
          <div className="p-5 rounded-3xl bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-md mb-6 flex items-center justify-between shadow-xl">
            <div className="relative w-16 h-16 flex-shrink-0">
               <svg className="w-full h-full -rotate-90">
                 <circle cx="32" cy="32" r="28" stroke="#18181b" strokeWidth="5" fill="transparent" />
                 <motion.circle 
                   cx="32" cy="32" r="28" stroke="#10b981" strokeWidth="5" 
                   strokeDasharray="175.9"
                   initial={{ strokeDashoffset: 175.9 }}
                   animate={{ strokeDashoffset: 175.9 - (175.9 * (presentRate/100)) }}
                   strokeLinecap="round" fill="transparent" 
                 />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{presentRate}%</span>
               </div>
            </div>
            <div className="flex-1 ml-5">
              <h3 className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Live Engagement</h3>
              <div className="flex items-center gap-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    <span className="text-[10px] text-zinc-300 font-bold">Present</span>
                  </div>
                  <p className="text-sm font-bold text-white leading-none">{presentCount}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 border border-zinc-700" />
                    <span className="text-[10px] text-zinc-500 font-bold">Pending</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-400 leading-none">{absentCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Feed Title */}
          <div className="flex items-center justify-between mb-3 px-1">
             <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Real-time Feed</h3>
             <div className="flex items-center gap-1.5">
               <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
               <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">Syncing...</span>
             </div>
          </div>

          {/* Manual Entry - Compact */}
          <div className="space-y-2 mb-6">
            <div className="flex gap-2 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800 shadow-inner focus-within:border-accent/40 transition-all">
              <Input
                value={manualReg}
                onChange={(e) => setManualReg(e.target.value)}
                placeholder="Reg Number..."
                className="h-9 bg-transparent border-none text-zinc-100 text-xs focus-visible:ring-0 placeholder:text-zinc-600 flex-1"
              />
              <Button 
                onClick={handleSearchStudent} 
                disabled={searching} 
                className="h-9 px-4 rounded-lg bg-accent hover:bg-accent/90 text-black font-bold text-[10px] uppercase"
              >
                {searching ? "..." : "Search"}
              </Button>
            </div>

            {foundStudent && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl bg-accent/5 border border-accent/20 flex items-center gap-3"
              >
                 <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <UserPlus className="w-4 h-4" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{foundStudent.full_name}</p>
                    <p className="text-[9px] text-zinc-500 font-medium">{foundStudent.reg_number}</p>
                 </div>
                 <Button onClick={handleManualAdd} size="sm" className="h-7 rounded-lg bg-accent text-black font-bold text-[9px] uppercase">
                   Add
                 </Button>
              </motion.div>
            )}
          </div>

          {/* Student List - Enhanced Density */}
          <div className="space-y-2 mb-8">
            {students.length === 0 ? (
               <div className="py-8 text-center rounded-2xl border border-dashed border-zinc-800/60 bg-zinc-900/20">
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Monitoring Feed</p>
               </div>
            ) : (
              students.map((student) => (
                <motion.div 
                   key={student.id} 
                   layout
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 group relative overflow-hidden active:scale-[0.99] transition-all"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
                    student.status === "verified" ? "bg-[#10b981]" : "bg-zinc-700"
                  }`} />

                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                     <User className="w-5 h-5 text-zinc-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate group-hover:text-accent transition-colors">{student.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[9px] text-zinc-500 font-mono tracking-tight">{student.regNumber}</p>
                      <span className="w-0.5 h-0.5 rounded-full bg-zinc-800" />
                      <p className="text-[9px] text-zinc-500 font-medium">{student.time}</p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                      student.status === "verified" ? "bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                    }`}>
                       <span className={`w-1 h-1 rounded-full ${student.status === "verified" ? "bg-[#10b981]" : "bg-zinc-700"}`} />
                       <span className="text-[8px] font-bold uppercase tracking-tighter">
                          {student.status === "verified" ? "Present" : "Checking"}
                       </span>
                    </div>
                    {student.method === "manual" && (
                      <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest px-1">Manual</span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Floating Actions - Mobile Optimized */}
          <div className="flex gap-3 sticky bottom-4">
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-500 font-bold hover:bg-zinc-800 hover:text-white transition-all text-[11px] uppercase tracking-wider"
              onClick={() => toast.info("Export system ready.")}
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button
              onClick={handleEndSession}
              className="h-12 flex-1 rounded-xl bg-red-600/10 border border-red-600/20 text-red-500 font-bold hover:bg-red-600 hover:text-white transition-all text-[11px] uppercase tracking-wider shadow-[0_4px_20px_rgba(239,68,68,0.15)]"
            >
              <StopCircle className="w-4 h-4 mr-2" /> End
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveSession;

import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Search, Filter, Download, User, CheckCircle2, 
  XCircle, Clock, Calendar, BookOpen, UserCheck, ShieldCheck, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatTime, formatDate } from "@/lib/date";
import { ATTENDANCE_STATUS } from "@/constants";
import { PresenceLoader } from "@/components/PresenceLoader";
import { SessionActionsDialog } from "@/components/lecturer/SessionActionsDialog";
import { Edit2 } from "lucide-react";

const AttendanceLedger = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  useEffect(() => {
    const fetchLedgerData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Session Details
        const { data: sessionData, error: sessionError } = await supabase
          .from("attendance_sessions")
          .select("*, courses(name, code), profiles!lecturer_id(full_name)")
          .eq("id", sessionId)
          .single();
        
        if (sessionError) throw sessionError;
        setSession(sessionData);

        // 2. Fetch Attendance Records with attendee profiles
        const { data: records, error: recordsError } = await supabase
          .from("attendance_records")
          .select("id, created_at, student_id")
          .eq("session_id", sessionId)
          .eq("status", "verified")
          .order("created_at", { ascending: true });

        if (recordsError) throw recordsError;

        if (records && records.length > 0) {
          const studentIds = records.map(r => r.student_id);
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, reg_number")
            .in("id", studentIds);

          if (profileError) throw profileError;

          const profileMap = Object.fromEntries(profiles?.map(p => [p.id, p]) || []);

          setStudents(records.map((r, index) => ({
            index: index + 1,
            name: profileMap[r.student_id]?.full_name || "Unknown Student",
            regNumber: profileMap[r.student_id]?.reg_number || "REG/None",
            time: formatTime(r.created_at)
          })));
        }
      } catch (error: any) {
        toast.error("Error loading ledger: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLedgerData();
  }, [sessionId, isActionsOpen]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="safe-top" />
      
      {/* Premium Background Accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="px-5 py-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20">
             <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Attendance Ledger</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 max-w-2xl mx-auto"
        >
          {/* Session Info Card */}
          <div className="p-6 rounded-3xl bg-card border border-border backdrop-blur-md mb-8 shadow-2xl">
            <h1 className="text-2xl font-bold font-heading tracking-tight mb-2">
              {session?.courses?.code}: {session?.courses?.name}
            </h1>
            <div className="flex flex-wrap gap-4 items-center text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {session?.profiles?.full_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {session?.started_at && formatDate(session.started_at)}
              </span>
              <span className="flex items-center gap-1.5 text-accent font-bold">
                <UserCheck className="w-3.5 h-3.5" /> {students.length} Present
              </span>
            </div>
            
            <Button 
               onClick={() => setIsActionsOpen(true)}
               variant="outline" 
               className="w-full mt-6 h-12 rounded-2xl border-dashed border-accent/30 bg-accent/5 text-accent font-bold uppercase tracking-widest text-[10px] hover:bg-accent/10"
            >
               <Edit2 className="w-4 h-4 mr-2" /> Manage Session
            </Button>
          </div>

          {/* Search Header */}
          <div className="flex items-center justify-between mb-4 px-1">
             <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Attendees</h3>
             <div className="relative flex-1 max-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="h-9 pl-9 bg-zinc-900/50 border-zinc-800/50 text-xs rounded-xl focus-visible:ring-accent/30"
                />
             </div>
          </div>

          {/* Ledger List */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-20 flex justify-center">
                <PresenceLoader message="Decrypting Ledger..." />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20">
                 <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">No matching records</p>
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden border border-zinc-800/50 shadow-2xl">
                {filteredStudents.map((student) => (
                  <motion.div 
                    key={student.index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 p-4 border-b border-zinc-800/50 bg-zinc-900/30 last:border-0 group active:bg-zinc-900/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-[10px] font-bold text-zinc-500 group-hover:text-accent group-hover:border-accent/40 transition-all">
                      {student.index}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{student.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5 tracking-tight">{student.regNumber}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="px-2 py-0.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/20">
                         <span className="text-[9px] font-bold text-[#10b981] uppercase tracking-tighter">Present</span>
                      </div>
                      <p className="text-[9px] text-zinc-600 font-medium">{student.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {!loading && students.length > 0 && (
            <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-8 pb-4">
              End of Ledger
            </p>
          )}
        </motion.div>
      </div>
      
      {session && (
        <SessionActionsDialog 
          isOpen={isActionsOpen}
          onClose={() => setIsActionsOpen(false)}
          session={session}
          onUpdated={() => {
            // refresh happens via useEffect dependency or manual call
          }}
        />
      )}
    </div>
  );
};

export default AttendanceLedger;

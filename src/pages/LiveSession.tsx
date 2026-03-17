import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, StopCircle, Wifi, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useSessionData } from "@/hooks/useSessionData";
import { calculatePercentage } from "@/lib/utils";
import { PresenceLoader } from "@/components/PresenceLoader";
import { formatSessionDate } from "@/lib/date";
import { getAttendanceMethod } from "@/lib/attendance";
import { SESSION_STATUS, ATTENDANCE_STATUS } from "@/constants";

// Sub-components
import { SessionHeader } from "@/components/live-session/SessionHeader";
import { SessionStats } from "@/components/live-session/SessionStats";
import { ManualEntry } from "@/components/live-session/ManualEntry";
import { AttendanceFeed } from "@/components/live-session/AttendanceFeed";
import { EngagementChart } from "@/components/live-session/EngagementChart";

const LiveSession = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { session, records, totalEnrolled, loading, refresh } = useSessionData(sessionId);
  const [searching, setSearching] = useState(false);

  const presentCount = records.filter(
    (r) => r.status === ATTENDANCE_STATUS.VERIFIED || r.status === "present"
  ).length;
  const absentCount = Math.max(0, totalEnrolled - presentCount);
  const presentRate = calculatePercentage(presentCount, totalEnrolled);

  const handleEndSession = async () => {
    try {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({ status: SESSION_STATUS.ENDED, ended_at: new Date().toISOString() })
        .eq("id", sessionId);
      
      if (error) throw error;
      toast.success("Session ended.");
      navigate("/lecturer");
    } catch (err: any) {
      toast.error("Failed to end session: " + err.message);
    }
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PresenceLoader message="Synchronizing Live Feed..." />
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
          <SessionHeader session={session} />

          {/* BLE/Token Card */}
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

          <SessionStats 
            totalEnrolled={totalEnrolled} 
            presentCount={presentCount} 
            presentRate={presentRate} 
          />

          <EngagementChart 
            presentRate={presentRate} 
            presentCount={presentCount} 
            absentCount={absentCount} 
          />

          <ManualEntry sessionId={sessionId} onAdded={refresh} existingRecords={records} />

          <AttendanceFeed records={records} />

          {/* Floating Actions */}
          <div className="flex gap-3 sticky bottom-4 mt-8">
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

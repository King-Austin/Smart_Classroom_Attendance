import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, StopCircle, Wifi, Clock, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useSessionData } from "@/hooks/useSessionData";
import { calculatePercentage } from "@/lib/utils";
import { PresenceLoader } from "@/components/PresenceLoader";
import { SESSION_STATUS, ATTENDANCE_STATUS } from "@/constants";
import { calculateDuration } from "@/lib/date";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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

  const isEnded = session?.status === SESSION_STATUS.ENDED;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 pb-20">
      <div className="safe-top" />
      
      {/* Background Accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary/5 blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10 px-4 max-w-sm mx-auto">
        <div className="py-4 flex items-center justify-between mb-4">
          <button onClick={() => navigate("/lecturer")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-[10px] font-black uppercase tracking-widest group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Dashboard
          </button>
          
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm ${
            isEnded ? "bg-muted border-border text-muted-foreground" : "bg-accent/10 border-accent/20 text-accent"
          }`}>
             <span className={`w-1.5 h-1.5 rounded-full ${isEnded ? "bg-muted-foreground/30" : "bg-accent animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
             <span className="text-[9px] font-black uppercase tracking-widest">
               {isEnded ? "Session Ended" : "Live Monitoring"}
             </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SessionHeader session={session} />

          {/* Proximity/Summary Card */}
          {!isEnded ? (
            <div className="p-4 rounded-[2rem] bg-card border border-border shadow-sm flex items-center gap-4 mb-6 group transition-all hover:border-accent/30">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Wifi className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-0.5">Proximity ID</p>
                <p className="text-sm font-mono font-bold tracking-[0.3em] uppercase text-foreground">{session?.ble_token}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-accent font-black tracking-widest animate-pulse">Broadcasting</p>
              </div>
            </div>
          ) : (
             <div className="p-6 rounded-[2.5rem] bg-zinc-950 text-white dark:bg-card dark:text-foreground border border-border shadow-xl mb-7 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Clock className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-4">Final Ledger Summary</p>
                   <div className="flex gap-8">
                      <div>
                         <p className="text-2xl font-black font-heading tracking-tight">
                           {session?.started_at && session?.ended_at ? calculateDuration(session.started_at, session.ended_at) : "---"}
                         </p>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Duration</p>
                      </div>
                      <div className="w-px h-12 bg-border/20" />
                      <div>
                         <p className="text-2xl font-black font-heading tracking-tight text-accent">{records.length}</p>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Verified</p>
                      </div>
                   </div>
                   <div className="mt-6 pt-6 border-t border-border/10 flex items-center justify-between">
                      <Button 
                        onClick={() => navigate(`/lecturer/ledger/${sessionId}`)}
                        variant="link" 
                        className="text-accent text-[11px] font-black uppercase tracking-widest p-0 h-auto hover:opacity-80"
                      >
                        View Full Ledger <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                      <span className="px-2 py-0.5 rounded-md bg-muted text-[8px] font-black uppercase tracking-widest text-muted-foreground">Archived</span>
                   </div>
                </div>
             </div>
          )}

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

          {!isEnded && (
            <ManualEntry sessionId={sessionId} onAdded={refresh} existingRecords={records} />
          )}

          <AttendanceFeed records={records} isEnded={isEnded} />

          {/* Action Bar */}
          <div className="flex gap-3 sticky bottom-6 mt-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-14 flex-1 rounded-[1.5rem] bg-card border border-border text-foreground font-black hover:bg-muted transition-all text-[11px] uppercase tracking-[0.2em] shadow-lg"
                >
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl w-48 p-2 border border-border bg-popover/80 backdrop-blur-xl shadow-2xl z-[100]">
                 <DropdownMenuItem className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => toast.info("PDF generation active soon!")}>
                    Export as PDF (Soon)
                 </DropdownMenuItem>
                 <DropdownMenuItem className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => toast.info("Email relay active soon!")}>
                    Email Report (Soon)
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!isEnded && (
              <Button
                onClick={handleEndSession}
                className="h-14 flex-1 rounded-[1.5rem] bg-destructive text-destructive-foreground font-black hover:bg-destructive/90 transition-all text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-destructive/10"
              >
                <StopCircle className="w-4 h-4 mr-2" /> End Session
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveSession;

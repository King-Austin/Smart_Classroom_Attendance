import { motion } from "framer-motion";
import { Clock, ChevronRight, Users, Calendar, Timer, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionWithDetails } from "@/types";
import { formatTime } from "@/lib/date";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface LiveSessionCardProps {
  session: SessionWithDetails;
}

export const LiveSessionCard = ({ session }: LiveSessionCardProps) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(session.started_at).getTime();
      const end = start + 30 * 60 * 1000;
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [session.started_at]);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="p-4 rounded-xl bg-card border border-accent/20 shadow-sm mb-3 relative overflow-hidden"
    >
      {session.has_marked && (
        <div className="absolute top-0 right-0 p-1 bg-accent/20 rounded-bl-lg">
           <CheckCircle2 className="w-3 h-3 text-accent" />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{session.courses?.code} - {session.courses?.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{session.lecturer?.full_name} · {session.topic}</p>
        </div>
        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${timeLeft === "Ended" ? "bg-zinc-800 text-zinc-500" : "bg-accent/10 text-accent animate-pulse"}`}>
          {timeLeft === "Ended" ? "Expired" : "Live"}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-3 py-2 border-y border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden">
            {session.attendance_records?.slice(0, 3).map((record, i) => (
              <div 
                key={i}
                className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700"
              >
                {record.profiles?.avatar_url ? (
                  <img src={record.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[8px] font-bold text-zinc-500">
                    {record.profiles?.full_name?.charAt(0)}
                  </span>
                )}
              </div>
            ))}
            {(session.attendee_count || 0) > 3 && (
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <span className="text-[8px] font-bold text-accent">+{ (session.attendee_count || 0) - 3 }</span>
              </div>
            )}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">Nearby</span>
        </div>
        
        <div className="flex items-center gap-1.5 ml-auto">
          <Timer className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] font-mono font-bold text-accent">{timeLeft}</span>
        </div>
      </div>

      <div className="w-full mt-3">
        <Button 
          disabled={session.has_marked || timeLeft === "Ended"}
          onClick={() => navigate(`/student/verify/${session.id}`)}
          className={`h-9 rounded-xl text-xs font-bold w-full transition-all duration-300 ${
            session.has_marked 
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
              : "bg-accent text-accent-foreground"
          }`}
        >
          {session.has_marked ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Marked Present
            </span>
          ) : timeLeft === "Ended" ? (
            "Session Expired"
          ) : (
            <span className="flex items-center gap-1">
              Mark Attendance <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

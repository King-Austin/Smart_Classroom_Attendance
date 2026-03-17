import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionWithDetails } from "@/types";
import { formatTime } from "@/lib/date";
import { useNavigate } from "react-router-dom";

interface LiveSessionCardProps {
  session: SessionWithDetails;
}

export const LiveSessionCard = ({ session }: LiveSessionCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="p-4 rounded-xl bg-card border border-accent/20 shadow-sm mb-3"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-sm">{session.courses?.code} - {session.courses?.name}</p>
          <p className="text-xs text-muted-foreground">{session.lecturer?.full_name} · {session.topic}</p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent/10 text-accent uppercase tracking-wider">
          Live
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3" /> Started {formatTime(session.started_at)}
        </span>
      </div>
      <div className="flex flex-col gap-2 w-full mt-4">
        <Button 
          onClick={() => navigate(`/student/verify/${session.id}`)}
          className="h-9 rounded-xl bg-accent text-accent-foreground text-xs font-bold w-full"
        >
          Mark Attendance <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate(`/ledger/${session.id}`)}
          className="h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider w-full"
        >
          View Ledger
        </Button>
      </div>
    </motion.div>
  );
};

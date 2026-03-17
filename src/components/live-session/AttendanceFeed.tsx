import { motion } from "framer-motion";
import { User } from "lucide-react";
import { formatTime } from "@/lib/date";
import { AttendanceRecordWithProfile } from "@/types";
import { ATTENDANCE_STATUS } from "@/constants";

interface AttendanceFeedProps {
  records: AttendanceRecordWithProfile[];
  isEnded?: boolean;
}

export const AttendanceFeed = ({ records, isEnded }: AttendanceFeedProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-1">
         <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">
           {isEnded ? "Final Attendance Journal" : "Real-time Feed"}
         </h3>
         <div className="flex items-center gap-2">
           {!isEnded ? (
             <>
               <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
               <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-50">Live Sync</span>
             </>
           ) : (
             <>
               <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
               <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-50">Logged</span>
             </>
           )}
         </div>
      </div>

      <div className="space-y-2 mb-8">
        {records.length === 0 ? (
           <div className="py-12 text-center rounded-[2.5rem] border border-dashed border-border bg-card/10 backdrop-blur-sm shadow-inner">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">Awaiting Signal...</p>
           </div>
        ) : (
          records.map((record) => (
            <motion.div 
               key={record.id} 
               layout
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-card border border-border shadow-sm group relative overflow-hidden active:scale-[0.98] transition-all hover:border-accent/30"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                record.status === ATTENDANCE_STATUS.VERIFIED ? "bg-accent" : "bg-muted"
              }`} />

              <div className="w-10 h-10 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                 {record.profiles?.avatar_url ? (
                   <img src={record.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <User className="w-5 h-5 text-muted-foreground" />
                 )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                  {record.profiles?.full_name || "Unknown Student"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase opacity-60">
                    {record.profiles?.reg_number || "REG/None"}
                  </p>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <p className="text-[10px] text-muted-foreground font-bold italic opacity-40">{formatTime(record.created_at)}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                  record.status === ATTENDANCE_STATUS.VERIFIED ? "bg-accent/10 border-accent/20 text-accent font-black shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "bg-muted border-border text-muted-foreground"
                }`}>
                   <span className="text-[8px] font-black uppercase tracking-tighter">
                      {record.status === ATTENDANCE_STATUS.VERIFIED ? "Verified" : "Pending"}
                   </span>
                </div>
                {record.is_manual && (
                  <span className="text-[8px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] px-1">Override</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

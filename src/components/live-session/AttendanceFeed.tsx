import { motion } from "framer-motion";
import { User } from "lucide-react";
import { formatTime } from "@/lib/date";
import { AttendanceRecordWithProfile } from "@/types";
import { ATTENDANCE_STATUS } from "@/constants";

interface AttendanceFeedProps {
  records: AttendanceRecordWithProfile[];
}

export const AttendanceFeed = ({ records }: AttendanceFeedProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3 px-1">
         <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Real-time Feed</h3>
         <div className="flex items-center gap-1.5">
           <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
           <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">Syncing...</span>
         </div>
      </div>

      <div className="space-y-2 mb-8">
        {records.length === 0 ? (
           <div className="py-8 text-center rounded-2xl border border-dashed border-zinc-800/60 bg-zinc-900/20">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Monitoring Feed</p>
           </div>
        ) : (
          records.map((record) => (
            <motion.div 
               key={record.id} 
               layout
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 group relative overflow-hidden active:scale-[0.99] transition-all"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
                record.status === ATTENDANCE_STATUS.VERIFIED ? "bg-[#10b981]" : "bg-zinc-700"
              }`} />

              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                 <User className="w-5 h-5 text-zinc-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white truncate group-hover:text-accent transition-colors">
                  {record.profiles?.full_name || "Unknown Student"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[9px] text-zinc-500 font-mono tracking-tight">{record.profiles?.reg_number || "REG/None"}</p>
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-800" />
                  <p className="text-[9px] text-zinc-500 font-medium">{formatTime(record.created_at)}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5">
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                  record.status === ATTENDANCE_STATUS.VERIFIED ? "bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                }`}>
                   <span className={`w-1 h-1 rounded-full ${record.status === ATTENDANCE_STATUS.VERIFIED ? "bg-[#10b981]" : "bg-zinc-700"}`} />
                   <span className="text-[8px] font-bold uppercase tracking-tighter">
                      {record.status === ATTENDANCE_STATUS.VERIFIED ? "Present" : "Checking"}
                   </span>
                </div>
                {record.is_manual && (
                  <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest px-1">Manual</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

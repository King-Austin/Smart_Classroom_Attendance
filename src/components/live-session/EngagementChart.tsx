import { motion } from "framer-motion";

interface EngagementChartProps {
  presentRate: number;
  presentCount: number;
  absentCount: number;
}

export const EngagementChart = ({ presentRate, presentCount, absentCount }: EngagementChartProps) => {
  return (
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
  );
};

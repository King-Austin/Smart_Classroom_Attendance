import { motion } from "framer-motion";

interface EngagementChartProps {
  presentRate: number;
  presentCount: number;
  absentCount: number;
}

export const EngagementChart = ({ presentRate, presentCount, absentCount }: EngagementChartProps) => {
  return (
    <div className="p-6 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl mb-6 flex items-center justify-between shadow-sm">
      <div className="relative w-20 h-20 flex-shrink-0">
         <svg className="w-full h-full -rotate-90">
           <circle cx="40" cy="40" r="34" stroke="currentColor" className="text-muted/10" strokeWidth="6" fill="transparent" />
           <motion.circle 
             cx="40" cy="40" r="34" stroke="currentColor" className="text-accent" strokeWidth="6" 
             strokeDasharray="213.6"
             initial={{ strokeDashoffset: 213.6 }}
             animate={{ strokeDashoffset: 213.6 - (213.6 * (presentRate/100)) }}
             strokeLinecap="round" fill="transparent" 
           />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-black text-foreground">{presentRate}%</span>
         </div>
      </div>
      <div className="flex-1 ml-6">
        <h3 className="text-[10px] font-black text-muted-foreground mb-3 uppercase tracking-[0.2em] opacity-80">Live Engagement</h3>
        <div className="flex items-center gap-8">
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-accent">
              <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black uppercase">Present</span>
            </div>
            <p className="text-lg font-black text-foreground leading-none">{presentCount}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-muted/20 border border-border" />
              <span className="text-[9px] font-black uppercase tracking-tight">Pending</span>
            </div>
            <p className="text-lg font-black text-muted-foreground/60 leading-none">{absentCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

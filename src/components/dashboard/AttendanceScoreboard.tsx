import { motion } from "framer-motion";
import { Award, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";

interface AttendanceScoreboardProps {
  progress: number;
  attended: number;
  total: number;
  loading?: boolean;
}

export const AttendanceScoreboard = ({ progress, attended, total, loading }: AttendanceScoreboardProps) => {
  if (loading) {
    return (
      <div className="h-48 w-full rounded-3xl bg-zinc-900/50 animate-pulse border border-zinc-800" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-6 mb-8"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl rounded-full -mr-16 -mt-16" />
      
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Progress Circle */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="#18181b"
              strokeWidth="10"
              fill="transparent"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="58"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray="364.4"
              initial={{ strokeDashoffset: 364.4 }}
              animate={{ strokeDashoffset: 364.4 - (364.4 * (progress / 100)) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-heading">{progress}%</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Score</span>
          </div>
        </div>

        {/* Stats Content */}
        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
          <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attended</span>
            </div>
            <p className="text-xl font-bold font-heading">{attended}</p>
            <p className="text-[10px] text-zinc-600">Sessions confirmed</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</span>
            </div>
            <p className="text-xl font-bold font-heading">{total}</p>
            <p className="text-[10px] text-zinc-600">Active sessions</p>
          </div>

          <div className="col-span-2 p-4 rounded-2xl bg-accent/5 border border-accent/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold">Academic Ranking</p>
                <p className="text-[10px] text-zinc-500">Top 15% of your department</p>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-accent/50" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface SessionStatsProps {
  totalEnrolled: number;
  presentCount: number;
  presentRate: number;
}

export const SessionStats = ({ totalEnrolled, presentCount, presentRate }: SessionStatsProps) => {
  const stats = [
    { label: "Enrolled", value: totalEnrolled, color: "text-zinc-400", bg: "bg-zinc-900/30", sub: "Students" },
    { label: "Present", value: presentCount, color: "text-[#10b981]", bg: "bg-[#10b981]/5 border-[#10b981]/20", accent: "h-1 bg-[#10b981]/20", sub: `${presentRate}% Rate` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      {stats.map((stat, i) => (
        <div key={i} className={`p-4 rounded-2xl border border-zinc-800/80 ${stat.bg} shadow-lg relative overflow-hidden`}>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
          <div className="flex items-baseline gap-1.5">
            <p className={`text-xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
            <span className="text-[9px] text-zinc-600 font-bold uppercase">{stat.sub}</span>
          </div>
          {stat.accent && <div className={`absolute bottom-0 left-0 right-0 ${stat.accent}`} />}
        </div>
      ))}
    </div>
  );
};

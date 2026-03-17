interface SessionStatsProps {
  totalEnrolled: number;
  presentCount: number;
  presentRate: number;
}

export const SessionStats = ({ totalEnrolled, presentCount, presentRate }: SessionStatsProps) => {
  const stats = [
    { label: "Enrolled", value: totalEnrolled, color: "text-muted-foreground", bg: "bg-card/50", sub: "Students" },
    { label: "Present", value: presentCount, color: "text-accent", bg: "bg-accent/5 border-accent/20", accent: "h-1 bg-accent/20", sub: `${presentRate}% Rate` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      {stats.map((stat, i) => (
        <div key={i} className={`p-4 rounded-2xl border border-border/50 ${stat.bg} shadow-sm relative overflow-hidden backdrop-blur-sm`}>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-70">{stat.label}</p>
          <div className="flex items-baseline gap-1.5">
            <p className={`text-xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
            <span className="text-[9px] text-muted-foreground font-bold uppercase opacity-50">{stat.sub}</span>
          </div>
          {stat.accent && <div className={`absolute bottom-0 left-0 right-0 ${stat.accent}`} />}
        </div>
      ))}
    </div>
  );
};

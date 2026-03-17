import { motion } from "framer-motion";
import { formatSessionDate } from "@/lib/date";
import { SessionWithDetails } from "@/types";

interface SessionHeaderProps {
  session: SessionWithDetails | null;
}

export const SessionHeader = ({ session }: SessionHeaderProps) => {
  if (!session) return null;

  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold font-heading tracking-tight mb-1 text-foreground text-center sm:text-left">
        {session.courses?.code}: {session.courses?.name}
      </h1>
      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center sm:text-left opacity-70">
        {session.lecturer?.full_name} · {formatSessionDate(session.started_at)}
      </p>
    </div>
  );
};

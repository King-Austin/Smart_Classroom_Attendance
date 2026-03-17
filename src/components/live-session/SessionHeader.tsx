import { motion } from "framer-motion";
import { formatSessionDate } from "@/lib/date";
import { SessionWithDetails } from "@/types";

interface SessionHeaderProps {
  session: SessionWithDetails | null;
}

export const SessionHeader = ({ session }: SessionHeaderProps) => {
  if (!session) return null;

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold font-heading tracking-tight mb-0.5 text-white text-center sm:text-left">
        {session.courses?.code}: {session.courses?.name}
      </h1>
      <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider text-center sm:text-left">
        {session.lecturer?.full_name} · {formatSessionDate(session.started_at)}
      </p>
    </div>
  );
};

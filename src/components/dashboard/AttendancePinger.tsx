import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Users } from "lucide-react";

export const AttendancePinger = () => {
  const [lastEvent, setLastEvent] = useState<{ name: string; time: number } | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('attendance-pinger-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records' },
        async (payload) => {
          // Fetch the student name for the pinger
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.student_id)
            .single();

          if (data) {
            setLastEvent({ name: data.full_name, time: Date.now() });
            setPulse(true);
            setTimeout(() => setPulse(false), 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed bottom-24 right-5 z-[50] pointer-events-none">
      <AnimatePresence>
        {lastEvent && Date.now() - lastEvent.time < 5000 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-accent shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-accent/50 backdrop-blur-md"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute inset-0 bg-white rounded-full"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none mb-1">New Presence</p>
              <p className="text-[11px] font-bold text-white leading-none truncate max-w-[100px]">
                {lastEvent.name.split(' ')[0]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`mt-2 flex items-center justify-center w-10 h-10 rounded-full bg-card/80 border border-border/50 backdrop-blur-md transition-all duration-500 ${pulse ? 'border-accent scale-110 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : ''}`}>
        <Activity className={`w-4 h-4 ${pulse ? 'text-accent animate-pulse' : 'text-muted-foreground opacity-30'}`} />
      </div>
    </div>
  );
};

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ATTENDANCE_STATUS } from "@/constants";

interface ManualEntryProps {
  sessionId: string | undefined;
  onAdded: () => void;
  existingRecords: any[];
}

export const ManualEntry = ({ sessionId, onAdded, existingRecords }: ManualEntryProps) => {
  const [manualReg, setManualReg] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);

  const handleSearchStudent = async () => {
    if (!manualReg.trim()) return;
    setSearching(true);
    setFoundStudent(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, reg_number, department")
        .eq("reg_number", manualReg.toUpperCase())
        .single();
      
      if (error) throw new Error("Student not found");
      setFoundStudent(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleManualAdd = async () => {
    if (!foundStudent || !sessionId) return;
    try {
      const alreadyPresent = existingRecords.find(r => r.profiles?.reg_number === foundStudent.reg_number);
      if (alreadyPresent) {
        toast.error("Student already marked present");
        return;
      }

      const { error } = await supabase.from("attendance_records").insert({
        session_id: sessionId,
        student_id: foundStudent.id,
        status: ATTENDANCE_STATUS.VERIFIED,
        face_score: 1.0,
        is_manual: true
      });

      if (error) throw error;
      setFoundStudent(null);
      setManualReg("");
      onAdded();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-3 mb-8">
      <div className="flex gap-2 p-1.5 rounded-2xl bg-card border border-border shadow-sm focus-within:border-accent/40 transition-all focus-within:shadow-[0_0_15px_rgba(16,185,129,0.05)]">
        <Input
          value={manualReg}
          onChange={(e) => setManualReg(e.target.value)}
          placeholder="Enter Registration Number..."
          className="h-10 bg-transparent border-none text-foreground text-xs font-medium focus-visible:ring-0 placeholder:text-muted-foreground/50 flex-1 uppercase"
        />
        <Button 
          onClick={handleSearchStudent} 
          disabled={searching} 
          className="h-10 px-5 rounded-xl bg-zinc-950 dark:bg-white dark:text-zinc-950 text-white font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          {searching ? "Searching..." : "Search"}
        </Button>
      </div>

      {foundStudent && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-accent/5 border border-accent/20 flex items-center gap-4 shadow-sm"
        >
           <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <UserPlus className="w-5 h-5" />
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{foundStudent.full_name}</p>
              <p className="text-[10px] text-accent font-black tracking-widest uppercase opacity-70">{foundStudent.reg_number}</p>
           </div>
           <Button onClick={handleManualAdd} size="sm" className="h-9 px-4 rounded-xl bg-accent text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-accent/20">
             Confirm
           </Button>
        </motion.div>
      )}
    </div>
  );
};

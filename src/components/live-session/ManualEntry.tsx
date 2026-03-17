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
    <div className="space-y-2 mb-6">
      <div className="flex gap-2 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800 shadow-inner focus-within:border-accent/40 transition-all">
        <Input
          value={manualReg}
          onChange={(e) => setManualReg(e.target.value)}
          placeholder="Reg Number..."
          className="h-9 bg-transparent border-none text-zinc-100 text-xs focus-visible:ring-0 placeholder:text-zinc-600 flex-1"
        />
        <Button 
          onClick={handleSearchStudent} 
          disabled={searching} 
          className="h-9 px-4 rounded-lg bg-accent hover:bg-accent/90 text-black font-bold text-[10px] uppercase"
        >
          {searching ? "..." : "Search"}
        </Button>
      </div>

      {foundStudent && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-xl bg-accent/5 border border-accent/20 flex items-center gap-3"
        >
           <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <UserPlus className="w-4 h-4" />
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{foundStudent.full_name}</p>
              <p className="text-[9px] text-zinc-500 font-medium">{foundStudent.reg_number}</p>
           </div>
           <Button onClick={handleManualAdd} size="sm" className="h-7 rounded-lg bg-accent text-black font-bold text-[9px] uppercase">
             Add
           </Button>
        </motion.div>
      )}
    </div>
  );
};

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit2, UserPlus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SessionActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onUpdated: () => void;
}

export const SessionActionsDialog = ({ isOpen, onClose, session, onUpdated }: SessionActionsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Edit State
  const [dayNumber, setDayNumber] = useState(session?.day_number?.toString() || "");
  const [topic, setTopic] = useState(session?.topic || "");
  
  // Manual Entry State
  const [regNumber, setRegNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleUpdateSession = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({
          day_number: parseInt(dayNumber) || 1,
          topic: topic
        })
        .eq("id", session.id);
      
      if (error) throw error;
      toast.success("Session updated successfully");
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update session");
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualAttendance = async () => {
    if (!regNumber) return;
    setIsVerifying(true);
    try {
      // 1. Check if student exists
      const { data: student, error: studentError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("reg_number", regNumber.trim().toUpperCase())
        .single();
      
      if (studentError || !student) {
        toast.error("Student not found", { description: "Make sure the registration number is correct." });
        return;
      }

      // 2. Add attendance record
      const { error: recordError } = await supabase
        .from("attendance_records")
        .insert({
          session_id: session.id,
          student_id: student.id,
          status: "verified",
          is_manual: true,
          reason: "Lecturer Manual Entry"
        });
      
      if (recordError) {
        if (recordError.code === "23505") {
          toast.info("Already marked", { description: `${student.full_name} is already present.` });
        } else {
          throw recordError;
        }
      } else {
        toast.success(`Marked present: ${student.full_name}`);
        setRegNumber("");
        onUpdated();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to mark attendance");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteSession = async () => {
    setLoading(true);
    try {
      // Due to FK constraints, we might need to delete records first if cascading isn't enabled
      // The schema shows ON DELETE CASCADE for profiles->auth.users but not necessarily sessions->records
      // Let's try direct delete first
      const { error } = await supabase
        .from("attendance_sessions")
        .delete()
        .eq("id", session.id);
      
      if (error) throw error;
      toast.success("Session deleted");
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold font-heading">Manage Session</DialogTitle>
          <p className="text-xs text-muted-foreground">{session?.courses?.code} · {session?.topic || "General Lecture"}</p>
        </DialogHeader>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-border h-12 px-6">
            <TabsTrigger value="edit" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-full text-[11px] font-bold uppercase tracking-widest">
              Details
            </TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-full text-[11px] font-bold uppercase tracking-widest">
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="edit" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Lecture Topic</Label>
                <Input 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic..."
                  className="rounded-2xl h-12 bg-zinc-50 dark:bg-zinc-900 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Day Number</Label>
                <Input 
                  type="number"
                  value={dayNumber} 
                  onChange={(e) => setDayNumber(e.target.value)}
                  placeholder="1, 2, 3..."
                  className="rounded-2xl h-12 bg-zinc-50 dark:bg-zinc-900 border-border"
                />
              </div>
              <Button onClick={handleUpdateSession} disabled={loading} className="w-full h-12 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>

              <div className="pt-4 border-t border-border mt-6">
                {!showDeleteConfirm ? (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-destructive hover:bg-destructive/10 rounded-2xl h-12 text-[11px] font-bold uppercase tracking-widest"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Session
                  </Button>
                ) : (
                  <div className="bg-destructive/5 rounded-3xl p-4 border border-destructive/20 text-center animate-in fade-in zoom-in duration-200">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-1">Erase Attendance Data?</p>
                    <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed px-4">This will permanently remove all student attendance records for this session.</p>
                    <div className="flex gap-2">
                       <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase">Cancel</Button>
                       <Button onClick={handleDeleteSession} disabled={loading} variant="destructive" className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase">Confirm</Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-0">
               <div className="bg-accent/5 rounded-3xl p-4 border border-accent/10 mb-2">
                  <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mb-1">Administrative Overide</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Manually grant attendance to registered students who encountered device issues.</p>
               </div>
               
               <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Registration Number</Label>
                <Input 
                  value={regNumber} 
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. 2021/105432"
                  className="rounded-2xl h-12 bg-zinc-50 dark:bg-zinc-900 border-border uppercase"
                />
              </div>

              <Button onClick={handleAddManualAttendance} disabled={isVerifying || !regNumber} className="w-full h-12 rounded-2xl bg-zinc-950 dark:bg-white dark:text-zinc-950 text-white font-bold">
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <> <UserPlus className="w-4 h-4 mr-2" /> Mark Attendance </>}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

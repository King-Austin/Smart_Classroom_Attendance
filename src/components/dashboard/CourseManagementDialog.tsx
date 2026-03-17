import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Save, Loader2, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Course } from "@/types";

interface CourseManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | undefined;
  level: string | undefined;
  semester: string | undefined;
  department: string | undefined;
  currentCourseIds: string[];
}

export const CourseManagementDialog = ({
  isOpen,
  onClose,
  studentId,
  level,
  semester,
  department,
  currentCourseIds,
}: CourseManagementDialogProps) => {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentCourseIds);
      fetchAvailableCourses();
    }
  }, [isOpen, level, semester, department]);

  const fetchAvailableCourses = async () => {
    if (!level || !semester || !department) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("level", level)
        .eq("semester", semester)
        .eq("department", department);
      
      if (error) throw error;
      setAvailableCourses(data || []);
    } catch (error) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!studentId) return;
    setSaving(true);
    try {
      // 1. Delete old enrollments
      const { error: deleteError } = await supabase
        .from("enrollments")
        .delete()
        .eq("student_id", studentId);
      
      if (deleteError) throw deleteError;

      // 2. Insert new ones
      if (selectedIds.length > 0) {
        const enrollmentData = selectedIds.map(courseId => ({
          student_id: studentId,
          course_id: courseId
        }));
        
        const { error: insertError } = await supabase
          .from("enrollments")
          .insert(enrollmentData);
        
        if (insertError) throw insertError;
      }

      toast.success("Courses updated successfully");
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to update courses");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 pb-2 border-b border-border/50">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            Manage Courses
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Select the courses you are offering this semester.</p>
        </DialogHeader>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-sm text-muted-foreground tracking-widest uppercase font-bold">Syncing Ledger...</p>
            </div>
          ) : availableCourses.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-muted-foreground italic">No courses found matching your profile.</p>
            </div>
          ) : (
            availableCourses.map((course) => {
              const isSelected = selectedIds.includes(course.id);
              return (
                <motion.div
                  key={course.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleCourse(course.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-accent bg-accent/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                      : "border-border bg-card/50 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`font-bold text-sm ${isSelected ? "text-accent" : "text-foreground"}`}>{course.code}</p>
                    <p className="text-xs text-muted-foreground truncate">{course.name}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? "bg-accent border-accent text-white" : "border-muted-foreground/30"
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="p-6 pt-2 pb-8 border-t border-border/50 bg-card/50">
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="w-full h-12 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20 active:scale-95 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Selection
              </>
            )}
          </Button>
          <button 
            onClick={onClose}
            className="w-full mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Users, CheckCircle2, XCircle, AlertTriangle, UserPlus,
  Download, StopCircle, Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const MOCK_STUDENTS = [
  { id: "1", name: "John Doe", regNumber: "REG/2024/001", status: "present" as const, faceScore: 0.92, method: "auto" },
  { id: "2", name: "Jane Smith", regNumber: "REG/2024/002", status: "present" as const, faceScore: 0.88, method: "auto" },
  { id: "3", name: "Mike Johnson", regNumber: "REG/2024/003", status: "absent" as const, faceScore: 0, method: "-" },
  { id: "4", name: "Sarah Williams", regNumber: "REG/2024/004", status: "failed" as const, faceScore: 0.62, method: "auto" },
  { id: "5", name: "David Brown", regNumber: "REG/2024/005", status: "present" as const, faceScore: 0, method: "manual" },
];

const LiveSession = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [manualReg, setManualReg] = useState("");
  const [students] = useState(MOCK_STUDENTS);

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const failedCount = students.filter((s) => s.status === "failed").length;
  const attendanceRate = Math.round((presentCount / students.length) * 100);

  const handleManualAdd = () => {
    if (!manualReg.trim()) return;
    toast.success(`Student ${manualReg} added manually`);
    setManualReg("");
  };

  const handleEndSession = () => {
    toast.success("Session ended. Attendance saved.");
    navigate("/lecturer");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top" />
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/lecturer")} className="flex items-center gap-1 text-muted-foreground text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Live Session
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pb-8 max-w-sm mx-auto"
      >
        {/* Session Info */}
        <div className="mb-5">
          <h1 className="text-xl font-bold font-heading">CSC 301 - Data Structures</h1>
          <p className="text-xs text-muted-foreground">Day 15 · Binary Trees</p>
        </div>

        {/* BLE Status */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-5">
          <Wifi className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">BLE Advertising Active</span>
          <span className="text-[10px] text-muted-foreground ml-auto">Token rotating</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-center">
            <p className="text-lg font-bold text-accent">{presentCount}</p>
            <p className="text-[10px] text-muted-foreground">Present</p>
          </div>
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
            <p className="text-lg font-bold text-destructive">{absentCount}</p>
            <p className="text-[10px] text-muted-foreground">Absent</p>
          </div>
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-center">
            <p className="text-lg font-bold text-warning">{failedCount}</p>
            <p className="text-[10px] text-muted-foreground">Failed</p>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Attendance Rate</span>
            <span className="text-xs font-bold text-accent">{attendanceRate}%</span>
          </div>
          <Progress value={attendanceRate} className="h-2 rounded-full" />
        </div>

        {/* Manual Add */}
        <div className="flex gap-2 mb-5">
          <Input
            value={manualReg}
            onChange={(e) => setManualReg(e.target.value)}
            placeholder="Enter registration number"
            className="h-10 rounded-xl text-sm flex-1"
          />
          <Button onClick={handleManualAdd} size="sm" className="h-10 rounded-xl bg-primary text-primary-foreground">
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* Student List */}
        <div className="space-y-2 mb-6">
          {students.map((student) => (
            <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              {student.status === "present" ? (
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
              ) : student.status === "failed" ? (
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{student.name}</p>
                <p className="text-[10px] text-muted-foreground">{student.regNumber}</p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-medium ${
                  student.status === "present" ? "text-accent" : student.status === "failed" ? "text-warning" : "text-destructive"
                }`}>
                  {student.status === "present" ? "Present" : student.status === "failed" ? "Failed" : "Absent"}
                </span>
                {student.method === "manual" && (
                  <p className="text-[9px] text-muted-foreground">Manual</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl text-sm border-border"
            onClick={() => toast.info("Export coming soon")}
          >
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button
            onClick={handleEndSession}
            className="h-11 rounded-xl text-sm bg-destructive text-destructive-foreground"
          >
            <StopCircle className="w-4 h-4 mr-1" /> End Session
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default LiveSession;

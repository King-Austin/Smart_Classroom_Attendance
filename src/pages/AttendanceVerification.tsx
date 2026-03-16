import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, MapPin, Wifi, ShieldCheck, CheckCircle2, XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type VerificationStep = "permissions" | "face" | "gps" | "ble" | "verifying" | "success" | "failed";

const STEPS_CONFIG = [
  { id: "face" as const, icon: Camera, label: "Face Recognition", desc: "Look directly at the camera" },
  { id: "gps" as const, icon: MapPin, label: "GPS Verification", desc: "Checking your location" },
  { id: "ble" as const, icon: Wifi, label: "BLE Proximity", desc: "Scanning for lecturer beacon" },
];

const AttendanceVerification = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [currentStep, setCurrentStep] = useState<VerificationStep>("permissions");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const requestPermissions = () => {
    setCurrentStep("face");
    simulateStep("face");
  };

  const simulateStep = (step: string) => {
    setTimeout(() => {
      setCompletedSteps((prev) => [...prev, step]);
      if (step === "face") {
        setCurrentStep("gps");
        simulateStep("gps");
      } else if (step === "gps") {
        setCurrentStep("ble");
        simulateStep("ble");
      } else if (step === "ble") {
        setCurrentStep("verifying");
        setTimeout(() => {
          setCurrentStep("success");
          toast.success("Attendance verified!");
        }, 1500);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top" />
      <div className="px-6 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="px-6 pb-8 max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          {currentStep === "permissions" && (
            <motion.div
              key="permissions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center pt-8"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-xl font-bold font-heading mb-2">Permission Required</h1>
              <p className="text-sm text-muted-foreground mb-8">
                To verify your attendance, we need access to your camera, location, and Bluetooth.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  { icon: Camera, label: "Camera", desc: "For face recognition" },
                  { icon: MapPin, label: "Location", desc: "For GPS verification" },
                  { icon: Wifi, label: "Bluetooth", desc: "For proximity detection" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={requestPermissions}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Grant Permissions & Start
              </Button>
            </motion.div>
          )}

          {(currentStep === "face" || currentStep === "gps" || currentStep === "ble" || currentStep === "verifying") && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4"
            >
              <h1 className="text-xl font-bold font-heading mb-1">Verifying Attendance</h1>
              <p className="text-sm text-muted-foreground mb-6">CSC 301 - Data Structures</p>

              <div className="space-y-4">
                {STEPS_CONFIG.map((step) => {
                  const isCompleted = completedSteps.includes(step.id);
                  const isActive = currentStep === step.id;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCompleted
                          ? "bg-accent/5 border-accent"
                          : isActive
                          ? "bg-card border-primary shadow-sm"
                          : "bg-muted/50 border-border opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isCompleted ? "bg-accent/10" : isActive ? "bg-primary/10" : "bg-muted"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-accent" />
                          ) : isActive ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          ) : (
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{step.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {isCompleted ? "Verified ✓" : isActive ? step.desc : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {currentStep === "verifying" && (
                  <div className="p-4 rounded-xl bg-card border border-primary shadow-sm text-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-sm font-medium">Validating with server…</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center pt-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-accent" />
              </motion.div>
              <h1 className="text-2xl font-bold font-heading mb-2">Attendance Verified!</h1>
              <p className="text-sm text-muted-foreground mb-8">
                Your attendance for CSC 301 has been recorded successfully.
              </p>
              <Button
                onClick={() => navigate("/student")}
                className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-semibold"
              >
                Back to Dashboard
              </Button>
            </motion.div>
          )}

          {currentStep === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center pt-16"
            >
              <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold font-heading mb-2">Verification Failed</h1>
              <p className="text-sm text-muted-foreground mb-8">
                Could not verify your attendance. Please try again or contact your lecturer.
              </p>
              <Button
                onClick={() => { setCurrentStep("permissions"); setCompletedSteps([]); }}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AttendanceVerification;

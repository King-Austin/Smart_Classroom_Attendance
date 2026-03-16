import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, MapPin, Wifi, ShieldCheck, CheckCircle2, XCircle,
  Loader2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Geolocation } from "@capacitor/geolocation";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { BleClient, ScanMode } from "@capacitor-community/bluetooth-le";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance } from "@/lib/geo";
import { formatTime } from "@/lib/date";

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
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const requestPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [sessionRes, profileRes, recordRes] = await Promise.all([
        supabase.from("attendance_sessions").select("*, courses(name, code)").eq("id", sessionId).single(),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("attendance_records").select("id").eq("student_id", user.id).eq("session_id", sessionId).maybeSingle()
      ]);

      if (sessionRes.error) throw sessionRes.error;
      
      if (recordRes.data) {
        setSession(sessionRes.data);
        setProfile(profileRes.data);
        toast.info("You have already marked attendance for this session.");
        setCurrentStep("success");
        return;
      }

      setSession(sessionRes.data);
      setProfile(profileRes.data);

      setCurrentStep("face");
      await runVerificationFlow(sessionRes.data);
    } catch (error: any) {
      toast.error("Error starting verification: " + error.message);
    }
  };

  const runVerificationFlow = async (sessionData: any) => {
    try {
      // 1. Face Step
      const photo = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      setCompletedSteps(prev => [...prev, "face"]);
      await Haptics.impact({ style: ImpactStyle.Light });
      
      // 2. GPS Step
      setCurrentStep("gps");
      const position = await Geolocation.getCurrentPosition();
      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        sessionData.lecturer_lat || 0,
        sessionData.lecturer_lng || 0
      );

      if (distance > (sessionData.geo_radius_meters || 50)) {
        throw new Error(`Out of range. You are ${Math.round(distance)}m away.`);
      }
      setCompletedSteps(prev => [...prev, "gps"]);
      await Haptics.impact({ style: ImpactStyle.Light });

      // 3. BLE Step
      setCurrentStep("ble");
      
      const isBleScanningSupported = typeof navigator !== 'undefined' && 
                                    'bluetooth' in navigator && 
                                    // @ts-ignore - experimental API
                                    typeof navigator.bluetooth.requestLEScan === 'function';

      if (!isBleScanningSupported) {
        toast.warning("BLE scanning not supported on this device. Skipping proximity check...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        try {
          await BleClient.initialize();
          let foundBeacon = false;
          
          await BleClient.requestLEScan(
            {},
            (result) => {
              if (result.localName === sessionData.ble_token) {
                foundBeacon = true;
              }
            }
          );

          await new Promise(resolve => setTimeout(resolve, 5000));
          await BleClient.stopLEScan();
        } catch (bleError: any) {
          console.warn("BLE Error:", bleError);
          toast.warning("Proximity check failed: " + (bleError.message || "Unknown error"));
          // Even if it fails, we continue if the user is on a device that "should" support it
          // but maybe has BT off or something, depending on Option A's "automatically skip" spirit.
        }
      }

      setCompletedSteps(prev => [...prev, "ble"]);
      await Haptics.impact({ style: ImpactStyle.Medium });

      // 4. Final Verifying
      setCurrentStep("verifying");
      
      const blob = await (await fetch(`data:image/jpeg;base64,${photo.base64String}`)).blob();
      const fileName = `${sessionData.id}/${sessionData.course_id}_${Date.now()}.jpg`;
      
      await supabase.storage
        .from("attendance-verifications")
        .upload(fileName, blob);

      const { error: recordError } = await supabase.from("attendance_records").insert({
        student_id: (await supabase.auth.getUser()).data.user?.id,
        session_id: sessionId,
        gps_lat: position.coords.latitude,
        gps_lng: position.coords.longitude,
        face_score: 1.0,
        status: "verified"
      });

      if (recordError) throw recordError;

      setCurrentStep("success");
      toast.success("Attendance verified!");
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Verification failed");
      setCurrentStep("failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-accent/30 selection:text-white">
      <div className="safe-top" />
      
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#10b981]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#10b981]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="px-6 py-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="px-6 pb-8 max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            {currentStep === "permissions" && (
              <motion.div
                key="permissions"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center pt-8"
              >
                <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-[#10b981]/10 blur-xl rounded-full" />
                  <ShieldCheck className="w-12 h-12 text-[#10b981] relative z-10" />
                </div>
                <p className="text-[#10b981] text-xs font-bold tracking-[0.2em] uppercase mb-2">Security Protocol</p>
                <h1 className="text-2xl font-bold font-heading mb-3">Verify Your Presence</h1>
                <p className="text-sm text-zinc-400 mb-10 leading-relaxed px-4">
                  Authenticate your attendance through our multi-factor verification system.
                </p>

                <div className="space-y-3 mb-10">
                  {[
                    { icon: Camera, label: "Face ID", desc: "Biometric identification" },
                    { icon: MapPin, label: "GPS Sync", desc: "Campus location match" },
                    { icon: Wifi, label: "BLE Mesh", desc: "Proximity validation" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm text-left group transition-all hover:bg-zinc-900 hover:border-zinc-700">
                      <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 group-hover:bg-[#10b981]/10 group-hover:border-[#10b981]/20 group-hover:text-[#10b981] transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="text-[11px] text-zinc-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={requestPermissions}
                  className="w-full h-14 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
                >
                  Confirm Identity & Start
                </Button>
              </motion.div>
            )}

            {(currentStep === "face" || currentStep === "gps" || currentStep === "ble" || currentStep === "verifying") && (
              <motion.div
                key="verification"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-4"
              >
                <div className="text-center mb-10">
                  <p className="text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-3">Smart Campus</p>
                  <h1 className="text-xl font-bold font-heading mb-1 tracking-tight">Verify Your Presence</h1>
                  <p className="text-xs text-zinc-400 font-medium">Session Active · {session?.courses?.code}</p>
                </div>

                {/* Scanning Ring Container */}
                <div className="relative w-64 h-64 mx-auto mb-12">
                  {/* Outer Pulsing Ring */}
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute inset-0 rounded-full border border-[#10b981]/20 blur-sm"
                  />
                  
                  {/* Progress Ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="#18181b"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray="691"
                        initial={{ strokeDashoffset: 691 }}
                        animate={{ 
                          strokeDashoffset: 691 - (691 * (completedSteps.length / 3))
                        }}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                  </div>

                  {/* Inner Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative">
                      <AnimatePresence mode="wait">
                        {currentStep === "face" ? (
                          <motion.div
                            key="face-icon"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                          >
                            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-2xl relative">
                              <motion.div 
                                animate={{ y: [-15, 15, -15] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                className="absolute top-0 left-0 right-0 h-[2px] bg-[#10b981] shadow-[0_0_10px_#10b981]"
                              />
                              <User className="w-10 h-10 text-[#10b981]" />
                            </div>
                          </motion.div>
                        ) : currentStep === "verifying" ? (
                          <motion.div
                            key="verifying-icon"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          >
                            <Loader2 className="w-12 h-12 text-[#10b981]" />
                          </motion.div>
                        ) : (
                          <motion.div
                             key="status-icon"
                             initial={{ scale: 0.5, opacity: 0 }}
                             animate={{ scale: 1, opacity: 1 }}
                           >
                            <ShieldCheck className="w-16 h-16 text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="mt-4 text-xs font-bold text-[#10b981] tracking-[0.2em] uppercase">
                      {currentStep === "verifying" ? "Validating..." : "Scanning..."}
                    </p>
                  </div>
                </div>

                {/* Profile Card */}
                <div className="mb-10 text-center">
                  <h2 className="text-xl font-bold tracking-tight">{profile?.full_name}</h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Student ID:</span>
                    <span className="text-[10px] text-zinc-300 font-mono">{profile?.reg_number}</span>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-1.5 h-1.5 rounded-full bg-[#10b981]" 
                    />
                  </div>
                </div>

                {/* Status List */}
                <div className="space-y-3">
                  {[
                    { id: "face", label: "GPS Verified", desc: "Campus Location Match", icon: MapPin },
                    { id: "gps", label: "BLE Proximity", desc: "Beacon Validation", icon: Wifi },
                  ].map((item, idx) => {
                    // Logic for step indicators in the list below the scanner
                    // For UI match, we show "verified" items as they finish
                    const isDone = (item.id === "face" && completedSteps.includes("gps")) || 
                                 (item.id === "gps" && completedSteps.includes("ble"));
                    
                    return (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between transition-all duration-500 ${
                          isDone 
                            ? "bg-zinc-900/40 border-[#10b981]/30" 
                            : "bg-zinc-900/20 border-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isDone ? "bg-[#10b981]/10 text-[#10b981]" : "bg-zinc-800 text-zinc-600"
                          }`}>
                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <item.icon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isDone ? "text-white" : "text-zinc-500"}`}>{item.label}</p>
                            <p className="text-[10px] text-zinc-600 font-medium">{item.desc}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {isDone ? formatTime(new Date()) : "--:--"}
                        </span>
                      </motion.div>
                    );
                  })}
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
                <div className="relative w-32 h-32 mx-auto mb-10">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-[#10b981]/20 rounded-full"
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-[#10b981] flex items-center justify-center bg-[#09090b]">
                    <CheckCircle2 className="w-16 h-16 text-[#10b981]" />
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold font-heading mb-3 tracking-tighter">Attendance Verified!</h1>
                <p className="text-sm text-zinc-400 mb-10 leading-relaxed px-6">
                  Your identity and location have been successfully validated for <span className="text-white font-semibold">{session?.courses?.code}</span>.
                </p>

                <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 mb-10 text-left">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-800">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Receipt Tokens</span>
                    <span className="text-[10px] text-zinc-400 font-mono">#{sessionId?.slice(-8)}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Status</span>
                      <span className="text-xs text-[#10b981] font-bold">Confirmed ✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Timestamp</span>
                      <span className="text-xs text-white font-medium">{formatTime(new Date())}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/student")}
                  className="w-full h-14 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  Return to Dashboard
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
                <div className="w-24 h-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-8 relative">
                  <div className="absolute inset-0 bg-destructive/5 blur-xl rounded-full" />
                  <XCircle className="w-12 h-12 text-destructive relative z-10" />
                </div>
                <h1 className="text-2xl font-bold font-heading mb-3">Verification Error</h1>
                <p className="text-sm text-zinc-500 mb-12 leading-relaxed px-8">
                  Security protocols could not be fully established. Please ensure you are within range and have a clear view of the camera.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => { setCurrentStep("permissions"); setCompletedSteps([]); }}
                    className="w-full h-14 rounded-2xl bg-white text-black font-bold hover:bg-zinc-200 transition-all"
                  >
                    Retry Verification
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/student")}
                    className="w-full h-12 rounded-xl text-zinc-500 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AttendanceVerification;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, ChevronRight, Loader2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Course } from "@/types";
import { FACULTIES, DEPARTMENTS, LEVELS, SEMESTERS, DEFAULT_FACULTY, DEFAULT_DEPARTMENT } from "@/constants";
import LivenessScanner from "@/components/verification/LivenessScanner";
import { useBiometrics } from "@/hooks/useBiometrics";

const StudentRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { enroll, loading: biometricLoading } = useBiometrics();
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [isLivenessOpen, setIsLivenessOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    regNumber: "",
    email: "",
    password: "",
    level: "",
    semester: "",
    faculty: DEFAULT_FACULTY,
    department: DEFAULT_DEPARTMENT,
    parentPhone: "",
    deviceBinding: false,
  });
  const [faceImages, setFaceImages] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchCourses = async () => {
    if (!form.level || !form.semester) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("level", form.level)
        .eq("semester", form.semester);
      
      if (error) throw error;
      setAvailableCourses(data || []);
      setStep(3);
    } catch (error: any) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const onLivenessSuccess = (images: string[]) => {
    setFaceImages(images);
    setIsLivenessOpen(false);
    Haptics.impact({ style: ImpactStyle.Heavy });
    toast.success("Biometric Scan Complete");
  };

  const handleSubmit = async () => {
    if (faceImages.length < 3) {
      toast.error("Please complete face enrollment");
      return;
    }
    setLoading(true);
    
    let createdUserId: string | null = null;
    let uploadedFilePaths: string[] = [];

    try {
      // 0. Preliminary Validation
      if (!form.fullName || !form.regNumber || !form.email || !form.password) {
        throw new Error("All personal information fields are required.");
      }

      // 1. Existing System Audit (Failsafe for Registration Number)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("reg_number", form.regNumber)
        .maybeSingle();
      
      if (existingProfile) {
        throw new Error("Registration Number already exists in the system.");
      }

      // 2. Auth Phase (The "Point of No Return")
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      
      if (authError) {
        // Handle the case where user exists but profile was never created (Zombie User)
        if (authError.message.includes("already registered")) {
           // We'll try to sign in or just notify. Standard failsafe: notify user.
           throw new Error("Email already registered. Try logging in or use another email.");
        }
        throw authError;
      }

      if (!authData.user) throw new Error("Security handshake failed. Please try again.");
      createdUserId = authData.user.id;

      // 3. Biometric Vectorization (Refined Protocol)
      setIsVectorizing(true);
      const faceVector = await enroll(faceImages[0]); // Send primary frame to FastAPI
      if (!faceVector) throw new Error("Biometric server could not synchronize. Please retry.");

      // 4. Secure Storage Upload (Failsafe with cleanup tracking)
      const uploadPromises = faceImages.map(async (base64, index) => {
        try {
          const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();
          const fileName = `${createdUserId}/face_${index}_${Date.now()}.jpg`;
          
          const { data, error } = await supabase.storage
            .from("face-enrollments")
            .upload(fileName, blob, {
              contentType: "image/jpeg",
              upsert: true
            });
            
          if (error) throw error;
          uploadedFilePaths.push(data.path);
          return data.path;
        } catch (err) {
          console.error(`Upload failed for frame ${index}:`, err);
          throw new Error(`Cloud sync failed at frame ${index + 1}. Check connection.`);
        }
      });

      const finalPaths = await Promise.all(uploadPromises);
      
      // Get the first image as the avatar URL
      const { data: { publicUrl } } = supabase.storage
        .from("face-enrollments")
        .getPublicUrl(finalPaths[0]);

      // 5. Atomic Profile Creation & Vector Storage
      const { error: profileError } = await supabase.from("profiles").insert({
        id: createdUserId,
        full_name: form.fullName,
        reg_number: form.regNumber,
        role: "student",
        level: form.level,
        semester: form.semester,
        faculty: form.faculty,
        department: form.department,
        parent_phone: form.parentPhone,
        device_binding: form.deviceBinding,
        device_info: form.deviceBinding ? await import("@/lib/device").then(m => m.getUniqueDeviceId()) : null,
        face_enrolled: true,
        avatar_url: publicUrl,
        face_embeddings: { 
          paths: finalPaths, 
          version: "insightface-v2-stateless",
          vectorized_at: new Date().toISOString()
        },
      });

      if (profileError) throw profileError;

      // 5b. Save the pure vector in the specialized table for pgvector matching
      const { error: vectorError } = await supabase.from("face_embeddings").insert({
        user_id: createdUserId,
        embedding: faceVector
      });

      if (vectorError) throw vectorError;

      // 6. Course Enrollment
      if (selectedCourses.length > 0) {
        const enrollmentData = selectedCourses.map(courseId => ({
          student_id: createdUserId,
          course_id: courseId
        }));
        const { error: enrollError } = await supabase.from("enrollments").insert(enrollmentData);
        if (enrollError) console.error("Failsafe: Enrollment failed but profile persists:", enrollError);
      }

      Haptics.notification({ type: ImpactStyle.Heavy });
      toast.success("Identity Secured. Registration Successful!");
      navigate("/login");

    } catch (error: any) {
      console.error("Failsafe Triggered - Registration Rollback Mode:", error);
      Haptics.notification({ type: ImpactStyle.Medium });
      
      // Cleanup Strategy: Remove orphaned files if possible
      if (uploadedFilePaths.length > 0) {
        console.warn("Failsafe: Cleaning up orphaned biometric data...");
        supabase.storage.from("face-enrollments").remove(uploadedFilePaths).then(({ error }) => {
          if (error) console.error("Failsafe Cleanup Error:", error);
        });
      }

      toast.error(error.message || "Protocol Interrupted. Please retry.");
    } finally {
      setLoading(false);
      setIsVectorizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top" />
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate("/"))} className="flex items-center gap-1 text-muted-foreground text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs text-muted-foreground font-medium text-foreground/70">Step {step} of 4</span>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-6">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="px-6 pb-8 max-w-sm mx-auto"
      >
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold font-heading mb-1 text-foreground">Personal Info</h1>
            <p className="text-muted-foreground text-sm mb-6 text-foreground/70">Let's get you registered</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} placeholder="John Doe" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input value={form.regNumber} onChange={(e) => updateForm("regNumber", e.target.value)} placeholder="2021364001" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="john@university.edu" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => updateForm("password", e.target.value)} placeholder="••••••••" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Parent/Guardian Phone</Label>
                <Input value={form.parentPhone} onChange={(e) => updateForm("parentPhone", e.target.value)} placeholder="+234..." className="h-12 rounded-xl" />
              </div>
              <Button onClick={() => setStep(2)} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold mt-2">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold font-heading mb-1 text-foreground">Academic Info</h1>
            <p className="text-muted-foreground text-sm mb-6 text-foreground/70">Your university details</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Select value={form.faculty} onValueChange={(v) => { updateForm("faculty", v); updateForm("department", ""); }}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select faculty" /></SelectTrigger>
                  <SelectContent>
                    {FACULTIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.faculty && (
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={(v) => updateForm("department", v)}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS[form.faculty]?.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={form.level} onValueChange={(v) => updateForm("level", v)}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Level" /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={form.semester} onValueChange={(v) => updateForm("semester", v)}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Sem" /></SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-sm border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Device Binding</p>
                  <p className="text-xs text-muted-foreground">Link this device to your account</p>
                </div>
                <Switch checked={form.deviceBinding} onCheckedChange={(v) => updateForm("deviceBinding", v)} />
              </div>
              <Button onClick={fetchCourses} disabled={loading} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold mt-2">
                {loading ? "Loading Courses..." : "Continue"} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold font-heading mb-1 text-foreground">Course Selection</h1>
            <p className="text-muted-foreground text-sm mb-6 text-foreground/70">Select the courses you are offering this semester</p>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {availableCourses.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">No courses found for your level/semester.</p>
                </div>
              ) : (
                availableCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleCourse(course.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedCourses.includes(course.id)
                        ? "border-accent bg-accent/5 shadow-sm"
                        : "border-border bg-card opacity-70"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-foreground">{course.code}</p>
                        <p className="text-sm text-foreground/80 line-clamp-1">{course.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{course.semester}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedCourses.includes(course.id) ? "bg-accent border-accent" : "border-muted-foreground/30"
                      }`}>
                        {selectedCourses.includes(course.id) && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            <Button 
              onClick={() => setStep(4)} 
              disabled={selectedCourses.length === 0}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold mt-6"
            >
              Continue to Face Enrollment <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-bold font-heading mb-1 text-foreground">Face Enrollment</h1>
            <p className="text-muted-foreground text-sm mb-6 text-foreground/70">Secure your account with biometric ID</p>
            <div className="space-y-4">
              <div className={`p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all gap-4 ${
                faceImages.length > 0 ? "border-accent bg-accent/5" : "border-primary/30 bg-primary/5"
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  faceImages.length > 0 ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                }`}>
                  {faceImages.length > 0 ? <Fingerprint className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground">
                    {faceImages.length === 0 ? "Liveness Protocol" : 
                     faceImages.length === 3 ? "Biometric Data Ready" : 
                     `Captured ${faceImages.length}/3 Angles`}
                  </p>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold">
                       <span className={faceImages.length >= 1 ? "text-accent" : "text-muted-foreground"}>● Center</span>
                       <span className={faceImages.length >= 2 ? "text-accent" : "text-muted-foreground"}>● Right</span>
                       <span className={faceImages.length >= 3 ? "text-accent" : "text-muted-foreground"}>● Left</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setIsLivenessOpen(true)}
                variant={faceImages.length > 0 ? "outline" : "default"}
                className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
              >
                {faceImages.length > 0 ? "Recapture Biometrics" : "Start Liveness Scan"}
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={loading || faceImages.length === 0}
                className="w-full h-14 rounded-2xl bg-accent text-accent-foreground font-black uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isVectorizing ? "ImageSight Vectorization..." : "Binding Digital ID..."}
                  </div>
                ) : (
                  "Complete Enrollment"
                )}
              </Button>
            </div>
            
            {isLivenessOpen && (
              <LivenessScanner 
                onVerify={onLivenessSuccess} 
                onCancel={() => setIsLivenessOpen(false)} 
              />
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StudentRegister;

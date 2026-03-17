import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, ChevronRight } from "lucide-react";
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

const StudentRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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

  const captureFace = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        setFaceImages((prev) => [...prev, image.base64String!]);
        await Haptics.impact({ style: ImpactStyle.Medium });
        toast.success(`Face ${faceImages.length + 1} captured`);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Could not access camera");
    }
  };

  const handleSubmit = async () => {
    if (faceImages.length < 3) {
      toast.error("Please capture at least 3 face images");
      return;
    }
    setLoading(true);
    
    try {
      // 0. Check if reg number already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("reg_number", form.regNumber)
        .maybeSingle();
      
      if (existingProfile) {
        toast.error("An account with this Registration Number already exists");
        setLoading(false);
        return;
      }

      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      
      if (authError) throw authError;

      if (authData.user) {
        // 2. Upload face images to Supabase Storage
        const uploadPromises = faceImages.map(async (base64, index) => {
          const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();
          const fileName = `${authData.user!.id}/face_${index}_${Date.now()}.jpg`;
          
          const { data, error } = await supabase.storage
            .from("face-enrollments")
            .upload(fileName, blob, {
              contentType: "image/jpeg",
              upsert: true
            });
            
          if (error) throw error;
          return data.path;
        });

        const uploadedPaths = await Promise.all(uploadPromises);

        // 3. Create the profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          full_name: form.fullName,
          reg_number: form.regNumber,
          role: "student",
          level: form.level,
          semester: form.semester,
          faculty: form.faculty,
          department: form.department,
          parent_phone: form.parentPhone,
          device_binding: form.deviceBinding,
          device_info: form.deviceBinding ? navigator.userAgent : null,
          face_enrolled: true,
          face_embeddings: { paths: uploadedPaths },
        });

        if (profileError) throw profileError;

        // 4. Save enrollments
        if (selectedCourses.length > 0) {
          const enrollmentData = selectedCourses.map(courseId => ({
            student_id: authData.user.id,
            course_id: courseId
          }));
          const { error: enrollError } = await supabase.from("enrollments").insert(enrollmentData);
          if (enrollError) console.error("Enrollment error:", enrollError);
        }

        toast.success("Registration successful! Please verify your email.");
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
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
                <Input value={form.regNumber} onChange={(e) => updateForm("regNumber", e.target.value)} placeholder="REG/2024/001" className="h-12 rounded-xl" />
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
            <p className="text-muted-foreground text-sm mb-6 text-foreground/70">Capture 3–5 face images for verification</p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    onClick={i === faceImages.length ? captureFace : undefined}
                    className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                      i < faceImages.length
                        ? "border-accent bg-accent/10"
                        : i === faceImages.length
                        ? "border-primary bg-primary/5 cursor-pointer hover:bg-primary/10"
                        : "border-border bg-muted/50 opacity-50"
                    }`}
                  >
                    {i < faceImages.length ? (
                      <div className="text-accent text-xs font-medium">✓ Done</div>
                    ) : i === faceImages.length ? (
                      <Camera className="w-6 h-6 text-primary" />
                    ) : (
                      <Camera className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {faceImages.length}/5 captured · Min 3 required
              </p>
              <Button
                onClick={handleSubmit}
                disabled={loading || faceImages.length < 3}
                className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-semibold mt-2"
              >
                {loading ? "Registering…" : "Complete Registration"}
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StudentRegister;

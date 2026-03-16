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

const FACULTIES = ["Engineering", "Science", "Arts", "Medicine", "Law", "Business"];
const DEPARTMENTS: Record<string, string[]> = {
  Engineering: ["Computer Science", "Electrical", "Mechanical", "Civil"],
  Science: ["Physics", "Chemistry", "Biology", "Mathematics"],
  Arts: ["English", "History", "Philosophy", "Fine Arts"],
  Medicine: ["Medicine", "Nursing", "Pharmacy", "Dentistry"],
  Law: ["Law"],
  Business: ["Accounting", "Finance", "Management", "Marketing"],
};
const LEVELS = ["100", "200", "300", "400", "500"];
const SEMESTERS = ["1st Semester", "2nd Semester"];

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
    faculty: "",
    department: "",
    parentPhone: "",
    deviceBinding: false,
  });
  const [faceImages, setFaceImages] = useState<string[]>([]);

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const captureFace = () => {
    // Simulated face capture — in Capacitor native, this would use camera plugin
    const mockEmbedding = `face_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setFaceImages((prev) => [...prev, mockEmbedding]);
    toast.success(`Face ${faceImages.length + 1} captured`);
  };

  const handleSubmit = async () => {
    if (faceImages.length < 3) {
      toast.error("Please capture at least 3 face images");
      return;
    }
    setLoading(true);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    
    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
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
        face_embeddings: faceImages,
      });

      if (profileError) {
        toast.error("Registration failed: " + profileError.message);
        setLoading(false);
        return;
      }

      toast.success("Registration successful! Please verify your email.");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top" />
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate("/"))} className="flex items-center gap-1 text-muted-foreground text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs text-muted-foreground font-medium">Step {step} of 3</span>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-6">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 3) * 100}%` }}
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
            <h1 className="text-2xl font-bold font-heading mb-1">Personal Info</h1>
            <p className="text-muted-foreground text-sm mb-6">Let's get you registered</p>
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
            <h1 className="text-2xl font-bold font-heading mb-1">Academic Info</h1>
            <p className="text-muted-foreground text-sm mb-6">Your university details</p>
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
                  <p className="text-sm font-medium">Device Binding</p>
                  <p className="text-xs text-muted-foreground">Link this device to your account</p>
                </div>
                <Switch checked={form.deviceBinding} onCheckedChange={(v) => updateForm("deviceBinding", v)} />
              </div>
              <Button onClick={() => setStep(3)} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold mt-2">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold font-heading mb-1">Face Enrollment</h1>
            <p className="text-muted-foreground text-sm mb-6">Capture 3–5 face images for verification</p>
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const LecturerRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    staffId: "",
    email: "",
    password: "",
    faculty: "",
    department: "",
  });

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        staff_id: form.staffId,
        role: "lecturer",
        faculty: form.faculty,
        department: form.department,
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
      <div className="px-6 py-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-muted-foreground text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pb-8 max-w-sm mx-auto"
      >
        <h1 className="text-2xl font-bold font-heading mb-1">Lecturer Registration</h1>
        <p className="text-muted-foreground text-sm mb-6">Set up your lecturer account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} placeholder="Dr. Jane Smith" required className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Staff ID</Label>
            <Input value={form.staffId} onChange={(e) => updateForm("staffId", e.target.value)} placeholder="STAFF/2024/001" required className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="jane@university.edu" required className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => updateForm("password", e.target.value)} placeholder="••••••••" required className="h-12 rounded-xl" />
          </div>
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
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold mt-2">
            {loading ? "Registering…" : "Create Account"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default LecturerRegister;

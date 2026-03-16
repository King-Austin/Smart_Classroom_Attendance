import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wifi, MapPin, Camera, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const COURSES = [
  "CSC 301 - Data Structures",
  "CSC 305 - Operating Systems",
  "CSC 311 - Algorithms",
];

const CreateSession = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    level: "",
    semester: "",
    course: "",
    dayNumber: "",
    topic: "",
    faceVerification: true,
    gpsVerification: true,
    bleVerification: true,
  });

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLaunch = () => {
    setLoading(true);
    // Simulate session creation
    setTimeout(() => {
      toast.success("Session launched! BLE advertising started.");
      navigate("/lecturer/session/new-session");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="safe-top" />
      <div className="px-6 py-4">
        <button onClick={() => navigate("/lecturer")} className="flex items-center gap-1 text-muted-foreground text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pb-8 max-w-sm mx-auto"
      >
        <h1 className="text-2xl font-bold font-heading mb-1">Create Session</h1>
        <p className="text-muted-foreground text-sm mb-6">Set up a new attendance session</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => updateForm("level", v)}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Level" /></SelectTrigger>
                <SelectContent>
                  {["100", "200", "300", "400", "500"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={form.semester} onValueChange={(v) => updateForm("semester", v)}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Sem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st Semester</SelectItem>
                  <SelectItem value="2nd">2nd Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={form.course} onValueChange={(v) => updateForm("course", v)}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Day Number</Label>
              <Input value={form.dayNumber} onChange={(e) => updateForm("dayNumber", e.target.value)} placeholder="1" type="number" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Topic (optional)</Label>
              <Input value={form.topic} onChange={(e) => updateForm("topic", e.target.value)} placeholder="Binary Trees" className="h-12 rounded-xl" />
            </div>
          </div>

          {/* Verification Rules */}
          <div className="space-y-3 pt-2">
            <p className="text-sm font-semibold">Verification Rules</p>
            {[
              { key: "faceVerification", icon: Camera, label: "Face Recognition" },
              { key: "gpsVerification", icon: MapPin, label: "GPS / Geo-fence" },
              { key: "bleVerification", icon: Wifi, label: "BLE Detection" },
            ].map(({ key, icon: Icon, label }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm">{label}</span>
                </div>
                <Switch
                  checked={form[key as keyof typeof form] as boolean}
                  onCheckedChange={(v) => updateForm(key, v)}
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleLaunch}
            disabled={loading || !form.course}
            className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-semibold mt-4"
          >
            {loading ? "Launching…" : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Launch Session
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateSession;

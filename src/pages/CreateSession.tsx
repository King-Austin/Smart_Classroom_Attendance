import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wifi, MapPin, Camera, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Geolocation } from "@capacitor/geolocation";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/types";
import { LEVELS, SEMESTERS, DEFAULT_DEPARTMENT, SESSION_STATUS } from "@/constants";

const CreateSession = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profile, setProfile] = useState<any>(null);
  
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

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!form.level || !form.semester || !profile?.department) {
        setCourses([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("level", form.level)
        .eq("semester", form.semester)
        .eq("department", profile.department);
      
      if (data) setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, [form.level, form.semester, profile]);

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLaunch = async () => {
    if (!form.course) return;
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Capture Location
      let lat = null;
      let lng = null;
      if (form.gpsVerification) {
        const position = await Geolocation.getCurrentPosition();
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      // 2. Generate BLE Token
      const bleToken = Math.random().toString(36).substring(2, 10).toUpperCase();

      // 3. Create Session in DB
      const { data, error } = await supabase.from("attendance_sessions").insert({
        course_id: form.course,
        lecturer_id: user.id,
        day_number: parseInt(form.dayNumber) || 1,
        topic: form.topic,
        verification_rules: {
          face: form.faceVerification,
          gps: form.gpsVerification,
          ble: form.bleVerification,
        },
        ble_token: bleToken,
        lecturer_lat: lat,
        lecturer_lng: lng,
        geo_radius_meters: 50,
        status: SESSION_STATUS.ACTIVE
      }).select().single();

      if (error) throw error;

      await Haptics.notification({ type: ImpactStyle.Heavy as any });
      toast.success("Session launched! Students can now join.");
      navigate(`/lecturer/session/${data.id}`);
    } catch (error: any) {
      console.error("Launch error:", error);
      toast.error(error.message || "Failed to launch session");
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold font-heading mb-1 text-foreground">Create Session</h1>
        <p className="text-muted-foreground text-sm mb-6 text-foreground/70">Set up a new attendance session</p>

        <div className="space-y-4">
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

          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={form.course} onValueChange={(v) => updateForm("course", v)}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {courses.length === 0 ? (
                  <SelectItem value="none" disabled>No courses available</SelectItem>
                ) : (
                  courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))
                )}
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
                  disabled
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

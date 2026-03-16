import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, ShieldCheck, Wifi, MapPin, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
      {/* Safe area top */}
      <div className="safe-top" />
      
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold font-heading text-primary-foreground mb-3">
            Smart Attendance
          </h1>
          <p className="text-primary-foreground/70 text-base max-w-xs mx-auto">
            Multi-factor verification for accurate, cheat-resistant attendance tracking
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap gap-2 justify-center mb-10"
        >
          {[
            { icon: Scan, label: "Face ID" },
            { icon: Wifi, label: "BLE Proximity" },
            { icon: MapPin, label: "GPS Fence" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground/80 text-xs font-medium"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full max-w-sm space-y-3"
        >
          <Button
            onClick={() => navigate("/register/student")}
            className="w-full h-14 text-base font-semibold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
          >
            <GraduationCap className="w-5 h-5 mr-2" />
            Register as Student
          </Button>
          <Button
            onClick={() => navigate("/register/lecturer")}
            variant="outline"
            className="w-full h-14 text-base font-semibold rounded-xl border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Register as Lecturer
          </Button>
          <button
            onClick={() => navigate("/login")}
            className="w-full text-sm text-primary-foreground/60 hover:text-primary-foreground/80 mt-4 transition-colors"
          >
            Already have an account? <span className="underline">Sign in</span>
          </button>
        </motion.div>
      </div>

      {/* Safe area bottom */}
      <div className="safe-bottom" />
    </div>
  );
};

export default Landing;

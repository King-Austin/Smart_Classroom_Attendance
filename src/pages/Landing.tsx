import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, ShieldCheck, Wifi, MapPin, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/30 selection:text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="safe-top" />

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="w-20 h-20 rounded-3xl bg-zinc-900/50 border border-border flex items-center justify-center mx-auto mb-6 shadow-2xl backdrop-blur-xl">
            <ShieldCheck className="w-10 h-10 text-accent" />
          </div>
          <p className="text-accent text-[10px] font-bold tracking-[0.4em] uppercase mb-3">Presence 2.0</p>
          <h1 className="text-4xl font-bold font-heading mb-4 tracking-tighter">
            Smart Attendance
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Next-generation attendance verification for the modern university ecosystem.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap gap-2 justify-center mb-12"
        >
          {[
            { icon: Scan, label: "Face ID" },
            { icon: Wifi, label: "BLE Mesh" },
            { icon: MapPin, label: "GPS Fence" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border shadow-sm text-foreground text-[10px] font-bold uppercase tracking-wider"
            >
              <Icon className="w-3.5 h-3.5 text-accent" />
              {label}
            </span>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full max-w-sm space-y-4"
        >
          <Button
            onClick={() => navigate("/register/student")}
            className="w-full h-15 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold text-base shadow-xl active:scale-95 transition-all"
          >
            <GraduationCap className="w-5 h-5 mr-3" />
            Join as Student
          </Button>

          <Button
            onClick={() => navigate("/register/lecturer")}
            variant="outline"
            className="w-full h-15 rounded-2xl border-2 border-accent/20 bg-accent/5 text-accent font-bold text-base hover:bg-accent/10 transition-all active:scale-95"
          >
            <BookOpen className="w-5 h-5 mr-3" />
            Faculty Portal
          </Button>

          <button
            onClick={() => navigate("/login")}
            className="w-full text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground mt-4 transition-colors"
          >
            Already registered? <span className="text-accent underline underline-offset-4 ml-1">Sign in</span>
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-8 text-center relative z-10">
        <div className="w-8 h-px bg-border mx-auto mb-4" />
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
          Powered by
        </p>
        <p className="text-xs font-bold font-heading text-foreground mt-1">
          Nnamdi Azikiwe University
        </p>
      </div>

      <div className="safe-bottom" />
    </div>
  );
};

export default Landing;

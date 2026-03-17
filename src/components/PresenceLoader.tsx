import { motion } from "framer-motion";

export const PresenceLoader = ({ message = "Processing..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-10 min-h-[300px]">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Biometric Face Outline */}
        <motion.svg
          viewBox="0 0 100 100"
          className="w-full h-full text-accent opacity-20"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <path
            d="M50 15c-15 0-25 10-25 25 0 15 5 25 25 45 20-20 25-30 25-45 0-15-10-25-25-25z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="stroke-[0.5]"
          />
          {/* Eyes & Mouth hints */}
          <circle cx="40" cy="35" r="2" fill="currentColor" />
          <circle cx="60" cy="35" r="2" fill="currentColor" />
          <path d="M40 70 Q50 75 60 70" fill="none" stroke="currentColor" strokeWidth="1" />
        </motion.svg>

        {/* The "Active" Scanning Frame */}
        <div className="absolute inset-0 border border-accent/30 rounded-3xl" />
        
        {/* Scanning Line */}
        <motion.div
          animate={{
            top: ["0%", "100%", "0%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute left-0 right-0 h-0.5 bg-accent shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
        />

        {/* Corner Brackets */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-accent" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-right-2 border-accent" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-accent" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-right-2 border-accent" />
        
        {/* Pulse center */}
        <motion.div
           animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-12 h-12 bg-accent rounded-full blur-xl"
        />
      </div>

      <div className="text-center space-y-2">
        <motion.p 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[10px] font-black text-accent uppercase tracking-[0.5em] ml-[0.5em]"
        >
          {message}
        </motion.p>
        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">
          Biometric Verification Pulse Active
        </p>
      </div>
    </div>
  );
};

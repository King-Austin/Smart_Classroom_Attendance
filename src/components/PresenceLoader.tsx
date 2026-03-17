import { motion } from "framer-motion";

export const PresenceLoader = ({ message = "Processing..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10">
      <div className="relative w-20 h-20">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            borderRadius: ["20%", "50%", "20%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-full h-full border-4 border-accent border-t-transparent flex items-center justify-center"
        />
        <motion.div
           animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 m-auto w-8 h-8 bg-accent rounded-full blur-sm"
        />
      </div>
      <div className="text-center">
        <motion.p 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs font-bold text-accent uppercase tracking-[0.3em]"
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
};

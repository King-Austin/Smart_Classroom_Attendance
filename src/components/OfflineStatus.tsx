import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * OfflineStatus component detects and displays a premium overlay when the user 
 * loses internet connection.
 */
export const OfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-xl px-8"
      >
        <div className="relative w-full max-w-sm">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-destructive/10 blur-[80px] rounded-full" />
          
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative p-8 rounded-[3rem] bg-card border border-border shadow-2xl text-center"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
              <WifiOff className="w-10 h-10 text-destructive" />
            </div>
            
            <h2 className="text-2xl font-bold font-heading mb-2">Connection Lost</h2>
            <p className="text-sm text-muted-foreground mb-8">
              It looks like your internet connection was interrupted. Please check your signal and try again.
            </p>
            
            <Button
              onClick={() => window.location.reload()}
              className="w-full h-14 rounded-2xl bg-foreground text-background font-bold gap-2 hover:bg-foreground/90 transition-all uppercase tracking-widest text-xs"
            >
              <RefreshCw className="w-4 h-4" /> Try Reconnecting
            </Button>
            
            <p className="mt-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">
              Smart Campus Protocol v2.0
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

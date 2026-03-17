import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-zinc-600" />
      )}
    </motion.button>
  );
};

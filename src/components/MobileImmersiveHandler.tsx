import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { useTheme } from "@/components/ThemeProvider";

/**
 * MobileImmersiveHandler manages the system status bar and navigation bar to provide 
 * a truly edge-to-edge "immersive" experience on mobile devices.
 */
export const MobileImmersiveHandler = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const setupImmersiveMode = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Overlay the status bar so web content flows behind it
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // Match the status bar style to the current theme
        const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light
        });

      } catch (error) {
        console.warn("StatusBar configuration failed:", error);
      }
    };

    setupImmersiveMode();
  }, [theme]);

  return null;
};

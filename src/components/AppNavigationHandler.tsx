import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App } from "@capacitor/app";

/**
 * AppNavigationHandler handles hardware back button events on mobile devices (Android).
 * It ensures that the back button navigates through the app's history instead of closing the app.
 */
export const AppNavigationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = async () => {
      // If we're at the root of the app, we let the app exit
      // You can also add logic here to show a toast "Press back again to exit"
      if (location.pathname === "/" || location.pathname === "/student" || location.pathname === "/lecturer") {
        App.exitApp();
      } else {
        // Otherwise, navigate back in history
        window.history.back();
      }
    };

    // Add listener for back button
    const listener = App.addListener("backButton", () => {
      handleBackButton();
    });

    return () => {
      // Clean up listener
      listener.then((l) => l.remove());
    };
  }, [location, navigate]);

  return null;
};

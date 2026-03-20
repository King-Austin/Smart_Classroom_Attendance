import { useState } from "react";
import { toast } from "sonner";

/**
 * Hook for managing stateless biometric communication with the FastAPI server.
 */
export const useBiometrics = () => {
  const [loading, setLoading] = useState(false);
  const SERVER_URL = import.meta.env.VITE_BIOMETRIC_SERVER_URL || "http://localhost:8000";

  /**
   * Enroll a student's face by generating a vector from an image.
   * @param base64Image The face image (center face preferred)
   */
  const enroll = async (base64Image: string): Promise<number[] | null> => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) throw new Error("FastAPI Enrollment Failed");

      const data = await response.json();
      return data.vector; // Expecting float[512]
    } catch (error) {
      console.error("Biometric Enrollment Error:", error);
      toast.error("Could not reach Biometric Server for enrollment.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify a face against a stored vector.
   * @param currentImage The live face capture
   * @param storedVector The vector saved during enrollment (array or pgvector string)
   */
  const verify = async (
    currentImage: string,
    storedVector: number[] | string
  ): Promise<{ success: boolean; score: number; liveness: number }> => {
    setLoading(true);
    try {
      // Ensure storedVector is an array (Supabase/pgvector often returns a string like "[1,2,3]")
      let finalVector = storedVector;
      if (typeof storedVector === 'string') {
        try { 
          // Remove brackets and split if it's a pgvector string, or use JSON.parse
          const cleanString = (storedVector as string).replace('[', '').replace(']', '');
          finalVector = cleanString.split(',').map(Number);
          console.log("Biometrics: Parsed string vector into array of length", finalVector.length);
        } catch (e) {
          console.error("Biometrics: Failed to parse vector string", e);
        }
      }

      const response = await fetch(`${SERVER_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: currentImage,
          stored_vector: finalVector,
        }),
      });

      if (!response.ok) throw new Error("FastAPI Verification Failed");

      const data = await response.json();
      return {
        success: data.match && data.liveness > 0.85,
        score: data.similarity || 0,
        liveness: data.liveness || 0,
      };
    } catch (error) {
      console.error("Biometric Verification Error:", error);
      toast.error("Biometric synchronization failed.");
      return { success: false, score: 0, liveness: 0 };
    } finally {
      setLoading(false);
    }
  };

  return { enroll, verify, loading };
};

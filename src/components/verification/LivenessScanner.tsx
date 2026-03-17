import { useRef, useEffect, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, RotateCcw, UserCheck, Loader2 } from "lucide-react";

interface LivenessScannerProps {
  onVerify: (images: string[]) => void;
  onCancel: () => void;
}

type LivenessStep = "center" | "right" | "left" | "complete";

const LivenessScanner = ({ onVerify, onCancel }: LivenessScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<LivenessStep>("center");
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [poorLighting, setPoorLighting] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  // Capture current frame
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
      }
    }
    return null;
  };

  // Helper to check lighting brightness
  const checkLighting = (video: HTMLVideoElement) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 40;
    canvas.height = 40;
    ctx.drawImage(video, 0, 0, 40, 40);
    const data = ctx.getImageData(0, 0, 40, 40).data;
    
    let brightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      brightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
    const avgBrightness = brightness / (data.length / 4);
    setPoorLighting(avgBrightness < 45); 
  };

  // Initialize MediaPipe
  useEffect(() => {
    const initScanner = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        setFaceLandmarker(landmarker);
        setLoading(false);
      } catch (err) {
        console.error("LivenessScanner: MediaPipe Init Error", err);
      }
    };
    initScanner();
  }, []);

  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Set up Camera
  useEffect(() => {
    if (!loading) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => console.error("Camera Error", err));
    }

    return () => stopCamera();
  }, [loading]);

  // Detection Loop
  useEffect(() => {
    let animationFrameId: number;
    let frameCount = 0;

    const detect = () => {
      if (faceLandmarker && videoRef.current && videoRef.current.readyState === 4) {
        if (frameCount % 30 === 0) {
          checkLighting(videoRef.current);
        }
        frameCount++;

        const results = faceLandmarker.detectForVideo(videoRef.current, performance.now());
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          const nose = landmarks[4];
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          
          const midPoint = (leftEye.x + rightEye.x) / 2;
          const yaw = -(nose.x - midPoint) / (rightEye.x - leftEye.x);

          if (step === "center" && Math.abs(yaw) < 0.1) {
            setIsCalibrated(true);
            const img = captureFrame();
            if (img) {
              setCapturedImages(prev => [...prev, img]);
              setTimeout(() => setStep("right"), 1000);
            }
          } else if (step === "right" && yaw > 0.35) {
            const img = captureFrame();
            if (img) {
              setCapturedImages(prev => [...prev, img]);
              setStep("left");
            }
          } else if (step === "left" && yaw < -0.35) {
            const img = captureFrame();
            if (img) {
              const finalImages = [...capturedImages, img];
              setCapturedImages(finalImages);
              setStep("complete");
              stopCamera();
              setTimeout(() => onVerify(finalImages), 800);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(detect);
    };

    if (faceLandmarker && step !== "complete") {
      detect();
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [faceLandmarker, step, capturedImages]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6">
      <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-2 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,1)] bg-zinc-950">
        {loading && (
          <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-3 z-30">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Warping Models...</p>
          </div>
        )}
        
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover brightness-110 contrast-110"
          style={{ transform: "scaleX(-1)" }} // Fixed: Mirroring
          playsInline
          muted
        />

        {/* Lighting Warning Overlay */}
        <AnimatePresence>
          {poorLighting && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-8 left-0 right-0 z-40 flex justify-center"
            >
              <div className="bg-orange-500/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/20">
                <RotateCcw className="w-4 h-4 text-white animate-spin" />
                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Poor Lighting: Move to Brighter Area</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Neon HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none border-[1.5px] border-white/10 rounded-[3rem]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Scanning Line */}
          {step !== "complete" && (
            <motion.div 
              animate={{ top: ["0%", "100%", "0%"] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-primary/40 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20"
            />
          )}

          {/* Guidelines */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full" />
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-8 text-center space-y-4 max-w-xs">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <h2 className="text-xl font-bold font-heading text-white">
              {step === "center" ? "Look Directly at Camera" :
               step === "right" ? "Slowly Turn Head Right" :
               step === "left" ? "Slowly Turn Head Left" :
               "Identity Confirmed"}
            </h2>
            <p className="text-zinc-500 text-sm">
              {step === "center" ? "Center your face in the circle" :
               step === "right" ? "Follow the green scanner" :
               step === "left" ? "Almost there..." :
               "Processing biometric signature"}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 justify-center pt-4">
          {[ "center", "right", "left" ].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                step === s ? "bg-primary w-12" : 
                (s === "center" && step !== "center") || (s === "right" && step === "left") || step === "complete"
                ? "bg-primary/30" : "bg-zinc-800"
              }`} 
            />
          ))}
        </div>
      </div>

      <button 
        onClick={onCancel}
        className="mt-auto mb-6 text-zinc-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-widest"
      >
        Cancel Protocol
      </button>
    </div>
  );
};

export default LivenessScanner;

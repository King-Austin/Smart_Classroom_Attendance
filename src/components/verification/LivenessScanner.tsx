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
  const [showInstructions, setShowInstructions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [poorLighting, setPoorLighting] = useState(false);
  const [tooFar, setTooFar] = useState(false);
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
    if (!loading && !showInstructions) {
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
  }, [loading, showInstructions]);

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
          
          // Distance calculation for proximity
          const eyeDist = Math.sqrt(Math.pow(leftEye.x - rightEye.x, 2) + Math.pow(leftEye.y - rightEye.y, 2));
          setTooFar(eyeDist < 0.22); // Threshold for "Too Far"

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
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {showInstructions ? (
          <motion.div 
            key="instructions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full w-full max-w-md px-6 pt-12 pb-8"
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/5">
                <UserCheck className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold font-heading text-white mb-2">Face Scan</h3>
              <p className="text-zinc-400 text-sm mb-12">Just a quick check to confirm identity.</p>
              
              <div className="space-y-4 w-full text-left">
                <div className="flex items-center gap-4 p-4 bg-zinc-900/60 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-800 flex items-center justify-center text-xl">👓</div>
                  <p className="text-sm text-zinc-300 font-medium">Remove glasses or masks</p>
                </div>
                <div className="flex items-center gap-4 p-4 bg-zinc-900/60 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-800 flex items-center justify-center text-xl">💡</div>
                  <p className="text-sm text-zinc-300 font-medium">Find a bright area</p>
                </div>
                <div className="flex items-center gap-4 p-4 bg-zinc-900/60 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-800 flex items-center justify-center text-xl">📏</div>
                  <p className="text-sm text-zinc-300 font-medium">Keep face in the frame</p>
                </div>
              </div>
            </div>

            <div className="w-full mt-auto pt-6 sticky bottom-0 bg-zinc-950/80 backdrop-blur-md safe-bottom">
               <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInstructions(false)}
                className="w-full py-4 bg-primary text-primary-foreground rounded-full font-bold text-sm shadow-xl shadow-primary/20"
              >
                Scan My Face
              </motion.button>
              <button 
                onClick={onCancel}
                className="w-full mt-4 py-4 text-zinc-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-widest"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full w-full max-w-md items-center justify-center px-6"
          >
            <div className="relative w-full aspect-[3/4] max-h-[60vh] rounded-[3rem] overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
              {loading && (
                <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-3 z-30">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Loading...</p>
                </div>
              )}
              
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover brightness-110 contrast-110"
                style={{ transform: "scaleX(-1)" }} 
                playsInline
                muted
              />

              {/* Status Pills */}
              <div className="absolute top-6 left-0 right-0 z-40 flex flex-col items-center gap-2 px-4">
                <AnimatePresence>
                  {poorLighting && !loading && (
                    <motion.div 
                      key="light"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-orange-500/95 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg w-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-white animate-spin" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Too Dark</span>
                    </motion.div>
                  )}
                  {tooFar && !loading && (
                    <motion.div 
                      key="far"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-primary/95 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg w-auto mt-1"
                    >
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Move Closer</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Minimal HUD */}
              <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[3rem]">
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                
                {/* Guidelines Oval Frame */}
                {!loading && (
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] border-2 border-dashed rounded-[100%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-colors duration-300 ${isCalibrated ? 'border-primary' : 'border-white/30'}`} />
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="mt-8 text-center w-full max-w-xs h-24 flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1"
                >
                  <h2 className="text-xl font-bold font-heading text-white">
                    {step === "center" ? "Look at Camera" :
                     step === "right" ? "Turn Right" :
                     step === "left" ? "Turn Left" :
                     "Confirmed"}
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    {step === "center" ? "Fit face in the oval" :
                     step === "right" ? "Follow the green line" :
                     step === "left" ? "Almost there..." :
                     "Processing..."}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-2 justify-center mt-6">
                {[ "center", "right", "left" ].map((s) => (
                   <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      step === s ? "bg-primary w-10" : 
                      (s === "center" && step !== "center") || (s === "right" && step === "left") || step === "complete"
                      ? "bg-primary/30 w-6" : "bg-zinc-800 w-6"
                    }`} 
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={onCancel}
              className="mt-4 text-zinc-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-widest absolute bottom-8"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LivenessScanner;

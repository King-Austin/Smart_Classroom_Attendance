from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
from insightface.app import FaceAnalysis

app = FastAPI(title="AIS Face Recognition Service")

# Enable CORS for mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize InsightFace (In Research Phase: This downloads models on first run)
# We use providers=['CPUExecutionProvider'] for maximum compatibility in slim containers
try:
    face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    face_app.prepare(ctx_id=0, det_size=(640, 640))
except Exception as e:
    print(f"Warning: InsightFace initialization deferred or failed: {e}")
    face_app = None

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AIS Face Recognition", "analyzer_ready": face_app is not None}

@app.post("/extract")
async def extract_face(file: UploadFile = File(...)):
    """
    AIS Face Extraction Endpoint.
    Accepts an image upload, detects the primary face, and returns:
    - 512-dim embedding vector (ready for Vector DB ingestion)
    - Detection confidence score
    - Bounding box & keypoints
    """
    if face_app is None:
        raise HTTPException(status_code=503, detail="Face analyzer not initialized")

    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        faces = face_app.get(img)

        if not faces:
            return {"face_detected": False, "message": "No face detected in image"}

        # Use the highest-confidence face
        face = max(faces, key=lambda f: f.det_score)

        return {
            "face_detected": True,
            "confidence": round(float(face.det_score), 4),
            "bbox": face.bbox.tolist(),
            "keypoints": face.kps.tolist(),
            "embedding": face.embedding.tolist(),  # 512-dim vector → store in Vector DB
            "embedding_dim": len(face.embedding),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

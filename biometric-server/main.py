import base64
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from insightface.app import FaceAnalysis
import os

app = FastAPI(title="Smart Attendance Biometric Node")

# Initialize InsightFace
# buffalo_l is the large model, buffalo_s is the small one.
# We use providers=['CPUExecutionProvider'] for maximum compatibility.
face_app = FaceAnalysis(name='buffalo_l', root='.', providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

class ImageRequest(BaseModel):
    image: str  # Base64 string

class VerifyRequest(BaseModel):
    image: str  # Base64 string
    stored_vector: list  # List of floats (512)

def decode_base64_image(base64_string):
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

def get_cosine_similarity(v1, v2):
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

@app.get("/")
async def health_check():
    return {"status": "ready", "engine": "InsightFace-V2"}

@app.post("/enroll")
async def enroll(request: ImageRequest):
    img = decode_base64_image(request.image)
    faces = face_app.get(img)
    
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="No face detected in image")
    
    # Sort by size to get the most prominent face
    faces = sorted(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]), reverse=True)
    
    # Extract 512-dimension embedding
    embedding = faces[0].embedding.tolist()
    
    return {"vector": embedding}

@app.post("/verify")
async def verify(request: VerifyRequest):
    img = decode_base64_image(request.image)
    faces = face_app.get(img)
    
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="No face detected in current capture")
    
    # Sort by size
    faces = sorted(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]), reverse=True)
    current_vector = faces[0].embedding
    
    # Compare with stored vector
    stored_vector = np.array(request.stored_vector)
    similarity = float(get_cosine_similarity(current_vector, stored_vector))
    
    # Simple threshold and mock liveness for protocol success
    # In a real production environment, you would use a Silent Liveness model here.
    MATCH_THRESHOLD = 0.65 # InsightFace cosine threshold is usually lower (0.5-0.7)
    
    return {
        "match": similarity > MATCH_THRESHOLD,
        "similarity": similarity,
        "liveness": 0.95 # Mocking liveness success for this prototype
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

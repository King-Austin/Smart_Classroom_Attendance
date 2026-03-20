from insightface.app import FaceAnalysis
import os

# Define local root for Docker baking
LOCAL_ROOT = './'
MODEL_NAME = 'buffalo_s'

# Initialize and prepare to trigger download into LOCAL_ROOT/models/
print(f"Pre-downloading InsightFace models ({MODEL_NAME}) into {LOCAL_ROOT}/models/...")
app = FaceAnalysis(name=MODEL_NAME, root=LOCAL_ROOT, providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640, 640))
print("Download complete and verified.")

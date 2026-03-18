from insightface.app import FaceAnalysis
import os

# Create directory if it doesn't exist
model_dir = os.path.expanduser('~/.insightface/models')
os.makedirs(model_dir, exist_ok=True)

# Initialize and prepare to trigger download
print("Pre-downloading InsightFace models (buffalo_l)...")
app = FaceAnalysis(name='buffalo_l', root='.', providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640, 640))
print("Download complete.")

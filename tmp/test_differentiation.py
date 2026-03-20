import requests
import base64
import os

# URLs
SERVER_URL = "https://smartattendance.up.railway.app"
IMAGE1_PATH = r"C:\Users\kingaustin\.gemini\antigravity\brain\2da773b0-c6fe-4fdc-97db-fb575990f21d\different_student_face_1_1774026171711.png"
IMAGE2_PATH = r"C:\Users\kingaustin\.gemini\antigravity\brain\2da773b0-c6fe-4fdc-97db-fb575990f21d\different_student_face_2_1774026195388.png"

def get_base64_from_file(path):
    with open(path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')
  
def test_differentiation():
    print(f"🚀 Testing Biometric Server Differentiation...")
    
    # 1. Enroll Person 1
    print(f"--- Enrolling Person 1 (Young Male) ---")
    img1_b64 = get_base64_from_file(IMAGE1_PATH)
    enroll_resp = requests.post(f"{SERVER_URL}/enroll", json={"image": img1_b64})
    if enroll_resp.status_code != 200:
        print(f"❌ Enrollment failed: {enroll_resp.text}")
        return
    
    person1_vector = enroll_resp.json()["vector"]
    print(f"✅ Person 1 Enrolled. Vector generated.")

    # 2. Verify Person 1 against Person 1 (Self-match test)
    print(f"\n--- Verifying Person 1 against Self (Expect Match) ---")
    verify_self = requests.post(f"{SERVER_URL}/verify", json={
        "image": img1_b64,
        "stored_vector": person1_vector
    })
    print(f"Respose: {verify_self.json()}")

    # 3. Verify Person 2 against Person 1 (Impersonation test)
    print(f"\n--- Verifying Person 2 (Older Female) against Person 1 (Expect FAIL) ---")
    img2_b64 = get_base64_from_file(IMAGE2_PATH)
    verify_impersonate = requests.post(f"{SERVER_URL}/verify", json={
        "image": img2_b64,
        "stored_vector": person1_vector
    })
    print(f"Response: {verify_impersonate.json()}")

if __name__ == "__main__":
    test_differentiation()

import base64
import requests
import urllib.request

# Sample face images, testing more avatars from GitHub
image_urls = [f"https://avatars.githubusercontent.com/u/{i}?v=4" for i in range(1, 11)]

def image_to_base64(url):
    response = urllib.request.urlopen(url)
    img_data = response.read()
    return base64.b64encode(img_data).decode('utf-8')

for idx, url in enumerate(image_urls):
    print(f"Testing image {idx + 1} from {url}...")
    try:
        b64_img = image_to_base64(url)
        payload = {"image": b64_img}
        
        response = requests.post("http://localhost:8000/enroll", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            vector = data.get("vector")
            print(f"Image {idx + 1} Success! Vector length: {len(vector) if vector else 0}")
            print(f"First 5 elements of vector: {vector[:5] if vector else []}")
        else:
            print(f"Image {idx + 1} Failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error testing image {idx + 1}: {e}")

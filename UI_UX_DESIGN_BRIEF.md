# Smart Campus Presence - UI/UX Design Brief

**To Google Stitch / AI Design Assistant:**  
*Your mission is to completely "vibe design" an ultra-modern, premium, and highly intuitive User Interface (UI) and User Experience (UX) for the "Smart Campus Presence" mobile application. The app must feel dynamic, frictionless, and highly secure. Use the absolute best practices in modern mobile app design: Glassmorphism, fluid micro-animations, premium layout structures, and deep, elegant aesthetics.*

---

## 1. Project Overview
"Smart Campus Presence" is a next-generation attendance and identity verification mobile application (built with React Native/Expo). It fully automates traditional classroom attendance by utilizing a combination of local hardware sensors, geospatial data, and biometric AI to guarantee undeniable proof of presence.

---

## 2. Core Features (Must be Prominently Designed)

### 📡 1. Bluetooth Low Energy (BLE) Tracking - "Invisible Check-ins" (CRITICAL)
- **Function:** The app securely scans for local BLE beacons placed in classrooms or broadcasted by professors to verify absolute close-proximity presence.
- **UI Requirement:** We need a visually stunning "ambient scanning" widget on the Home Dashboard. Think of a subtle, pulsing radar or a smooth rippling animation that indicates "Listening for Campus Beacons..." 
- Once successfully paired, transition smoothly to a sleek "Connected: Lecture Hall B" success state.

### 📍 2. GPS & Geofencing Localization
- **Function:** Cross-references the user's macro-location with their BLE micro-location to ensure they are actually on campus grounds.
- **UI Requirement:** A beautiful, stylized mini-map or a "Zone Status" card. It should show if the student is currently "Inside Core Geofence" or "Out of Bounds" with intelligent color coding (e.g., neon green for in-zone).

### 👤 3. Biometric Face Recognition & Liveness
- **Function:** A custom InsightFace model that vectorizes the student's face in real-time to prevent proxy attendance (students giving their phone to someone else).
- **UI Requirement:** Design a dedicated modal or full-screen view for the Face Scan. 
  - Needs a high-tech framing overlay over the camera feed.
  - Must include fluid visual feedback for "Liveness checks" (e.g., circular progress rings filling up as the user looks left/right).
  - Add a satisfying, instant "Match Verified" checkmark animation.



---

## 3. Strict UX / Design Directives for the UI Generation
1. **The "One-Tap" Philosophy:** 
   - A student should be able to open the app, immediately see their GPS/BLE status confirming their location, and hit a single prominent button to "Scan Face & Check In".
2. **Aesthetic & Color Palette:**
   - **Theme:** Default to an immersive Dark Mode (e.g., deep charcoal `#0E0E12` or pure black) with vibrant, neon accents (like Electric Cyan `#00E5FF` or Neon Purple) for active tracking states.
   - **Vibe:** Technical, academic, and hyper-premium.
   - Use blurred backgrounds (backdrop-filter / glassmorphism) for modals and floating nav bars to maintain depth.
3. **Typography:**
   - Modern, geometric sans-serif fonts only (Inter, Plus Jakarta Sans, or Outfit). Use stark contrasting font weights to create a clear hierarchy between labels and data.
4. **Micro-Interactions are King:**
   - Button presses, modal slides, and network status updates must feel incredibly snappy and satisfying.

---

**Final Instruction for the AI:** 
*"Do not hold back on creativity. Generate the React Native / frontend UI code for these exact screens. Prioritize the BLE connection visualizer, the GPS status card, and the Biometric camera overlay frame. Deliver a breathtaking frontend."*

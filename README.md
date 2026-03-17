# 🎓 Smart Campus Presence

**Smart Campus Presence** is a high-integrity, real-time attendance management system designed specifically for modern engineering faculties (starting with ECE). It solves the problem of "proxy attendance" using a multi-factor verification protocol including **Biometrics**, **Geo-fencing**, and **Proximity Detection**.

---

## 🚀 Key Features

### 🛡️ Multi-Factor Verification (The "Protocol")
*   **Face Signature (ImageSight)**: Uses advanced face enrollment with liveness detection (Center, Right, Left) to ensure only the physical student can sign in.
*   **Geo-Fencing**: Lecturers set a GPS perimeter. Attendance is only valid if the student is physically within the classroom boundaries.
*   **BLE Proximity**: Uses Bluetooth Low Energy beacons to verify that the student's device is within physical range of the lecturer's broadcasting node.
*   **Device Binding**: Prevents students from signing in for peers by locking their account to a unique hardware ID during the first verification.

### 📊 Role-Based Dashboards
*   **Student Portal**: Real-time attendance scoreboard, academic ranking (Top % of department), course management, and a secure "Identity Vault" for biometric records.
*   **Lecturer Portal**: Protocol Launchpad for creating sessions, real-time "Attendance Feed" of arriving students, and automated data visualization for faculty audits.

### ⚡ Technical Edge
*   **Real-time Synchronization**: Powered by Supabase Realtime for instant updates between lecturers and students.
*   **OTA (Over-The-Air) Updates**: Integrated with CapGo to push UI/Logic changes directly to installed Android/iOS apps without requiring store updates.
*   **Haptic Feedback**: Deep integration with mobile haptics for a premium, tactile user experience.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite) + TypeScript
*   **Mobile**: CapacitorJS (Native Bridge)
*   **Backend & DB**: Supabase (PostgreSQL + Auth + Realtime + Storage)
*   **Styling**: Tailwind CSS + Shadcn/UI (Custom Premium Dark Theme)
*   **Animations**: Framer Motion
*   **State Mgmt**: TanStack Query (React Query)

---

## 📦 Getting Started for Collaborators

### 1. Prerequisite Setup
*   **Node.js**: v20+
*   **Capacitor CLI**: `npm install -g @capacitor/cli`
*   **Android Studio**: For native builds.

### 2. Installation
```sh
git clone <repo-url>
cd smart-campus-presence
npm install
```

### 3. Environment Config
Create a `.env` file in the root with your credentials:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
CAPGO_TOKEN=your_capgo_api_key
CAPGO_APP_ID=com.smartattendance.app
```

### 4. Local Development
```sh
# Run in browser
npm run dev

# Run on Android with Live Reload
npx cap run android --livereload
```

---

## 🚢 Deployment & OTA Strategy

This project uses a **Hybrid Deployment Model**:

1.  **Native Shell**: Built once as an APK/AAB and installed on devices.
2.  **Web OTA**: Daily updates and bug fixes are pushed via CapGo.
    *   **Manual Update**: Run `npm run ship` to push local changes to all users instantly.
    *   **Automated (CI/CD)**: Every push to `main` triggers a GitHub Action to deploy the new bundle.

---

## 🤝 Project Structure
*   `/src/components`: UI components, verification modules (LivenessScanner), and dashboards.
*   `/src/hooks`: Custom hooks for real-time stats, profile management, and session tracking.
*   `/src/pages`: Higher-level route components (Dashboards, Register, Session Launch).
*   `/supabase/functions`: Edge functions for backend-heavy processing.
*   `/.github/workflows`: CI/CD pipelines for OTA and builds.

---

## 📜 Documentation & Guidelines
Please follow the **Atomic UI** pattern. Ensure all new components respect the dark-themed premium design system and use `Haptics` for meaningful interactions.

**Smart Campus Presence v2.4 (Production Ready)**

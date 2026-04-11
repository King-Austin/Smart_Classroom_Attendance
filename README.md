# 🎓 Smart Attendance

**Smart Campus Presence** is a high-integrity, real-time attendance management system designed for modern campuses. It eliminates "proxy attendance" using a multi-factor verification protocol including **Biometrics**, **Geo-fencing**, and **Proximity Detection**.

---

## 🚀 Key Features

### 🛡️ Multi-Factor Verification
*   **Face Signature**: Centralized face enrollment with liveness detection via the dedicated Biometric API.
*   **Geo-Fencing**: Dynamic GPS perimeter verification for session-specific attendance.
*   **BLE Proximity**: Proof-of-presence via Bluetooth Low Energy broadcasting.
*   **Device Binding**: Hardware-level account locking to prevent identity sharing.

### 📊 Role-Based Dashboards
*   **Student Portal**: Attendance heartbeats, academic rankings, and secure identity management.
*   **Lecturer Portal**: Session management console with real-time analytics and attendance feeds.

---

## ⚒️ Technology Stack

*   **Frontend**: React 18 (Vite) + TypeScript
*   **Mobile**: CapacitorJS (Native Bridge)
*   **Runtime**: Node.js (Primary) / Bun (Legacy support)
*   **Backend & DB**: Supabase (PostgreSQL + Realtime + Vector Engine)
*   **Styling**: Tailwind CSS + Shadcn/UI
*   **Automation**: CapGo (OTA Updates)

---

## ☁️ Biometric Infrastructure

The project uses a high-performance **InsightFace** implementation deployed on Railway.

- **Primary Endpoint**: `https://smartclassroomattendance.up.railway.app`
- **Core Logic**: Stateless face vectorization (512-dim embeddings) and similarity scoring.

---

## 📦 Installation & Setup

### 1. Prerequisite Setup
*   **Node.js**: v20+
*   **Native Tools**: Android Studio (for Android builds) or Xcode (for iOS builds).

### 2. Quick Start
```sh
git clone <repo-url>
cd smart-campus-presence
npm install
npm run dev
```

### 3. Environment Config
Copy `.env.example` to `.env` and populate it with your Supabase and Railway credentials.

---

## 🚢 Deployment Strategy

- **Production Build**: `npm run build`
- **Native Sync**: `npx cap sync`
- **OTA Update**: `npm run ship` (pushes instant UI/logic updates via CapGo)

---

## 🤝 Project Structure

*   `/src`: Core application logic (components, hooks, pages).
*   `/biometric-server`: Reference source for the Python-based Biometric API.
*   `/supabase`: Database migrations and edge function definitions.
*   `/android` & `/ios`: Native platform wrappers.

**Version 2.5 (Clean & Production Ready)**


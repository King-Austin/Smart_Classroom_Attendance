<div align="center">
  <h1>Smart Classroom Attendance 🎓</h1>
  <p><i>A high-integrity, real-time campus attendance system with multi-factor verification.</i></p>
</div>

---

## 📖 Overview
Traditional attendance methods are prone to fraud and time mismanagement. **Smart Classroom Attendance** is a modern, zero-trust solution designed for educational institutions to automate the tracking process. This robust application leverages a combination of hardware and software verification to ensure a student is exactly where they claim to be.

## ✨ Key Features & Verification Pillars
Our multi-layered verification ensures 100% attendance integrity:

1. **Biometric Verification**: Utilizes advanced facial recognition (Face Signature) for precise identity validation, preventing buddy punching.
2. **Geo-fencing (GPS)**: Cross-references user coordinates against predefined classroom geographical boundaries.
3. **Proximity Detection (BLE)**: Leverages Bluetooth Low Energy to detect physical presence against in-class beacons, securing against spoofed GPS locations.
4. **Real-time Synchronization**: Powered by Supabase for instant database updates, allowing administration to see attendance logs live.
5. **Cross-Platform Compatibility**: Built with React and wrapped in Capacitor, offering a seamless native mobile experience across Android and iOS.

## 🛠️ Tech Stack & Architecture
- **Frontend / UI**: React.js, TypeScript (Responsive, mobile-first design)
- **Mobile Container**: Capacitor
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security)
- **Hardware Integration**: Web Bluetooth API (BLE), Geolocation API

## 🧑‍💻 For Developers / Recruiters
This repository demonstrates my capability to integrate complex device APIs (Bluetooth, Location, Camera) into a seamless front-end React stack while handling heavy identity-verification logic. It highlights a strong focus on **security**, **user-experience**, and **modern cloud architectures**.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase account for backend configuration

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/King-Austin/Smart_Classroom_Attendance.git
   cd Smart_Classroom_Attendance
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm start
   ```

## 📈 Future Roadmap
- Integration with institutional Learning Management Systems (LMS).
- Offline queuing and automatic sync upon internet reconnection.
- Advanced analytics dashboard for professors.

---
*Developed by [Nworah Ebuka Augustus](https://github.com/King-Austin) - Dedicated to building impactful technology.*
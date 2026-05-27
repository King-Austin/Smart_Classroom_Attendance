<div align="center">

# Smart Campus Presence

### *The End of Proxy Attendance*

**A high-integrity, real-time academic attendance system with triple-layer biometric verification — built for the modern campus.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Native-119EFF?style=flat-square&logo=capacitor)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## The Problem: A Decades-Old Crisis in Academic Integrity

Attendance has been a core metric of academic engagement since formal schooling began. From primary school register books passed along rows, to the university lecturer calling names from a printed roster — the underlying assumption has always been the same: **that the person answering is the person enrolled.**

That assumption has been broken for as long as the system has existed.

### The Paper Era

In secondary schools and early university settings, attendance was recorded manually. A register would circulate the classroom, and students would sign or tick their names. The flaws were immediate and obvious:

- A student could sign for an absent friend before passing the register along
- Lecturers rarely cross-referenced signatures against known handwriting
- Paper records were easily lost, tampered with, or simply not collected
- There was no audit trail — once the paper was gone, the data was gone

### The Digital Transition

Universities responded by moving to electronic systems — LMS portals, card swipes, and QR codes. This represented genuine progress. Data became persistent, centralised, and queryable. But the core vulnerability remained: **identity verification was still trivially bypassed**.

- **Card swipes** could be handed to a friend. Swipe and leave.
- **QR codes** displayed on a projector could be photographed and shared via WhatsApp to students outside the building — or even outside the country.
- **Sign-in apps** tied to a student ID number required no physical presence at all.
- **Online attendance portals** during the remote learning era made this worse, allowing students to mark attendance from any device, anywhere in the world.

The core issue was never the medium — it was the absence of **proof of physical presence**.

### The Scale of the Problem

Proxy attendance is not a fringe behaviour. Studies across West African, South Asian, and European university systems consistently show that between **20–40% of recorded attendance** in unverified systems involves some form of deception. The consequences are significant:

- **Academic**: Students miss core instruction and still receive attendance credit, creating a false picture of engagement.
- **Administrative**: University accreditation bodies use attendance data as a proxy for institutional quality. Inflated figures corrupt that signal.
- **Financial**: In systems where attendance gates examination eligibility or funding disbursement, fraudulent records have direct financial consequences.
- **Safety**: In emergency scenarios, attendance records used for headcounts become unreliable.

The problem is structural. No amount of policy enforcement fixes a system with no verification mechanism.

---

## The Solution: Smart Campus Presence

**Smart Campus Presence** is a mobile-first attendance platform that makes proxy attendance cryptographically and physically impossible through a **three-factor verification chain** that must be satisfied simultaneously.

No single factor is enough. All three must pass.

---

## The Verification Architecture

### Factor 1 — Biometric Identity (Face Signature)

Before a student can ever mark attendance, they enrol their face. This is not simple face detection — it is **face vectorization**: the InsightFace model generates a **512-dimensional embedding** that encodes the unique geometric relationships between facial landmarks. This vector is stored in Supabase's pgvector engine.

At check-in time, the live camera feed is processed by the same model. The resulting embedding is compared against the stored vector using cosine similarity. A match above the threshold confirms: **this is the enrolled person.**

Liveness detection prevents photo spoofing. Device binding (see below) prevents replay attacks. The combination means neither a photo nor a video of the enrolled student is sufficient — only their physical, live face, on their registered device.

> **Why this matters**: A friend cannot attend on your behalf. A photograph cannot attend on your behalf. The only credential that works is your face, in real time.

### Factor 2 — Geo-Fencing (Campus Perimeter Verification)

Every attendance session is associated with a GPS bounding polygon — the physical footprint of the building or lecture theatre where the session takes place. When a student initiates check-in, `@capacitor/geolocation` captures their real-time coordinates. These coordinates must fall within the active session's geo-fence.

This is evaluated dynamically per session, not per campus. A student physically present on campus but in the wrong building will not pass. A student at home with a VPN will not pass — IP location spoofing does not affect GPS hardware coordinates.

> **Why this matters**: It proves the student is physically inside the correct space, not just somewhere on campus, not just in the country.

### Factor 3 — BLE Proximity (Beacon Proof-of-Presence)

Each lecture room is equipped with a Bluetooth Low Energy beacon broadcasting a session-specific UUID. The student's device uses `@capacitor-community/bluetooth-le` to scan for this beacon. Detection of the beacon at sufficient RSSI (signal strength) confirms the device — and by extension, the student — is within Bluetooth range of the classroom hardware.

BLE signal propagation is highly localised. Walls and distance degrade the signal sharply. A student in the corridor outside the room, let alone in a different building, cannot fake a valid beacon reading.

> **Why this matters**: GPS can be accurate to ±10 metres. BLE closes that gap to ±3–5 metres. Together, they create a location proof that is extremely difficult to fabricate without physically being in the room.

### Factor 4 — Device Binding (Hardware-Level Account Lock)

Every account is bound to a unique device fingerprint at the point of registration. This binding is stored server-side and re-verified on every check-in request. A student cannot install the app on a second phone and use it as a proxy device. Account sharing is structurally eliminated.

> **Why this matters**: Even if someone knew your credentials, they cannot mark your attendance from their hardware.

---

## Application Screens

The interface is built around a dark, high-contrast design language — engineered for quick glanceability during the brief window between arriving at a lecture and it starting.

### Student Home Dashboard

<div align="center">
  <img src="public/docs/Screenshot 2026-05-27 192650.png" width="320" alt="Student Home Dashboard" />
</div>

The home screen surfaces the three metrics that matter most at a glance: overall attendance percentage, active streak, and academic rank. The **Mark Attendance** CTA is persistent and context-aware — it shows the next upcoming session and its location. Today's schedule lists all sessions with their current status (checked in, pending, or missed), allowing a student to plan check-ins before entering a room.

The streak mechanic (14-day 🔥 in the example) introduces a behavioural engagement layer — students are motivated to maintain their streak, organically improving attendance regularity.

### Attendance History & Analytics

<div align="center">
  <img src="public/docs/Screenshot 2026-05-27 192724.png" width="320" alt="Attendance History" />
</div>

The History tab presents a calendar heatmap of the current month alongside a per-course breakdown. Students can see at a glance which courses are at risk and which are healthy. The overall rate (91%, 88 of 96 classes) is backed by real data from the Supabase backend — not estimated, not cached. Per-course rates (Advanced Algorithms 96%, Distributed Systems 95%, Linear Algebra 86%) allow targeted remediation before a student crosses the minimum attendance threshold for examination eligibility.

### Identity & Security Settings

<div align="center">
  <img src="public/docs/Screenshot 2026-05-27 192832.png" width="320" alt="Settings & Identity Security" />
</div>

The Settings screen exposes the full identity stack to the student. Face Enrollment allows a re-scan if lighting or physical changes have degraded match accuracy. Device Binding shows the active hardware lock (iPhone 15 Pro — Hardware locked ✓). BLE Beacons lists the authorised classroom nodes. The Preferences section gives the student control over auto check-in triggers and anomaly alerts. The **Proxy Fraud Alerts** toggle — on by default — notifies the student if the system detects a suspicious check-in pattern on their account.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + TypeScript (Vite) |
| Mobile Bridge | CapacitorJS |
| UI System | Tailwind CSS + Shadcn/UI |
| State & Data Sync | TanStack Query |
| Backend & Database | Supabase (Postgres + Realtime + pgvector) |
| Biometric Engine | InsightFace (512-dim embeddings, Railway) |
| BLE | `@capacitor-community/bluetooth-le` |
| Location | `@capacitor/geolocation` |
| OTA Updates | CapGo |

---

## Biometric Infrastructure

The face recognition pipeline runs on a dedicated **InsightFace** service deployed on Railway:

```
https://smartclassroomattendance.up.railway.app
```

The service is **stateless** — it receives an image frame, returns a 512-dimensional float vector, and stores nothing. All vector storage and similarity queries run inside Supabase using the `pgvector` extension. Cosine similarity thresholds are tuned per deployment to balance false acceptance rate (FAR) against false rejection rate (FRR).

---

## Role-Based Portals

### Student Portal
- Attendance heartbeat with real-time session status
- Historical analytics with calendar view and per-course breakdown
- Academic ranking relative to cohort
- Identity management (face re-enrollment, device binding, beacon authorisation)
- Fraud anomaly alerts

### Lecturer Portal
- Session creation console with geo-fence and beacon configuration
- Real-time attendance feed as students check in
- Export-ready attendance records
- Anomaly flagging dashboard

---

## Quick Start

### Prerequisites
- Node.js v20+
- Android Studio (for Android builds) or Xcode (for iOS builds)

### Install & Run

```sh
git clone https://github.com/King-Austin/smart-campus-presence.git
cd smart-campus-presence
npm install
npm run dev
```

### Environment Configuration

Copy `.env.example` to `.env` and populate:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BIOMETRIC_API_URL=https://smartclassroomattendance.up.railway.app
```

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run test` | Run all Vitest tests |
| `npm run test:watch` | Tests in watch mode |
| `npx cap sync` | Sync web code to native platforms |
| `npm run ship` | Push OTA update via CapGo |

---

## Project Structure

```
smart-campus-presence/
├── src/                    # Core React application
│   ├── components/         # Shared UI components
│   ├── hooks/              # Custom hooks (BLE, geo, biometric)
│   └── pages/              # Route-level page components
├── supabase/               # Migrations and edge functions
├── biometric-server/       # InsightFace API reference source
├── android/                # Capacitor Android wrapper
├── ios/                    # Capacitor iOS wrapper
└── public/                 # Static assets and documentation
```

---

## Security Design Principles

1. **No single point of bypass** — all three factors (biometric, location, proximity) must pass simultaneously. Defeating one factor does not grant access.
2. **Stateless biometric processing** — face images are never stored. Only the mathematical embedding persists.
3. **Hardware binding** — device fingerprints are server-validated on every request, not just at login.
4. **Anomaly detection** — the system tracks check-in patterns and flags statistical outliers for review.
5. **Liveness enforcement** — the biometric layer distinguishes a live face from a photograph or screen replay.

---

<div align="center">

**Version 2.5 — Production Ready**

Developed by [Nworah Ebuka Augustus](https://github.com/King-Austin)

*Built to restore integrity to academic attendance — one verified check-in at a time.*

</div>

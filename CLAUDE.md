# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🛠 Common Commands
- **Development**: `npm run dev` (Starts Vite development server)
- **Build**: `npm run build` (Production build)
- **Linting**: `npm run lint` (ESLint check)
- **Testing**: `npm run test` (Run all Vitest tests) / `npm run test:watch` (Watch mode)
- **Native Sync**: `npx cap sync` (Syncs web code to Android/iOS platforms)
- **OTA Updates**: `npm run ship` (Pushes updates via CapGo)

## 🏗 Architecture & Structure
The project is a high-integrity attendance system using a React frontend bridged to native mobile platforms via CapacitorJS.

### High-Level Flow
1. **Multi-Factor Verification**:
   - **BLE Proximity**: Uses `@capacitor-community/bluetooth-le` to verify closeness to classroom beacons.
   - **Geo-Fencing**: Uses `@capacitor/geolocation` to ensure the user is within the campus perimeter.
   - **Biometrics**: Integrates with a remote InsightFace API (`https://smartclassroomattendance.up.railway.app`) for face vectorization and similarity scoring to prevent proxy attendance.
   - **Device Binding**: Locks accounts to specific hardware.

2. **Frontend Stack**:
   - **Framework**: React 18 + TypeScript + Vite.
   - **UI/Styling**: Tailwind CSS + Shadcn/UI.
   - **State/Data**: TanStack Query (`@tanstack/react-query`) for API synchronization.
   - **Backend**: Supabase (Postgres + Realtime + Vector Engine).

### Directory Layout
- `/src`: Core React application logic (components, hooks, pages).
- `/supabase`: Database migrations and edge function definitions.
- `/biometric-server`: Reference source for the Python-based Biometric API.
- `/android` & `/ios`: Capacitor native platform wrappers.
- `/public`: Static assets.

## 🎨 Design Guidelines
- **Theme**: Immersive Dark Mode (deep charcoal/black) with neon accents (Electric Cyan/Neon Purple).
- **Vibe**: Hyper-premium, technical, and academic.
- **UI Patterns**: Glassmorphism (backdrop-filters), fluid micro-animations, and high-tech camera overlays for biometric scanning.
- **UX Goal**: "One-Tap" philosophy—minimal friction from app open to check-in.

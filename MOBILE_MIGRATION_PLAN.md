# Smart Campus Presence — Mobile Migration Plan
## Web (Capacitor) → React Native + Expo (Bare Workflow)

> **Status**: Phase 1 — Approved, implementation in progress on branch `native-build`.  
> **Expo workspace**: `/native/` directory in repo root. Web app (`/src`) is untouched.

---

## 1. Route → Screen Mapping

| Web Route | Web Component (lines) | RN Screen File | Navigator | Key Conversion Notes |
|---|---|---|---|---|
| `/` | `Landing.tsx` (110) | `screens/LandingScreen.tsx` | `AuthStack` | No Capacitor calls. Framer Motion glows → Reanimated. CTA buttons navigate to Login |
| `/login` | `Login.tsx` (102) | `screens/LoginScreen.tsx` | `AuthStack` | `<form>` → controlled `TextInput`s. `sonner` toast → `react-native-toast-message`. Supabase auth unchanged |
| `/register/student` | `StudentRegister.tsx` (457) | `screens/student-register/BasicInfoScreen.tsx` `CourseSelectScreen.tsx` `FaceEnrollScreen.tsx` | `RegisterStack` (nested) | Split 3-step wizard into 3 screens. `LivenessScanner` (MediaPipe WebAssembly) → `expo-camera` still photo → POST to `/enroll` on FastAPI |
| `/register/lecturer` | `LecturerRegister.tsx` (128) | `screens/LecturerRegisterScreen.tsx` | `AuthStack` | Single form, straight port |
| `/student` | `StudentDashboard.tsx` (563) | `screens/StudentDashboardScreen.tsx` | `StudentTabs` (Bottom Tabs) | `BottomNav.tsx` dropped; `@react-navigation/bottom-tabs` used instead. Backdrop blur → `expo-blur` BlurView |
| `/student/verify/:sessionId` | `AttendanceVerification.tsx` (457) | `screens/AttendanceVerificationScreen.tsx` | `StudentStack` (modal) | `@capacitor/geolocation` → `expo-location`. BLE central scan → `react-native-ble-manager`. Camera → `expo-camera` → FastAPI `/verify`. `@capacitor/haptics` → `expo-haptics` |
| `/ledger/:sessionId` | `AttendanceLedger.tsx` (210) | `screens/AttendanceLedgerScreen.tsx` | `StudentStack` | `<ul>` list → `FlatList`. Search stays on local state. Supabase query unchanged |
| `/lecturer` | `LecturerDashboard.tsx` (391) | `screens/LecturerDashboardScreen.tsx` | `LecturerTabs` (Bottom Tabs) | `recharts` EngagementChart → `victory-native`. Supabase Realtime unchanged |
| `/lecturer/create-session` | `CreateSession.tsx` (239) | `screens/CreateSessionScreen.tsx` | `LecturerStack` | BLE peripheral broadcast → `react-native-ble-advertiser` (Android) / `react-native-ble-plx` (iOS). `expo-location` for GPS anchor |
| `/lecturer/session/:sessionId` | `LiveSession.tsx` (205) | `screens/LiveSessionScreen.tsx` | `LecturerStack` | Realtime attendance feed via Supabase unchanged. `recharts` → `victory-native` |
| `*` | `NotFound.tsx` (24) | `screens/NotFoundScreen.tsx` | Root fallback | Trivial port |

---

## 2. Navigation Hierarchy

```
RootNavigator
├── (if unauthenticated) → AuthStack
│   ├── LandingScreen
│   ├── LoginScreen
│   ├── RegisterStack
│   │   ├── BasicInfoScreen
│   │   ├── CourseSelectScreen
│   │   └── FaceEnrollScreen
│   └── LecturerRegisterScreen
│
├── (if role === 'student') → StudentTabs (Bottom Tabs)
│   ├── Tab: Home → StudentDashboardScreen
│   ├── Stack: AttendanceVerificationScreen  (pushed from session card)
│   └── Stack: AttendanceLedgerScreen
│
└── (if role === 'lecturer') → LecturerTabs (Bottom Tabs)
    ├── Tab: Home → LecturerDashboardScreen
    ├── Stack: CreateSessionScreen
    └── Stack: LiveSessionScreen
```

Auth gate: `RootNavigator` calls `useProfile()` on mount. If no session → `AuthStack`. If `role === 'student'` → `StudentTabs`. If `role === 'lecturer'` → `LecturerTabs`.

---

## 3. Native Plugin Replacement Map

| Capacitor Plugin | Expo / RN Replacement | Notes |
|---|---|---|
| `@capacitor/camera` | `expo-camera` | `Camera.takePictureAsync()` returns base64. Same payload to FastAPI |
| `@capacitor/geolocation` | `expo-location` | `Location.getCurrentPositionAsync()`. Same accuracy settings |
| `@capacitor-community/bluetooth-le` (peripheral) | `react-native-ble-advertiser` | Android peripheral advertising. iOS: limited — show warning to lecturers |
| `@capacitor-community/bluetooth-le` (central/scan) | `react-native-ble-manager` | Student-side scanning for session tokens |
| `@capacitor/haptics` | `expo-haptics` | `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` — identical feel |
| `@capacitor/device` | `expo-device` + `expo-secure-store` | Device ID via `SecureStore` for binding |
| `@capacitor/status-bar` | `expo-status-bar` | `<StatusBar style="light" />` |
| `@capacitor/app` | React Navigation back handler | `useNavigation().goBack()` + `BackHandler` |

---

## 4. Package Replacement Map

| Web Package | Action | RN Replacement |
|---|---|---|
| `react-router-dom` | Replace | `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` |
| `framer-motion` | Replace | `react-native-reanimated` v3 + `react-native-gesture-handler` |
| `@radix-ui/*` (all) | Replace | Custom RN components in `native/src/components/ui/` |
| All `shadcn/ui` (61 files) | Replace | Subset of custom RN components (Button, Card, Input, Badge, Sheet, Tabs) |
| `recharts` | Replace | `victory-native` |
| `sonner` | Replace | `react-native-toast-message` |
| `next-themes` | Replace | Custom `ThemeContext` with `AsyncStorage` persistence |
| `embla-carousel-react` | Replace | `FlatList` horizontal |
| `vaul` (drawer) | Replace | `@gorhom/bottom-sheet` |
| `@mediapipe/tasks-vision` | **Drop** — backend only | FastAPI `/verify` handles all face recognition |
| `@supabase/supabase-js` | Keep | Auth storage: `AsyncStorage` instead of `localStorage` |
| `@tanstack/react-query` | Keep | No changes |
| `react-hook-form` | Keep | No changes |
| `zod` | Keep | No changes |
| `lucide-react` | Replace | `lucide-react-native` (same component names) |
| `tailwindcss` + `className` | Keep via NativeWind | NativeWind v4 babel plugin compiles `className` for RN |

---

## 5. Files Copied Verbatim (zero or minimal changes)

| Source | Destination | Change |
|---|---|---|
| `src/integrations/supabase/types.ts` | `native/src/integrations/supabase/types.ts` | None |
| `src/hooks/useProfile.ts` | `native/src/hooks/useProfile.ts` | None |
| `src/hooks/useLiveSessions.ts` | `native/src/hooks/useLiveSessions.ts` | None |
| `src/hooks/useSessionData.ts` | `native/src/hooks/useSessionData.ts` | None |
| `src/hooks/useAttendanceStats.ts` | `native/src/hooks/useAttendanceStats.ts` | None |
| `src/hooks/useLecturerData.ts` | `native/src/hooks/useLecturerData.ts` | None |
| `src/hooks/useBiometrics.ts` | `native/src/hooks/useBiometrics.ts` | `import.meta.env.VITE_*` → `process.env.EXPO_PUBLIC_*`. `sonner` → `react-native-toast-message` |
| `src/lib/utils.ts` | `native/src/lib/utils.ts` | None (`clsx` + `tailwind-merge` work in RN) |
| `src/constants/*` | `native/src/constants/*` | None |
| `src/types/*` | `native/src/types/*` | None |

---

## 6. Files Fully Rewritten for RN

| File | Reason |
|---|---|
| `native/App.tsx` | `BrowserRouter` → `NavigationContainer`. Web providers stripped |
| `native/src/integrations/supabase/client.ts` | `localStorage` → `AsyncStorage`. `VITE_` → `EXPO_PUBLIC_` |
| `native/src/hooks/useBlePeripheral.ts` | Capacitor BLE → `react-native-ble-advertiser` peripheral |
| `native/src/hooks/useBleScanner.ts` | NEW: student-side central scan via `react-native-ble-manager` |
| `native/src/lib/ble.ts` | Capacitor → `react-native-ble-advertiser` |
| `native/src/lib/geo.ts` | Capacitor → `expo-location` |
| `native/src/lib/device.ts` | Capacitor → `expo-device` + `expo-secure-store` |
| All 11 screen files | Web HTML → RN core components |
| `native/src/components/verification/CameraCapture.tsx` | Replaces `LivenessScanner.tsx` — no MediaPipe, just `expo-camera` capture |

---

## 7. Styling Rules Applied in Conversion

| Web Pattern | RN Equivalent |
|---|---|
| `<div className="...">` | `<View className="...">` (NativeWind) |
| `<p className="...">` / `<span>` / `<h1>` | `<Text className="...">` |
| `<img src={x} alt={y}>` | `<Image source={x} accessibilityLabel={y} />` |
| `<button onClick={fn}>` | `<Pressable onPress={fn}>` |
| `<input onChange={fn}>` | `<TextInput onChangeText={fn}>` |
| `className="backdrop-blur-lg bg-card/95"` | `<BlurView intensity={50} tint="dark" className="bg-card/95">` |
| `<motion.div initial animate>` | `<Animated.View style={animatedStyle}>` (Reanimated) |
| `lucide-react` icon | `lucide-react-native` (same import name) |
| `min-h-screen` | `flex: 1` |
| `fixed bottom-0` | `position: 'absolute', bottom: 0` or `@react-navigation/bottom-tabs` |
| `safe-top` CSS class | `<SafeAreaView>` from `react-native-safe-area-context` |

---

## 8. EAS Build Profiles

| Profile | Purpose | Output |
|---|---|---|
| `development` | Local dev client (supports native modules) | Dev client app |
| `preview` | Internal distribution / testing APK | `.apk` (Android) |
| `production` | Store submission | `.aab` (Android), `.ipa` (iOS) |

---

## 9. Approval Gate (per original brief)

- [x] Phase 1: `MOBILE_MIGRATION_PLAN.md` written — **awaiting validation**
- [ ] Phase 2: Expo workspace initialized (`npx create-expo-app native`)
- [ ] Phase 3: Core packages installed
- [ ] Phase 4: Config files written (babel, metro, tailwind, app.json, eas.json)
- [ ] Phase 5: Infrastructure ported (navigation, Supabase client, hooks, lib/)
- [ ] Phase 6: All screens converted (3 parallel agent groups)
- [ ] Phase 7: EAS Build configured
- [ ] Phase 8: Pre-flight checks pass (`tsc`, `eslint`, `expo doctor`)

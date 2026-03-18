
TODO

Layer 1 — GPS (soft gate, don’t argue with it)

Goal: filter obvious outsiders, not prove presence.

What to do

Radius: 100–150m

Timeout: 10–15s

Use last known location first, then refresh

Rules
IF GPS within range → proceed
IF GPS fails → DO NOT block
IF GPS clearly (e.g. >500m) → block
Why

GPS lies indoors. Accept it and move on.

📡 Layer 2 — Bluetooth (your real location engine)

This is where your system lives or dies.

Step-by-step
1. Lecturer starts attendance

Generate:

SESSION_ID
SECRET_KEY
2. Start BLE broadcast (VERY IMPORTANT)

Broadcast:

TOKEN = HMAC(SESSION_ID + timestamp, SECRET_KEY)

Rotate every:

5–10 seconds
3. Student scans

Using BLE:

detect broadcast

read:

token

RSSI (signal strength)

4. Enforce proximity
IF RSSI > -75 → accept
IF RSSI < -85 → reject
ELSE → borderline (send to review)

This alone kills most cheating.

5. Validate token (backend)

Backend checks:

is token valid?

is timestamp fresh (<15s)?

matches SESSION_ID?

If not → reject.

👤 Layer 3 — Face (identity lock)

Immediately after BLE success:

Step-by-step

Open camera

Capture face

Send to backend

Compare with stored embedding

Decision
IF similarity > threshold → accept
ELSE → reject
🔁 Full Flow (clean)
Tap Attendance
   ↓
GPS check (soft)
   ↓
BLE scan + RSSI
   ↓
Token validation
   ↓
Face verification
   ↓
Mark attendance
🛡️ Failsafe Logic (THIS is what makes it robust)
Case 1 — GPS fails
→ Ignore GPS
→ Use BLE + Face only
Case 2 — BLE weak or unstable
→ Allow attempt
→ Flag as "low confidence"
→ Require lecturer approval
Case 3 — Face fails
→ HARD REJECT - No negotiation here.

🧨 Anti-Cheat Summary

You are blocking:

❌ location spoofing → GPS + BLE

❌ signal sharing → rotating tokens

❌ proxy attendance → face verification

❌ replay attacks → token expiry

That’s already stronger than most university systems.

---

✅ **COMPLETED CORE PROTOCOL**
- [x] Layer 1: GPS 150m Soft-Gate (with accuracy recalibration)
- [x] Layer 2: BLE Proximity (optional fallback)
- [x] Layer 3: Face Identity Protocol (Stateless FastAPI + PGVector)
- [x] Vercel Analytics Integration

🎨 **DESIGN SYSTEM**
- [x] Biometric Face Outline Loader
- [x] Premium Student Registry Cards
- [x] Lecturer Dashboard Glassmorphism & Metrics
- [x] Landing Page "Faculty Protocol" CTA

🚀 **NEXT: BIOMETRIC & PROXIMITY MESH**
- [ ] Layer 2: BLE Rotating Token System (HMAC)
- [ ] Layer 3: Face Signature Backend Comparison
- [ ] Failsafe Logic Integration
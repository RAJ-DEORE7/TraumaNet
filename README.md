# TRAUMANET

> Production-Grade Emergency Care Coordination Web Application with Real-Time Triage, Hospital GIS Dispatch, and AI-Assisted Clinical Structuring.

---

## 1. System Architecture Overview

TRAUMANET coordinates acute medical emergencies between distressed patients, emergency dispatchers, and hospital trauma centers.

```
PATIENT
  ↓ (Real Browser Geolocation & Microphone Audio)
  ↓ (Gemini AI Clinical Structuring — gemini-3.8-flash)
  ↓ (Real Hospital Discovery via OpenStreetMap Overpass GIS)
HOSPITAL REQUEST
  ↓ (Real-Time Dispatch Notification)
DOCTOR / TRAUMA BAY
  ↓ (HPR Registry Professional Verification)
  ↓ (Triage Evaluation & Bay Acceptance)
AMBULANCE & EN-ROUTE CARE
  ↓ (CAD Telemetry & Medical Device Telemetry)
HOSPITAL ARRIVAL & RESOLUTION
```

### Strict Clinical Safety & Anti-Fabrication Principles
- **Zero Mock Fallbacks**: Geolocation queries real browser GPS coordinates. Discovered hospitals are real physical facilities from OpenStreetMap's worldwide GIS database.
- **AI Boundaries**: Gemini structures patient-reported observations and prepares 30-second responder briefings. It **never diagnoses**, **never invents vitals**, and **never hallucinates injuries**. Every summary is prominently badged: `AI-ASSISTED SUMMARY — NOT A MEDICAL DIAGNOSIS`.
- **Doctor Verification**: Clinicians are placed in `PENDING` status upon onboarding until verified against the National Healthcare Professional Registry (HPR).
- **Graceful Unconfigured States**: When optional external hardware or providers (such as SMS gateways or BLE monitors) are not connected, the application reports exact system states (e.g. `"Phone verification is not configured yet."`, `"Medical device not connected."`).

---

## 2. Design System: Material 3 Expressive

- **Surfaces & Cards**: Rounded rectangular cards (`rounded-2xl`, `rounded-3xl`) with subtle elevations and accessible contrast. No liquid glass or glassmorphism.
- **Palette**: Deep charcoal / near-black (`neutral-900`), off-white (`neutral-50`), emergency red (`red-600`), professional green (`emerald-600`), restrained amber (`amber-600`).
- **Motion**: Directional slide transitions for form steps and navigation using `motion/react` (`Framer Motion`), full compliance with `prefers-reduced-motion`.
- **First Screen**: Clean, uncluttered landing presenting the `TRAUMANET` wordmark, description, and two compact Material-style actions: `[ DOCTOR ]` and `[ PATIENT ]`.

---

## 3. Database Architecture & Security (Firebase Integration)

Provisioned through the Google AI Studio Firebase Integration with Enterprise Cloud Firestore:

- **Authentication**: Firebase Authentication supporting Google OAuth Popup and Email/Password flows with user UID ownership.
- **Cloud Firestore**:
  1. `profiles`: User identity matching `request.auth.uid`.
  2. `patients`: Medical profile, emergency contacts, ABHA ID.
  3. `doctors`: Medical registration, workplace, specialization, and verification status.
  4. `hospitals`: Geographic coordinates, trauma capability, emergency phones.
  5. `incidents`: Emergency lifecycle tracking, patient coordinates, AI briefing, status.
  6. `incident_events`: Audit trail and chronological events.
  7. `incident_locations`: GPS location telemetry track.
  8. `vitals`: Medical device & clinician vital signs.
  9. `ambulances`: Vehicle numbers, driver contacts, CAD status.
  10. `medical_devices`: BLE abstraction layer for monitors.
  11. `hospital_resources`: ICU beds, trauma bays, operating room readiness.
  12. `notifications`: Alert notifications for clinicians and patients.

- **Security Rules (`firestore.rules`)**:
  - Attribute-Based Access Control (ABAC) and Zero-Trust architecture.
  - Ownership enforcement: users can only read/modify their own profiles and medical records.
  - Role-based clinician access for active incident triage.
  - Default-deny catch-all rule on all unmatched paths.

- **Realtime Capabilities**:
  - Live Firestore listeners on active incidents (`subscribeIncidentFromFirestore`, `subscribeAllIncidentsFromFirestore`).
  - Real-time audit event stream (`subscribeIncidentEventsFromFirestore`).
  - Automatic listener cleanup on component unmount.

---

## 4. Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for emergency structuring | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL (`https://xyz.supabase.co`) | Yes (for Supabase persistence) |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable anon key | Yes |
| `SUPABASE_SERVICE_ROLE` | Server-side elevated secret key | Server-side only |
| `HPR_VERIFICATION_API_URL` | National Healthcare Professional Registry endpoint | Optional |
| `HPR_VERIFICATION_APIKEY` | National HPR authorization key | Optional |
| `ABDM_CLIENT_ID` | National ABDM ABHA client ID | Optional |
| `ABDM_CLIENT_SECRET` | National ABDM ABHA client secret | Optional |
| `ROUTING_APIKEY` | Road routing provider API key | Optional |
| `HOSPITAL_PROVIDER_API_KEY` | Custom hospital directory provider | Optional (defaults to OSM) |

---

## 5. Local Development & Testing

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev

# 3. Build for production
npm run build

# 4. Start production server
npm start
```

Runs on port `3000` with full Express API routes and Vite frontend.

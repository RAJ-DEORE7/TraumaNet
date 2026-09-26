import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { structureEmergencyIncident, transcribeEmergencyAudio } from './src/server/geminiService.js';
import { discoverNearbyHospitals } from './src/server/hospitalService.js';
import {
  verifyDoctorRegistration,
  getAmbulanceServiceStatus,
  getMedicalDeviceStatus,
  verifyAbhaId,
} from './src/server/integrationsAdapter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// In-memory Incident Registry (supports full-stack coordination)
interface StoredIncident {
  id: string;
  patient_id?: string;
  user_id?: string;
  patient_name: string;
  patient_phone: string;
  emergency_contact: string;
  doctor_id?: string;
  hospital_id?: string;
  hospital_name?: string;
  hospital_address?: string;
  hospital_distance_km?: number;
  status: string;
  triage_urgency?: string;
  raw_patient_input?: string;
  audio_recording_url?: string;
  ai_summary?: any;
  latitude: number;
  longitude: number;
  location_accuracy?: number;
  address?: string;
  created_at: string;
  updated_at: string;
  events: Array<{
    id: string;
    event_type: string;
    description: string;
    actor_role: string;
    actor_name: string;
    created_at: string;
  }>;
}

const incidentsDatabase = new Map<string, StoredIncident>();

// ==========================================
// API ROUTES
// ==========================================

// 1. Structure Emergency with Gemini AI
app.post('/api/gemini/structure-incident', async (req: Request, res: Response) => {
  const { rawInput } = req.body;
  if (!rawInput || typeof rawInput !== 'string') {
    res.status(400).json({ error: 'rawInput string is required.' });
    return;
  }

  try {
    const structuredResult = await structureEmergencyIncident(rawInput);
    res.json(structuredResult);
  } catch (err: any) {
    console.error('Gemini structure error:', err?.message || err);
    res.status(500).json({
      error: err?.message || 'Emergency AI structuring service is currently unavailable.',
    });
  }
});

// 2. Audio Transcription with Gemini Transcribe
app.post('/api/gemini/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType } = req.body;
  if (!audioBase64) {
    res.status(400).json({ error: 'audioBase64 is required.' });
    return;
  }

  try {
    const transcript = await transcribeEmergencyAudio(audioBase64, mimeType || 'audio/webm');
    res.json({ transcript });
  } catch (err: any) {
    console.warn('Transcription error:', err?.message || err);
    res.status(503).json({ error: 'Speech-to-text service unavailable.' });
  }
});

// 3. Real Nearby Hospital Discovery
app.get('/api/hospitals/nearby', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radius = parseFloat((req.query.radius as string) || '5');

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({
      error: 'Valid latitude and longitude coordinates are required.',
    });
    return;
  }

  try {
    const result = await discoverNearbyHospitals(lat, lon, radius);
    res.json(result);
  } catch (err: any) {
    console.error('Hospital discovery error:', err);
    res.status(500).json({
      error: 'Hospital discovery service is not configured or temporarily unreachable.',
    });
  }
});

// 4. Incident Management Endpoints
app.post('/api/incidents', (req: Request, res: Response) => {
  const data = req.body;
  const id = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newIncident: StoredIncident = {
    id,
    patient_id: data.patient_id,
    user_id: data.user_id,
    patient_name: data.patient_name || 'Patient in Distress',
    patient_phone: data.patient_phone || 'Emergency Contact',
    emergency_contact: data.emergency_contact || 'None Listed',
    status: data.status || 'EMERGENCY_TRIGGERED',
    triage_urgency: data.triage_urgency || 'RED',
    raw_patient_input: data.raw_patient_input || '',
    audio_recording_url: data.audio_recording_url,
    ai_summary: data.ai_summary || null,
    latitude: data.latitude,
    longitude: data.longitude,
    location_accuracy: data.location_accuracy,
    address: data.address,
    hospital_id: data.hospital_id,
    hospital_name: data.hospital_name,
    hospital_address: data.hospital_address,
    hospital_distance_km: data.hospital_distance_km,
    created_at: now,
    updated_at: now,
    events: [
      {
        id: `evt-${Date.now()}-1`,
        event_type: 'EMERGENCY_TRIGGERED',
        description: 'SOS Emergency initiated by user.',
        actor_role: 'patient',
        actor_name: data.patient_name || 'Patient',
        created_at: now,
      },
    ],
  };

  if (data.hospital_id) {
    newIncident.events.push({
      id: `evt-${Date.now()}-2`,
      event_type: 'HOSPITAL_REQUESTED',
      description: `Emergency dispatch requested at ${data.hospital_name || 'Hospital'}.`,
      actor_role: 'system',
      actor_name: 'TRAUMANET Dispatch',
      created_at: now,
    });
  }

  incidentsDatabase.set(id, newIncident);
  res.status(201).json(newIncident);
});

app.get('/api/incidents', (_req: Request, res: Response) => {
  const incidentsList = Array.from(incidentsDatabase.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ incidents: incidentsList, total: incidentsList.length });
});

app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = incidentsDatabase.get(req.params.id);
  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }
  res.json(incident);
});

app.post('/api/incidents/:id/select-hospital', (req: Request, res: Response) => {
  const incident = incidentsDatabase.get(req.params.id);
  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const { hospital_id, hospital_name, hospital_address, distance_km } = req.body;
  const now = new Date().toISOString();

  incident.hospital_id = hospital_id;
  incident.hospital_name = hospital_name;
  incident.hospital_address = hospital_address;
  incident.hospital_distance_km = distance_km;
  incident.status = 'HOSPITAL_REQUESTED';
  incident.updated_at = now;

  incident.events.push({
    id: `evt-${Date.now()}`,
    event_type: 'HOSPITAL_REQUESTED',
    description: `Emergency dispatch requested for ${hospital_name}. Waiting for doctor triage acceptance.`,
    actor_role: 'patient',
    actor_name: incident.patient_name,
    created_at: now,
  });

  res.json(incident);
});

app.post('/api/incidents/:id/accept', (req: Request, res: Response) => {
  const incident = incidentsDatabase.get(req.params.id);
  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const { doctor_id, doctor_name, hospital_name } = req.body;
  const now = new Date().toISOString();

  incident.doctor_id = doctor_id;
  incident.status = 'HOSPITAL_ACCEPTED';
  incident.updated_at = now;

  incident.events.push({
    id: `evt-${Date.now()}`,
    event_type: 'HOSPITAL_ACCEPTED',
    description: `Emergency trauma request accepted by Dr. ${doctor_name || 'Physician'} at ${hospital_name || incident.hospital_name || 'Hospital'}. Trauma bay and emergency team alerted.`,
    actor_role: 'doctor',
    actor_name: doctor_name || 'Dr. Attending',
    created_at: now,
  });

  res.json(incident);
});

app.post('/api/incidents/:id/status', (req: Request, res: Response) => {
  const incident = incidentsDatabase.get(req.params.id);
  if (!incident) {
    res.status(404).json({ error: 'Incident not found' });
    return;
  }

  const { status, note, actor_role, actor_name } = req.body;
  const now = new Date().toISOString();

  incident.status = status;
  incident.updated_at = now;

  incident.events.push({
    id: `evt-${Date.now()}`,
    event_type: status,
    description: note || `Status progressed to ${status}.`,
    actor_role: actor_role || 'system',
    actor_name: actor_name || 'Coordinator',
    created_at: now,
  });

  res.json(incident);
});

// 5. Verification & Service Adapters
app.get('/api/verification/doctor/status', async (req: Request, res: Response) => {
  const regNum = req.query.regNumber as string;
  const council = req.query.council as string;
  const result = await verifyDoctorRegistration(regNum || '', council);
  res.json(result);
});

app.get('/api/ambulance/status', (_req: Request, res: Response) => {
  res.json(getAmbulanceServiceStatus());
});

app.get('/api/device/status', (_req: Request, res: Response) => {
  res.json(getMedicalDeviceStatus());
});

app.get('/api/abha/status', async (req: Request, res: Response) => {
  const abhaId = req.query.abhaId as string;
  const result = await verifyAbhaId(abhaId || '');
  res.json(result);
});

// ==========================================
// VITE / STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRAUMANET Full-Stack Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});

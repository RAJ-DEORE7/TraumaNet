/**
 * TRAUMANET Database & Domain Model Definitions
 * Strictly aligned with Supabase PostgreSQL schema
 */

export type UserRole = 'patient' | 'doctor' | 'paramedic' | 'hospital_admin';

export type IncidentStatus =
  | 'EMERGENCY_TRIGGERED'
  | 'HOSPITAL_REQUESTED'
  | 'HOSPITAL_ACCEPTED'
  | 'HOSPITAL_REJECTED'
  | 'AMBULANCE_ASSIGNED'
  | 'AMBULANCE_EN_ROUTE'
  | 'PATIENT_PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_HOSPITAL'
  | 'RESOLVED'
  | 'CANCELLED';

export type TriageUrgency = 'RED' | 'YELLOW' | 'GREEN' | 'UNKNOWN';

export type DoctorVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNAVAILABLE';

export type DeviceConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'NO_DATA' | 'LAST_UPDATED';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation?: string | null;
  abha_id?: string | null;
  blood_group?: string | null;
  known_allergies?: string | null;
  chronic_conditions?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  profession: string;
  specialization: string;
  medical_college: string;
  medical_education: string;
  medical_registration_number: string;
  hospital_workplace: string;
  hospital_location: string;
  verification_status: DoctorVerificationStatus;
  verification_provider?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  emergency_phone?: string | null;
  emergency_capability?: string;
  trauma_level?: string | null;
  is_verified?: boolean;
  distance_km?: number; // Calculated dynamically from patient coordinates
  distance_label?: string; // e.g. "Approx. distance"
  eta?: string | null; // e.g. "Travel time unavailable."
  created_at?: string;
}

export interface AISummary {
  chief_complaint: string;
  patient_reported_observations: string[];
  triage_urgency: TriageUrgency;
  triage_rationale: string;
  concise_responder_briefing: string;
  missing_critical_information: string[];
  hospital_resource_recommendation: string[];
  disclaimer: string;
}

export interface Incident {
  id: string;
  patient_id?: string | null;
  patient_name?: string | null;
  patient_phone?: string | null;
  emergency_contact?: string | null;
  user_id?: string | null;
  doctor_id?: string | null;
  hospital_id?: string | null;
  hospital_name?: string | null;
  hospital_address?: string | null;
  hospital_distance_km?: number | null;
  status: IncidentStatus;
  triage_urgency?: TriageUrgency | null;
  raw_patient_input?: string | null;
  audio_recording_url?: string | null;
  ai_summary?: AISummary | null;
  latitude: number;
  longitude: number;
  location_accuracy?: number | null;
  address?: string | null;
  selected_at?: string | null;
  accepted_at?: string | null;
  arrived_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  events?: IncidentEvent[];
  // Join references
  patient?: Patient;
  doctor?: Doctor;
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  event_type: string;
  description: string;
  actor_role?: string | null;
  actor_name?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface VitalSign {
  id: string;
  incident_id: string;
  heart_rate?: number | null;
  spo2?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  respiratory_rate?: number | null;
  temperature?: number | null;
  source: 'DEVICE' | 'CLINICIAN' | 'PATIENT_REPORTED';
  device_id?: string | null;
  recorded_at: string;
}

export interface MedicalDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type: string;
  mac_address?: string | null;
  status: DeviceConnectionStatus;
  battery_level?: number | null;
  last_synced?: string | null;
}

export interface IncidentLocation {
  id: string;
  incident_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  recorded_at: string;
}

export interface Ambulance {
  id: string;
  incident_id?: string | null;
  vehicle_number: string;
  driver_name?: string | null;
  driver_phone?: string | null;
  status: 'AVAILABLE' | 'DISPATCHED' | 'ON_SCENE' | 'IN_TRANSIT' | 'COMPLETED';
  created_at: string;
}

export interface HospitalResource {
  id: string;
  hospital_id: string;
  icu_beds_available?: number;
  trauma_bays_available?: number;
  operating_rooms_ready?: boolean;
  last_verified: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  incident_id?: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

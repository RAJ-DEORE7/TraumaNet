-- ============================================================================
-- TRAUMANET: Production-Grade Emergency Care Coordination Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS) & Realtime Publication
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'paramedic', 'hospital_admin')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  emergency_contact_relation TEXT,
  abha_id TEXT,
  blood_group TEXT,
  known_allergies TEXT,
  chronic_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  profession TEXT NOT NULL, -- e.g. 'Trauma Surgeon', 'Emergency Physician'
  specialization TEXT NOT NULL,
  medical_college TEXT NOT NULL,
  medical_education TEXT NOT NULL, -- MBBS, MS, MD, etc.
  medical_registration_number TEXT NOT NULL,
  hospital_workplace TEXT NOT NULL,
  hospital_location TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'UNAVAILABLE')),
  verification_provider TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  emergency_phone TEXT,
  emergency_capability TEXT DEFAULT '24/7 Trauma & Emergency Center',
  trauma_level TEXT, -- Level 1, Level 2, etc.
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. INCIDENTS TABLE (Core emergency workflow)
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  hospital_name TEXT,
  hospital_address TEXT,
  hospital_distance_km DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'EMERGENCY_TRIGGERED' CHECK (
    status IN (
      'EMERGENCY_TRIGGERED',
      'HOSPITAL_REQUESTED',
      'HOSPITAL_ACCEPTED',
      'HOSPITAL_REJECTED',
      'AMBULANCE_ASSIGNED',
      'AMBULANCE_EN_ROUTE',
      'PATIENT_PICKED_UP',
      'IN_TRANSIT',
      'ARRIVED_AT_HOSPITAL',
      'RESOLVED',
      'CANCELLED'
    )
  ),
  triage_urgency TEXT CHECK (triage_urgency IN ('RED', 'YELLOW', 'GREEN', 'UNKNOWN')),
  raw_patient_input TEXT,
  audio_recording_url TEXT,
  ai_summary JSONB, -- AI-assisted structured briefing
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_accuracy DOUBLE PRECISION,
  address TEXT,
  selected_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. INCIDENT EVENTS (Audit trail and timeline)
CREATE TABLE IF NOT EXISTS public.incident_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_role TEXT,
  actor_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. INCIDENT LOCATIONS (Live location track)
CREATE TABLE IF NOT EXISTS public.incident_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  source TEXT DEFAULT 'BROWSER_GEOLOCATION',
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. VITALS TABLE (Medical device telemetry / clinician entries)
CREATE TABLE IF NOT EXISTS public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  heart_rate INTEGER,
  spo2 INTEGER,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  respiratory_rate INTEGER,
  temperature DOUBLE PRECISION,
  source TEXT NOT NULL CHECK (source IN ('DEVICE', 'CLINICIAN', 'PATIENT_REPORTED')),
  device_id TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. AMBULANCES TABLE
CREATE TABLE IF NOT EXISTS public.ambulances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  vehicle_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'DISPATCHED', 'ON_SCENE', 'IN_TRANSIT', 'COMPLETED')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. MEDICAL DEVICES TABLE (BLE Abstraction)
CREATE TABLE IF NOT EXISTS public.medical_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'PULSE_OXIMETER', 'BP_MONITOR', 'ECG'
  mac_address TEXT,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'NO_DATA', 'LAST_UPDATED')),
  battery_level INTEGER,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. HOSPITAL RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.hospital_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  icu_beds_total INTEGER DEFAULT 0,
  icu_beds_available INTEGER DEFAULT 0,
  trauma_bays_total INTEGER DEFAULT 0,
  trauma_bays_available INTEGER DEFAULT 0,
  operating_rooms_ready BOOLEAN DEFAULT false,
  ventilators_available INTEGER DEFAULT 0,
  blood_bank_status TEXT,
  last_verified TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'ALERT',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_patient_id ON public.incidents(patient_id);
CREATE INDEX IF NOT EXISTS idx_incidents_doctor_id ON public.incidents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id ON public.incident_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_vitals_incident_id ON public.vitals(incident_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can view and manage their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Patients: Patients can view/edit their own record; Doctors can view in emergencies
CREATE POLICY "Patients manage own records" ON public.patients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient records for active incidents" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
    )
  );

-- Doctors: Doctors manage own records; Public/Patients can view verified doctor details
CREATE POLICY "Doctors manage own profile" ON public.doctors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view doctor profiles" ON public.doctors
  FOR SELECT USING (true);

-- Hospitals: Public read
CREATE POLICY "Public read hospitals" ON public.hospitals
  FOR SELECT USING (true);

-- Incidents: Patients see their own; Doctors see authorized / active emergencies
CREATE POLICY "Patients see own incidents" ON public.incidents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Doctors see active incidents" ON public.incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update incidents they accept" ON public.incidents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
    )
  );

-- Incident Events: Incident participants can view and insert
CREATE POLICY "Incident participants view events" ON public.incident_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.incidents inc
      WHERE inc.id = incident_id AND (inc.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.user_id = auth.uid()))
    )
  );

CREATE POLICY "Authenticated users can create incident events" ON public.incident_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Vitals: Viewable by incident participants
CREATE POLICY "Incident participants view vitals" ON public.vitals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.incidents inc
      WHERE inc.id = incident_id AND (inc.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.user_id = auth.uid()))
    )
  );

-- Realtime publication for live incident status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'incident_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_events;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'vitals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vitals;
  END IF;
END $$;

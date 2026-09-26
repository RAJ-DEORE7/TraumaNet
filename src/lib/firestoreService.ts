import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Profile,
  Patient,
  Doctor,
  Hospital,
  Incident,
  IncidentEvent,
  IncidentLocation,
  VitalSign,
  Ambulance,
  MedicalDevice,
  HospitalResource,
  AppNotification,
  DoctorVerificationStatus,
} from '../types/database';

/**
 * 1. PROFILES
 */
export async function saveProfileToFirestore(profile: Profile): Promise<void> {
  const path = `profiles/${profile.id}`;
  try {
    await setDoc(doc(db, 'profiles', profile.id), {
      ...profile,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getProfileFromFirestore(userId: string): Promise<Profile | null> {
  const path = `profiles/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'profiles', userId));
    return snap.exists() ? (snap.data() as Profile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * 2. PATIENTS
 */
export async function savePatientToFirestore(patient: Patient): Promise<void> {
  const path = `patients/${patient.user_id}`;
  try {
    await setDoc(doc(db, 'patients', patient.user_id), {
      ...patient,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getPatientFromFirestore(userId: string): Promise<Patient | null> {
  const path = `patients/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'patients', userId));
    return snap.exists() ? (snap.data() as Patient) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribePatientFromFirestore(
  userId: string,
  callback: (patient: Patient | null) => void
): Unsubscribe {
  const path = `patients/${userId}`;
  return onSnapshot(
    doc(db, 'patients', userId),
    (snap) => {
      callback(snap.exists() ? (snap.data() as Patient) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * 3. DOCTORS
 */
export async function saveDoctorToFirestore(doctor: Doctor): Promise<void> {
  const path = `doctors/${doctor.user_id}`;
  try {
    await setDoc(doc(db, 'doctors', doctor.user_id), {
      ...doctor,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getDoctorFromFirestore(userId: string): Promise<Doctor | null> {
  const path = `doctors/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'doctors', userId));
    return snap.exists() ? (snap.data() as Doctor) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeDoctorFromFirestore(
  userId: string,
  callback: (doctor: Doctor | null) => void
): Unsubscribe {
  const path = `doctors/${userId}`;
  return onSnapshot(
    doc(db, 'doctors', userId),
    (snap) => {
      callback(snap.exists() ? (snap.data() as Doctor) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * 4. HOSPITALS
 */
export async function saveHospitalToFirestore(hospital: Hospital): Promise<void> {
  const path = `hospitals/${hospital.id}`;
  try {
    await setDoc(doc(db, 'hospitals', hospital.id), {
      ...hospital,
      created_at: hospital.created_at || new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getHospitalFromFirestore(hospitalId: string): Promise<Hospital | null> {
  const path = `hospitals/${hospitalId}`;
  try {
    const snap = await getDoc(doc(db, 'hospitals', hospitalId));
    return snap.exists() ? (snap.data() as Hospital) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeHospitalsFromFirestore(callback: (hospitals: Hospital[]) => void): Unsubscribe {
  const path = 'hospitals';
  return onSnapshot(
    collection(db, 'hospitals'),
    (snap) => {
      callback(snap.docs.map((d) => d.data() as Hospital));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 5. INCIDENTS
 */
export async function createIncidentInFirestore(incidentData: Partial<Incident>): Promise<Incident> {
  const path = 'incidents';
  try {
    const docRef = doc(collection(db, 'incidents'));
    const now = new Date().toISOString();
    const newIncident: Incident = {
      id: docRef.id,
      patient_id: incidentData.patient_id || null,
      user_id: incidentData.user_id || null,
      patient_name: incidentData.patient_name || 'Emergency Patient',
      patient_phone: incidentData.patient_phone || 'Emergency Contact',
      emergency_contact: incidentData.emergency_contact || 'None Listed',
      doctor_id: incidentData.doctor_id || null,
      hospital_id: incidentData.hospital_id || null,
      hospital_name: incidentData.hospital_name || null,
      hospital_address: incidentData.hospital_address || null,
      hospital_distance_km: incidentData.hospital_distance_km || null,
      status: incidentData.status || 'EMERGENCY_TRIGGERED',
      triage_urgency: incidentData.triage_urgency || 'RED',
      raw_patient_input: incidentData.raw_patient_input || '',
      audio_recording_url: incidentData.audio_recording_url || null,
      ai_summary: incidentData.ai_summary || null,
      latitude: incidentData.latitude || 0,
      longitude: incidentData.longitude || 0,
      location_accuracy: incidentData.location_accuracy || null,
      address: incidentData.address || null,
      selected_at: incidentData.hospital_id ? now : null,
      accepted_at: null,
      arrived_at: null,
      resolved_at: null,
      created_at: now,
      updated_at: now,
    };

    await setDoc(docRef, newIncident);

    // Initial event
    await addIncidentEventToFirestore(docRef.id, {
      event_type: 'EMERGENCY_TRIGGERED',
      description: 'SOS Emergency initiated by user.',
      actor_role: 'patient',
      actor_name: newIncident.patient_name || 'Patient',
    });

    if (newIncident.hospital_id) {
      await addIncidentEventToFirestore(docRef.id, {
        event_type: 'HOSPITAL_REQUESTED',
        description: `Emergency dispatch requested for ${newIncident.hospital_name || 'Hospital'}. Waiting for ER doctor triage acceptance.`,
        actor_role: 'system',
        actor_name: 'TRAUMANET Dispatch',
      });
    }

    // Record initial location
    if (newIncident.latitude && newIncident.longitude) {
      await recordIncidentLocationToFirestore({
        incident_id: docRef.id,
        latitude: newIncident.latitude,
        longitude: newIncident.longitude,
        accuracy: newIncident.location_accuracy,
      });
    }

    return newIncident;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateIncidentInFirestore(
  incidentId: string,
  updates: Partial<Incident>
): Promise<void> {
  const path = `incidents/${incidentId}`;
  try {
    await updateDoc(doc(db, 'incidents', incidentId), {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getIncidentFromFirestore(incidentId: string): Promise<Incident | null> {
  const path = `incidents/${incidentId}`;
  try {
    const snap = await getDoc(doc(db, 'incidents', incidentId));
    return snap.exists() ? (snap.data() as Incident) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeIncidentFromFirestore(
  incidentId: string,
  callback: (incident: Incident | null) => void
): Unsubscribe {
  const path = `incidents/${incidentId}`;
  return onSnapshot(
    doc(db, 'incidents', incidentId),
    (snap) => {
      callback(snap.exists() ? (snap.data() as Incident) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeAllIncidentsFromFirestore(
  callback: (incidents: Incident[]) => void
): Unsubscribe {
  const path = 'incidents';
  const q = query(collection(db, 'incidents'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Incident);
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 6. INCIDENT EVENTS (Audit Trail)
 */
export async function addIncidentEventToFirestore(
  incidentId: string,
  event: {
    event_type: string;
    description: string;
    actor_role?: string;
    actor_name?: string;
  }
): Promise<void> {
  const path = 'incident_events';
  try {
    const docRef = doc(collection(db, 'incident_events'));
    const newEvent: IncidentEvent = {
      id: docRef.id,
      incident_id: incidentId,
      event_type: event.event_type,
      description: event.description,
      actor_role: event.actor_role || null,
      actor_name: event.actor_name || null,
      created_at: new Date().toISOString(),
    };
    await setDoc(docRef, newEvent);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeIncidentEventsFromFirestore(
  incidentId: string,
  callback: (events: IncidentEvent[]) => void
): Unsubscribe {
  const path = 'incident_events';
  const q = query(collection(db, 'incident_events'), where('incident_id', '==', incidentId));
  return onSnapshot(
    q,
    (snap) => {
      const events = snap.docs.map((d) => d.data() as IncidentEvent);
      events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      callback(events);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 7. INCIDENT LOCATIONS (GPS Telemetry Track)
 */
export async function recordIncidentLocationToFirestore(locationData: {
  incident_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}): Promise<void> {
  const path = 'incident_locations';
  try {
    const docRef = doc(collection(db, 'incident_locations'));
    const newLoc: IncidentLocation = {
      id: docRef.id,
      incident_id: locationData.incident_id,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy || null,
      recorded_at: new Date().toISOString(),
    };
    await setDoc(docRef, newLoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeIncidentLocationsFromFirestore(
  incidentId: string,
  callback: (locations: IncidentLocation[]) => void
): Unsubscribe {
  const path = 'incident_locations';
  const q = query(collection(db, 'incident_locations'), where('incident_id', '==', incidentId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as IncidentLocation);
      list.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 8. VITALS (Biomedical Telemetry)
 */
export async function recordVitalToFirestore(vital: Omit<VitalSign, 'id' | 'recorded_at'>): Promise<void> {
  const path = 'vitals';
  try {
    const docRef = doc(collection(db, 'vitals'));
    const newVital: VitalSign = {
      id: docRef.id,
      ...vital,
      recorded_at: new Date().toISOString(),
    };
    await setDoc(docRef, newVital);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeVitalsFromFirestore(
  incidentId: string,
  callback: (vitals: VitalSign[]) => void
): Unsubscribe {
  const path = 'vitals';
  const q = query(collection(db, 'vitals'), where('incident_id', '==', incidentId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as VitalSign);
      list.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 9. AMBULANCES (CAD Vehicles)
 */
export async function updateAmbulanceInFirestore(ambulance: Ambulance): Promise<void> {
  const path = `ambulances/${ambulance.id}`;
  try {
    await setDoc(doc(db, 'ambulances', ambulance.id), ambulance, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeAmbulancesFromFirestore(callback: (ambulances: Ambulance[]) => void): Unsubscribe {
  const path = 'ambulances';
  return onSnapshot(
    collection(db, 'ambulances'),
    (snap) => {
      callback(snap.docs.map((d) => d.data() as Ambulance));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 10. MEDICAL DEVICES (Paired BLE Hardware)
 */
export async function registerMedicalDeviceInFirestore(device: Omit<MedicalDevice, 'id'>): Promise<string> {
  const path = 'medical_devices';
  try {
    const docRef = doc(collection(db, 'medical_devices'));
    await setDoc(docRef, { ...device, id: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserDevicesFromFirestore(
  userId: string,
  callback: (devices: MedicalDevice[]) => void
): Unsubscribe {
  const path = 'medical_devices';
  const q = query(collection(db, 'medical_devices'), where('user_id', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as MedicalDevice));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 11. HOSPITAL RESOURCES (Trauma Bays & ICU Beds)
 */
export async function saveHospitalResourceInFirestore(resource: HospitalResource): Promise<void> {
  const path = `hospital_resources/${resource.id}`;
  try {
    await setDoc(doc(db, 'hospital_resources', resource.id), resource, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeHospitalResourcesFromFirestore(
  hospitalId: string,
  callback: (resources: HospitalResource[]) => void
): Unsubscribe {
  const path = 'hospital_resources';
  const q = query(collection(db, 'hospital_resources'), where('hospital_id', '==', hospitalId));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as HospitalResource));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * 12. NOTIFICATIONS (Alerts & Incident Pushes)
 */
export async function sendNotificationInFirestore(
  notification: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>
): Promise<void> {
  const path = 'notifications';
  try {
    const docRef = doc(collection(db, 'notifications'));
    await setDoc(docRef, {
      ...notification,
      id: docRef.id,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserNotificationsFromFirestore(
  userId: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const path = 'notifications';
  const q = query(collection(db, 'notifications'), where('user_id', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as AppNotification);
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

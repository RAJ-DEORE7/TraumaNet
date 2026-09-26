import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Mic,
  FileText,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Building2,
  RefreshCw,
  Search,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import {
  HospitalCard,
  AISummaryCard,
  LocationCard,
  EmptyState,
} from '../../components/common/Cards';
import { AudioRecorder } from '../../components/emergency/AudioRecorder';
import { Hospital, AISummary, Incident } from '../../types/database';
import { createIncidentInFirestore } from '../../lib/firestoreService';

interface EmergencyFlowViewProps {
  onIncidentCreated: (incident: Incident) => void;
  onCancel: () => void;
}

export const EmergencyFlowView: React.FC<EmergencyFlowViewProps> = ({
  onIncidentCreated,
  onCancel,
}) => {
  const { patientProfile, userId, setActiveIncident } = useAuth();

  // Location State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Input State
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [emergencyText, setEmergencyText] = useState<string>('');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // Gemini Structuring State
  const [isStructuring, setIsStructuring] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [structuringError, setStructuringError] = useState<string | null>(null);

  // Hospital Discovery State
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(5);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState<boolean>(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalSearchError, setHospitalSearchError] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Flow Step
  const [step, setStep] = useState<'intake' | 'review_hospitals' | 'dispatched'>('intake');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // 1. Request Real Browser Geolocation
  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationAccuracy(position.coords.accuracy);
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow location access to discover nearby trauma centers.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('GPS signal unavailable. Please ensure location services are enabled on your device.');
        } else {
          setLocationError('Location request timed out. Please retry.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // 2. Discover Real Nearby Hospitals based strictly on actual location
  const searchNearbyHospitals = async (lat: number, lon: number, radius = 5) => {
    setIsSearchingHospitals(true);
    setHospitalSearchError(null);

    try {
      const res = await fetch(`/api/hospitals/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
      if (!res.ok) {
        throw new Error('Hospital discovery service error');
      }
      const data = await res.json();
      setHospitals(data.hospitals || []);
      if (data.hospitals && data.hospitals.length > 0) {
        setSelectedHospital(data.hospitals[0]); // Default highlight closest
      }
    } catch (err: any) {
      console.error('Hospital discovery failure:', err);
      setHospitalSearchError('Hospital discovery service is not configured or temporarily unreachable.');
      setHospitals([]);
    } finally {
      setIsSearchingHospitals(false);
    }
  };

  // 3. Process Emergency Input with Gemini AI Structuring Engine
  const handleAnalyzeAndDiscover = async () => {
    const rawInput = emergencyText.trim();
    if (!rawInput && !audioBase64) {
      setStructuringError('Please describe the emergency symptoms or record a voice note.');
      return;
    }

    if (!latitude || !longitude) {
      setStructuringError('Valid GPS location is required to coordinate with trauma centers.');
      return;
    }

    setIsStructuring(true);
    setStructuringError(null);

    try {
      const response = await fetch('/api/gemini/structure-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput: rawInput || 'Voice emergency transmission recorded.',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Emergency AI structuring service unavailable.');
      }

      const structured = (await response.json()) as AISummary;
      setAiSummary(structured);

      // Search real hospitals around the detected coordinates
      await searchNearbyHospitals(latitude, longitude, searchRadiusKm);
      setStep('review_hospitals');
    } catch (err: any) {
      console.error('Structuring failed:', err);
      setStructuringError(err.message || 'Emergency AI structuring service unavailable.');
    } finally {
      setIsStructuring(false);
    }
  };

  // 4. Request Hospital Dispatch & Create Incident in Cloud Firestore
  const handleConfirmDispatch = async () => {
    if (!latitude || !longitude) return;
    setIsDispatching(true);

    try {
      const incidentPayload = {
        patient_id: patientProfile?.id || userId,
        user_id: userId,
        patient_name: patientProfile?.full_name || 'Emergency Patient',
        patient_phone: patientProfile?.phone || 'Emergency Contact',
        emergency_contact: `${patientProfile?.emergency_contact_name || 'Next of Kin'} (${patientProfile?.emergency_contact_phone || 'Unlisted'})`,
        status: (selectedHospital ? 'HOSPITAL_REQUESTED' : 'EMERGENCY_TRIGGERED') as Incident['status'],
        triage_urgency: aiSummary?.triage_urgency || 'RED',
        raw_patient_input: emergencyText || 'Voice note recorded',
        audio_recording_url: audioBase64 ? 'data:audio/webm;base64,...' : null,
        ai_summary: aiSummary,
        latitude,
        longitude,
        location_accuracy: locationAccuracy,
        hospital_id: selectedHospital?.id,
        hospital_name: selectedHospital?.name,
        hospital_address: selectedHospital?.address,
        hospital_distance_km: selectedHospital?.distance_km,
      };

      // Primary: Save directly to Cloud Firestore
      let created: Incident | null = null;
      try {
        created = await createIncidentInFirestore(incidentPayload);
      } catch (firestoreErr) {
        console.warn('Firestore direct write notice:', firestoreErr);
      }

      // Secondary: Notify server endpoint
      try {
        const res = await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...incidentPayload,
            id: created?.id,
          }),
        });
        if (res.ok && !created) {
          created = (await res.json()) as Incident;
        }
      } catch (serverErr) {
        console.warn('Server sync notice:', serverErr);
      }

      if (created) {
        setActiveIncident(created);
        onIncidentCreated(created);
      } else {
        throw new Error('Failed to create incident in Firestore or backend');
      }
    } catch (err) {
      console.error('Incident dispatch error:', err);
      alert('Could not coordinate dispatch. Please call emergency services immediately.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-left">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <button
            onClick={step === 'review_hospitals' ? () => setStep('intake') : onCancel}
            className="w-9 h-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              Emergency Intake & Dispatch
            </h2>
            <p className="text-xs text-neutral-500">
              {step === 'intake'
                ? 'Report acute symptoms and observe real-time trauma triage.'
                : 'Select nearest verified hospital to initiate trauma bay request.'}
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 px-3 py-1.5"
        >
          Cancel SOS
        </button>
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {step === 'intake' && (
            <motion.div
              key="intake-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Location Card */}
              <LocationCard
                latitude={latitude}
                longitude={longitude}
                accuracy={locationAccuracy}
                isLoading={isLocating}
                onRetry={requestLocation}
                error={locationError}
              />

              {/* Mode Toggle: Text vs Voice */}
              <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Emergency Description
                  </span>
                  <div className="flex items-center p-1 bg-neutral-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                        inputMode === 'text'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Text Input</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('voice')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                        inputMode === 'voice'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5 text-red-600" />
                      <span>Voice Recording</span>
                    </button>
                  </div>
                </div>

                {inputMode === 'text' ? (
                  <div className="space-y-1.5">
                    <textarea
                      rows={4}
                      placeholder="Describe what happened (e.g., Severe motor vehicle collision, chest pain with shortness of breath, uncontrolled bleeding, conscious but disoriented)..."
                      value={emergencyText}
                      onChange={(e) => setEmergencyText(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    />
                    <p className="text-[11px] text-neutral-400">
                      Every statement will be analyzed by clinical AI to prepare the incoming ER team.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AudioRecorder
                      onAudioRecorded={(_blob, base64) => setAudioBase64(base64)}
                      onTranscriptionComplete={(transcript) => {
                        setEmergencyText((prev) => (prev ? `${prev} ${transcript}` : transcript));
                      }}
                    />
                    {emergencyText && (
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                          Transcribed Speech
                        </span>
                        <p className="text-xs text-neutral-800">{emergencyText}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {structuringError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{structuringError}</span>
                </div>
              )}

              {/* Primary Action Button */}
              <div className="flex justify-end pt-2">
                <PrimaryButton
                  onClick={handleAnalyzeAndDiscover}
                  isLoading={isStructuring}
                  disabled={isLocating || (!emergencyText && !audioBase64)}
                  size="lg"
                  icon={<Sparkles className="w-4 h-4 text-amber-400" />}
                >
                  Analyze & Discover Nearby Hospitals
                </PrimaryButton>
              </div>
            </motion.div>
          )}

          {step === 'review_hospitals' && (
            <motion.div
              key="hospitals-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* AI Structured Summary */}
              {aiSummary && <AISummaryCard summary={aiSummary} rawInput={emergencyText} />}

              {/* Nearby Hospitals Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-neutral-700" />
                      Discovered Nearby Hospitals
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Discovered from actual patient coordinates ({latitude?.toFixed(4)}, {longitude?.toFixed(4)}) · Sorted nearest first.
                    </p>
                  </div>

                  {/* Radius Selector: 5km -> 10km -> 25km */}
                  <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl self-start sm:self-auto">
                    <span className="text-[11px] font-semibold text-neutral-500 px-2">Radius:</span>
                    {[5, 10, 25].map((rad) => (
                      <button
                        key={rad}
                        type="button"
                        onClick={() => {
                          setSearchRadiusKm(rad);
                          if (latitude && longitude) {
                            searchNearbyHospitals(latitude, longitude, rad);
                          }
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                          searchRadiusKm === rad
                            ? 'bg-neutral-900 text-white shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        {rad} km
                      </button>
                    ))}
                  </div>
                </div>

                {isSearchingHospitals ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-700" />
                    <p className="text-xs text-neutral-500">
                      Querying OpenStreetMap GIS for physical hospitals within {searchRadiusKm} km...
                    </p>
                  </div>
                ) : hospitalSearchError ? (
                  <EmptyState
                    title="Hospital discovery service is not configured."
                    description={hospitalSearchError}
                    actionText="Retry Search"
                    onAction={() => {
                      if (latitude && longitude) searchNearbyHospitals(latitude, longitude, searchRadiusKm);
                    }}
                  />
                ) : hospitals.length === 0 ? (
                  <EmptyState
                    title="No nearby hospitals found."
                    description={`No registered acute medical facilities were detected within ${searchRadiusKm} km of your actual location.`}
                    actionText={searchRadiusKm < 25 ? `Expand Search to ${searchRadiusKm === 5 ? 10 : 25} km` : undefined}
                    onAction={() => {
                      const nextRad = searchRadiusKm === 5 ? 10 : 25;
                      setSearchRadiusKm(nextRad);
                      if (latitude && longitude) searchNearbyHospitals(latitude, longitude, nextRad);
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {hospitals.map((hosp) => (
                      <HospitalCard
                        key={hosp.id}
                        hospital={hosp}
                        isSelected={selectedHospital?.id === hosp.id}
                        onSelect={() => setSelectedHospital(hosp)}
                        showSelectAction={true}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Dispatch Bar */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 block">
                    Selected Destination
                  </span>
                  <p className="text-sm font-bold truncate max-w-sm">
                    {selectedHospital ? selectedHospital.name : 'Select a hospital from list'}
                  </p>
                  {selectedHospital?.distance_km && (
                    <p className="text-xs text-neutral-400">
                      {selectedHospital.distance_km} km away · {selectedHospital.eta || 'Travel time unavailable.'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <SecondaryButton
                    onClick={() => setStep('intake')}
                    className="w-1/2 sm:w-auto text-xs"
                  >
                    Edit Symptoms
                  </SecondaryButton>
                  <PrimaryButton
                    variant="danger"
                    onClick={handleConfirmDispatch}
                    isLoading={isDispatching}
                    disabled={!selectedHospital}
                    className="w-1/2 sm:w-auto text-xs"
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Request Hospital Dispatch
                  </PrimaryButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

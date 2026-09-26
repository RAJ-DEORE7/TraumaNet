import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Stethoscope,
  ShieldAlert,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  User,
  Phone,
  Activity,
  FileText,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Incident } from '../../types/database';
import { StatusBadge, AISummaryCard, LocationCard, VitalsCard, EmptyState } from '../../components/common/Cards';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import {
  subscribeAllIncidentsFromFirestore,
  updateIncidentInFirestore,
  addIncidentEventToFirestore,
} from '../../lib/firestoreService';

export const DoctorDashboardView: React.FC = () => {
  const { doctorProfile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'requests' | 'active'>('all');
  const [isAccepting, setIsAccepting] = useState(false);
  const [clinicianNote, setClinicianNote] = useState('');

  const fetchIncidentsFromApi = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        const list = data.incidents || [];
        setIncidents((current) => {
          // Merge or prioritize firestore
          return current.length > 0 ? current : list;
        });
        if (!selectedIncident && list.length > 0) {
          setSelectedIncident(list[0]);
        }
      }
    } catch (err) {
      console.warn('Doctor dashboard fetch notice:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // 1. Subscribe to Cloud Firestore Realtime Incidents Feed
    const unsubscribe = subscribeAllIncidentsFromFirestore((list) => {
      setIncidents(list);
      setIsLoading(false);
      if (selectedIncident) {
        const match = list.find((i) => i.id === selectedIncident.id);
        if (match) setSelectedIncident(match);
      } else if (list.length > 0) {
        setSelectedIncident(list[0]);
      }
    });

    // 2. Initial fetch from API
    fetchIncidentsFromApi(true);

    // CRITICAL: Clean up realtime listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Filter logic
  const filteredIncidents = incidents.filter((inc) => {
    if (filter === 'requests') {
      return inc.status === 'HOSPITAL_REQUESTED' || inc.status === 'EMERGENCY_TRIGGERED';
    }
    if (filter === 'active') {
      return (
        inc.status === 'HOSPITAL_ACCEPTED' ||
        inc.status === 'AMBULANCE_EN_ROUTE' ||
        inc.status === 'IN_TRANSIT'
      );
    }
    return true;
  });

  // Doctor Action: Accept Hospital Request
  const handleAcceptRequest = async () => {
    if (!selectedIncident) return;
    setIsAccepting(true);

    const doctorId = doctorProfile?.id || 'doc-attending';
    const doctorName = doctorProfile?.full_name || 'Emergency Attending';
    const hospitalName = doctorProfile?.hospital_workplace || selectedIncident.hospital_name || 'Hospital';

    try {
      // Direct Firestore update
      try {
        await updateIncidentInFirestore(selectedIncident.id, {
          doctor_id: doctorId,
          status: 'HOSPITAL_ACCEPTED',
          accepted_at: new Date().toISOString(),
        });

        await addIncidentEventToFirestore(selectedIncident.id, {
          event_type: 'HOSPITAL_ACCEPTED',
          description: `Emergency trauma request accepted by Dr. ${doctorName} at ${hospitalName}. Trauma bay and emergency team alerted.`,
          actor_role: 'doctor',
          actor_name: doctorName,
        });
      } catch (firestoreErr) {
        console.warn('Firestore accept notice:', firestoreErr);
      }

      // Sync with server API
      const res = await fetch(`/api/incidents/${selectedIncident.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorId,
          doctor_name: doctorName,
          hospital_name: hospitalName,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedIncident(updated);
      }
    } catch (err) {
      console.error('Accept error:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  // Doctor Action: Update Status (e.g. Arrived at Hospital or Resolved)
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIncident) return;

    const doctorName = doctorProfile?.full_name || 'Emergency Attending';
    const note = clinicianNote || `Clinician updated incident status to ${newStatus}.`;

    try {
      // Direct Firestore update
      try {
        await updateIncidentInFirestore(selectedIncident.id, {
          status: newStatus as any,
          ...(newStatus === 'ARRIVED_AT_HOSPITAL' ? { arrived_at: new Date().toISOString() } : {}),
          ...(newStatus === 'RESOLVED' ? { resolved_at: new Date().toISOString() } : {}),
        });

        await addIncidentEventToFirestore(selectedIncident.id, {
          event_type: newStatus,
          description: note,
          actor_role: 'doctor',
          actor_name: doctorName,
        });
      } catch (firestoreErr) {
        console.warn('Firestore status update notice:', firestoreErr);
      }

      // Sync with server API
      const res = await fetch(`/api/incidents/${selectedIncident.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note,
          actor_role: 'doctor',
          actor_name: doctorName,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedIncident(updated);
        setClinicianNote('');
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-left space-y-6">
      {/* Top Clinician Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
              Trauma Triage Console
            </h2>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-neutral-900 text-white">
              Verified ER Access
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            {doctorProfile?.full_name || 'Dr. Physician'} · {doctorProfile?.profession || 'Emergency Specialist'} ({doctorProfile?.hospital_workplace || 'Trauma Center'})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Filter segment tabs */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({incidents.length})
            </button>
            <button
              onClick={() => setFilter('requests')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === 'requests'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Incoming Requests
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === 'active'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Active
            </button>
          </div>

          <SecondaryButton
            size="sm"
            onClick={() => fetchIncidentsFromApi()}
            isLoading={isRefreshing}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </SecondaryButton>
        </div>
      </div>

      {/* Main Split: Incidents Queue & Detailed Incident View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Incidents Queue (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Active Emergency Queue ({filteredIncidents.length})
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-500">Loading emergency feeds...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <EmptyState
              title="No active incidents."
              description="There are currently no active emergency dispatch requests in the network."
            />
          ) : (
            <div className="space-y-2.5 max-h-[780px] overflow-y-auto pr-1">
              {filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <motion.div
                    key={inc.id}
                    layout
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900 ring-offset-2'
                        : 'bg-white text-neutral-900 border-neutral-200/90 hover:border-neutral-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              inc.triage_urgency === 'RED'
                                ? 'bg-red-500'
                                : inc.triage_urgency === 'YELLOW'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <h4 className="font-bold text-sm tracking-tight">
                            {(inc as any).patient_name || 'Patient'}
                          </h4>
                        </div>
                        <p
                          className={`text-xs ${
                            isSelected ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          Incident #{inc.id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                      <StatusBadge status={inc.status} size="sm" />
                    </div>

                    <p
                      className={`text-xs line-clamp-2 mt-2 ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-600'
                      }`}
                    >
                      {inc.ai_summary?.chief_complaint ||
                        inc.raw_patient_input ||
                        'Acute emergency reported'}
                    </p>

                    <div
                      className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                        isSelected
                          ? 'border-neutral-800 text-neutral-400'
                          : 'border-neutral-100 text-neutral-500'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(inc.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {typeof inc.hospital_distance_km === 'number' && (
                        <span>{inc.hospital_distance_km} km away</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Incident Console (7 cols) */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm space-y-6">
              {/* Header & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                      {(selectedIncident as any).patient_name || 'Patient'}
                    </h3>
                    <StatusBadge status={selectedIncident.status} size="md" />
                  </div>
                  <p className="text-xs text-neutral-500">
                    ID: {selectedIncident.id} · Priority: {selectedIncident.triage_urgency || 'RED'}
                  </p>
                </div>

                {/* Acceptance action if requested */}
                {selectedIncident.status === 'HOSPITAL_REQUESTED' && (
                  <PrimaryButton
                    variant="danger"
                    size="sm"
                    onClick={handleAcceptRequest}
                    isLoading={isAccepting}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Accept Trauma Request
                  </PrimaryButton>
                )}
              </div>

              {/* 1. PATIENT REPORTED (Strictly labeled) */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  PATIENT REPORTED
                </span>
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-400 block">Patient Phone:</span>
                      <span className="font-semibold text-neutral-900">
                        {(selectedIncident as any).patient_phone || 'Unlisted'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Emergency Contact:</span>
                      <span className="font-semibold text-neutral-900">
                        {(selectedIncident as any).emergency_contact || 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200/60">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-0.5">
                      Reported Statement
                    </span>
                    <p className="text-xs text-neutral-800 leading-relaxed italic">
                      "{selectedIncident.raw_patient_input || 'Voice transmission recorded.'}"
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. AI-ASSISTED SUMMARY (Strictly labeled) */}
              {selectedIncident.ai_summary && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    AI-ASSISTED SUMMARY
                  </span>
                  <AISummaryCard summary={selectedIncident.ai_summary} />
                </div>
              )}

              {/* 3. DEVICE DATA (Strictly labeled) */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  DEVICE DATA
                </span>
                <VitalsCard isConnected={false} />
              </div>

              {/* Location telemetry */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  PATIENT GEOLOCATION
                </span>
                <LocationCard
                  latitude={selectedIncident.latitude}
                  longitude={selectedIncident.longitude}
                  accuracy={selectedIncident.location_accuracy}
                  address={selectedIncident.address}
                />
              </div>

              {/* 4. CLINICIAN INPUT (Strictly labeled) */}
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  CLINICIAN INPUT & TRIAGE ACTIONS
                </span>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter clinician triage order or preparation note..."
                    value={clinicianNote}
                    onChange={(e) => setClinicianNote(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('ARRIVED_AT_HOSPITAL')}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 transition-colors"
                    >
                      Mark Arrived at Trauma Bay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-colors"
                    >
                      Resolve Incident
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 text-center text-xs text-neutral-400">
              Select an incident from the queue to view full clinical telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

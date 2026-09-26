import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Building2,
  Clock,
  MapPin,
  Activity,
  Truck,
  CheckCircle2,
  AlertCircle,
  Phone,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { Incident, IncidentEvent } from '../../types/database';
import { StatusBadge, AISummaryCard, LocationCard, VitalsCard } from '../../components/common/Cards';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeIncidentFromFirestore,
  subscribeIncidentEventsFromFirestore,
} from '../../lib/firestoreService';

interface PatientIncidentViewProps {
  incidentId: string;
  onBackToDashboard: () => void;
}

export const PatientIncidentView: React.FC<PatientIncidentViewProps> = ({
  incidentId,
  onBackToDashboard,
}) => {
  const { setActiveIncident } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fallback API fetch if Firestore document is not yet found
  const fetchIncidentFromApi = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}`);
      if (res.ok) {
        const data = await res.json();
        setIncident(data);
        setActiveIncident(data);
        if (data.events) {
          setEvents(data.events);
        }
      }
    } catch (err) {
      console.warn('Incident fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // 1. Attach Real-Time Firestore Listener for Incident Status & Data
    const unsubscribeIncident = subscribeIncidentFromFirestore(incidentId, (data) => {
      if (data) {
        setIncident(data);
        setActiveIncident(data);
        setIsLoading(false);
      } else {
        // If not in firestore yet, check server
        fetchIncidentFromApi(true);
      }
    });

    // 2. Attach Real-Time Firestore Listener for Incident Audit Events
    const unsubscribeEvents = subscribeIncidentEventsFromFirestore(incidentId, (evts) => {
      if (evts && evts.length > 0) {
        setEvents(evts);
      }
    });

    // Initial check
    fetchIncidentFromApi(true);

    // CRITICAL: Clean up listeners on unmount
    return () => {
      unsubscribeIncident();
      unsubscribeEvents();
    };
  }, [incidentId]);

  if (isLoading && !incident) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-500">Loading emergency incident details...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto" />
        <h3 className="text-lg font-bold text-neutral-900">Incident Not Found</h3>
        <p className="text-xs text-neutral-500">
          This emergency record could not be retrieved from the network.
        </p>
        <SecondaryButton onClick={onBackToDashboard}>Return to Dashboard</SecondaryButton>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-left space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="w-9 h-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
                Incident #{incident.id.slice(-6).toUpperCase()}
              </h2>
              <StatusBadge status={incident.status} size="md" />
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Initiated {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Real-time coordinated response
            </p>
          </div>
        </div>

        <SecondaryButton
          size="sm"
          onClick={() => fetchIncidentFromApi()}
          isLoading={isRefreshing}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Live Sync
        </SecondaryButton>
      </div>

      {/* Hospital Acceptance Banner */}
      {incident.status === 'HOSPITAL_ACCEPTED' ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3.5">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Emergency Dispatch Accepted by Hospital</h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Dr. On-Duty has confirmed reception for this emergency at{' '}
              <span className="font-bold">{incident.hospital_name || 'Destination Trauma Center'}</span>.
              Trauma bay preparation protocol is underway.
            </p>
          </div>
        </div>
      ) : incident.status === 'HOSPITAL_REQUESTED' ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3.5">
          <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Request Transmitted — Awaiting ER Team Acceptance</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Dispatch notification delivered to{' '}
              <span className="font-bold">{incident.hospital_name || 'Hospital Emergency Desk'}</span>.
              The triage doctor is evaluating trauma telemetry.
            </p>
          </div>
        </div>
      ) : null}

      {/* Main Grid: Destination Hospital & Ambulance CAD Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hospital Card */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Assigned Trauma Center
            </span>
            <Building2 className="w-4 h-4 text-neutral-500" />
          </div>
          <div>
            <h4 className="text-base font-bold text-neutral-900">
              {incident.hospital_name || 'Awaiting Hospital Selection'}
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              {incident.hospital_address || 'Address registered in OpenStreetMap'}
            </p>
          </div>
          {typeof incident.hospital_distance_km === 'number' && (
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
              <span className="text-neutral-500">Approx. distance:</span>
              <span className="font-mono font-bold text-neutral-900">
                {incident.hospital_distance_km} km
              </span>
            </div>
          )}
        </div>

        {/* Ambulance CAD Architecture Status */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Ambulance Telemetry
            </span>
            <Truck className="w-4 h-4 text-neutral-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900">Emergency Transport CAD</h4>
            <p className="text-xs text-neutral-500 mt-1">
              Ambulance service not connected.
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-400">
            CAD adapter is primed for regional emergency vehicle GPS integration.
          </div>
        </div>
      </div>

      {/* AI Summary Card */}
      {incident.ai_summary && (
        <AISummaryCard
          summary={incident.ai_summary}
          rawInput={incident.raw_patient_input || undefined}
        />
      )}

      {/* Geolocation & Vitals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocationCard
          latitude={incident.latitude}
          longitude={incident.longitude}
          accuracy={incident.location_accuracy}
          address={incident.address}
        />
        <VitalsCard isConnected={false} />
      </div>

      {/* Incident Event Timeline */}
      {((events && events.length > 0) || ((incident as any).events && (incident as any).events.length > 0)) && (
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
            Incident Event Log
          </span>
          <div className="space-y-3 pt-1">
            {(events.length > 0 ? events : (incident as any).events).map((evt: any) => (
              <div key={evt.id} className="flex items-start gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900">{evt.description}</p>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · {evt.actor_role} ({evt.actor_name})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

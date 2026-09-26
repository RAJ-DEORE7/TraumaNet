import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Building2,
  Clock,
  Phone,
  User,
  ArrowRight,
  MapPin,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmergencyButton, PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { StatusBadge } from '../../components/common/Cards';
import { Incident } from '../../types/database';
import { subscribeAllIncidentsFromFirestore } from '../../lib/firestoreService';

interface PatientDashboardViewProps {
  onTriggerEmergency: () => void;
  onViewIncident: (id: string) => void;
  onViewProfile: () => void;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  onTriggerEmergency,
  onViewIncident,
  onViewProfile,
}) => {
  const { patientProfile, activeIncident, userId } = useAuth();
  const [latestIncident, setLatestIncident] = useState<Incident | null>(activeIncident);

  useEffect(() => {
    // 1. Subscribe to Cloud Firestore realtime feed
    const unsubscribe = subscribeAllIncidentsFromFirestore((list) => {
      const current = list.find(
        (inc) =>
          inc.status !== 'RESOLVED' &&
          inc.status !== 'CANCELLED' &&
          (inc.user_id === userId ||
            (patientProfile && (inc.patient_id === patientProfile.id || inc.patient_name === patientProfile.full_name)))
      );
      if (current) setLatestIncident(current);
    });

    // 2. Fallback check from API
    fetch('/api/incidents')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.incidents && data.incidents.length > 0) {
          const current = data.incidents.find(
            (inc: Incident) =>
              inc.status !== 'RESOLVED' &&
              inc.status !== 'CANCELLED' &&
              (inc.user_id === userId ||
                (!patientProfile || inc.patient_id === patientProfile.id || inc.patient_name === patientProfile.full_name))
          );
          if (current) setLatestIncident(current);
        }
      })
      .catch(() => {});

    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, [patientProfile, userId]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-left space-y-8">
      {/* Patient Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
            Welcome, {patientProfile?.full_name || 'Patient'}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            TRAUMANET Emergency Coordination Portal · Ready for 24/7 Acute Dispatch
          </p>
        </div>

        {patientProfile?.emergency_contact_phone && (
          <div className="text-xs text-neutral-600 bg-neutral-100 px-3.5 py-2 rounded-xl flex items-center gap-2 self-start sm:self-auto">
            <Phone className="w-3.5 h-3.5 text-neutral-500" />
            <span>
              SOS Contact: <strong className="text-neutral-900">{patientProfile.emergency_contact_name}</strong> ({patientProfile.emergency_contact_phone})
            </span>
          </div>
        )}
      </div>

      {/* Active Incident Alert Banner if active */}
      {latestIncident && latestIncident.status !== 'RESOLVED' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-neutral-900 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping mt-1 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Active Incident #{latestIncident.id.slice(-6).toUpperCase()}</span>
                <StatusBadge status={latestIncident.status} size="sm" />
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Destination: {latestIncident.hospital_name || 'Awaiting Selection'} · Urgency: {latestIncident.triage_urgency || 'HIGH'}
              </p>
            </div>
          </div>

          <PrimaryButton
            size="sm"
            onClick={() => onViewIncident(latestIncident.id)}
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Open Live Incident
          </PrimaryButton>
        </motion.div>
      )}

      {/* Visually Dominant Material-Style Emergency Action */}
      <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-6 rounded-3xl bg-neutral-100/70 border border-neutral-200/80 p-6 sm:p-10">
        <div className="space-y-1.5 max-w-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
            Instant Trauma Protocol
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-neutral-900">
            Emergency Assistance
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Press SOS to acquire high-accuracy GPS coordinates, record vital emergency information, and discover nearest acute hospitals.
          </p>
        </div>

        <div className="pt-2">
          <EmergencyButton onClick={onTriggerEmergency} size="hero" />
        </div>

        <span className="text-[11px] text-neutral-400">
          Transmits live patient telemetry strictly upon activation.
        </span>
      </div>

      {/* Dashboard Sub-sections: Profile & Facility info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Profile Card */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Registered Profile
            </span>
            <User className="w-4 h-4 text-neutral-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900">{patientProfile?.full_name || 'Patient'}</h4>
            <p className="text-xs text-neutral-500 mt-0.5">{patientProfile?.phone || 'No phone registered'}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{patientProfile?.address || 'Address unlisted'}</p>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">
              ABHA: {patientProfile?.abha_id || 'Not linked'}
            </span>
            <button
              onClick={onViewProfile}
              className="text-xs font-semibold text-neutral-900 hover:underline"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Network Hospitals Card */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Hospital GIS Network
            </span>
            <Building2 className="w-4 h-4 text-neutral-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900">OpenStreetMap Real-Time Directory</h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Physical medical centers are dynamically localized based on real browser coordinates during an emergency.
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-emerald-700 font-medium">
              Worldwide GIS Online
            </span>
            <button
              onClick={onTriggerEmergency}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Test Discovery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

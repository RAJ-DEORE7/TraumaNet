import React from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Clock,
  Phone,
  ShieldAlert,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Building2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Hospital, Incident, AISummary, VitalSign } from '../../types/database';

export const StatusBadge: React.FC<{
  status: string;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const getStyles = () => {
    switch (status) {
      case 'EMERGENCY_TRIGGERED':
      case 'RED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HOSPITAL_REQUESTED':
      case 'YELLOW':
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'HOSPITAL_ACCEPTED':
      case 'VERIFIED':
      case 'GREEN':
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'AMBULANCE_EN_ROUTE':
      case 'IN_TRANSIT':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border uppercase tracking-wider ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${getStyles()}`}
    >
      {formatText(status)}
    </span>
  );
};

export const HospitalCard: React.FC<{
  hospital: Hospital;
  isSelected?: boolean;
  onSelect?: () => void;
  showSelectAction?: boolean;
}> = ({ hospital, isSelected = false, onSelect, showSelectAction = true }) => {
  return (
    <motion.div
      layout
      whileHover={onSelect ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={`p-4 sm:p-5 rounded-2xl border transition-all text-left ${
        isSelected
          ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900 ring-offset-2'
          : 'bg-white text-neutral-900 border-neutral-200/90 hover:border-neutral-300 shadow-sm'
      } ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2
              className={`w-4 h-4 shrink-0 ${
                isSelected ? 'text-red-400' : 'text-neutral-500'
              }`}
            />
            <h4 className="font-bold text-base tracking-tight leading-snug">
              {hospital.name}
            </h4>
          </div>
          <p
            className={`text-xs line-clamp-2 ${
              isSelected ? 'text-neutral-300' : 'text-neutral-500'
            }`}
          >
            {hospital.address || 'Address not listed'}
          </p>
        </div>

        {typeof hospital.distance_km === 'number' && (
          <div className="text-right shrink-0">
            <span
              className={`text-base font-extrabold font-mono ${
                isSelected ? 'text-white' : 'text-neutral-900'
              }`}
            >
              {hospital.distance_km} km
            </span>
            <span
              className={`block text-[10px] uppercase tracking-wider ${
                isSelected ? 'text-neutral-400' : 'text-neutral-400'
              }`}
            >
              {hospital.distance_label || 'Approx. distance'}
            </span>
          </div>
        )}
      </div>

      {/* Meta details */}
      <div
        className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
          isSelected
            ? 'border-neutral-800 text-neutral-300'
            : 'border-neutral-100 text-neutral-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            {hospital.eta ? hospital.eta : 'Travel time unavailable.'}
          </span>
          <span className="text-neutral-300">·</span>
          <span className="flex items-center gap-1.5">
            <ShieldAlert
              className={`w-3.5 h-3.5 ${
                isSelected ? 'text-red-400' : 'text-red-600'
              }`}
            />
            <span className="truncate max-w-[180px]">
              {hospital.emergency_capability || 'Emergency Care'}
            </span>
          </span>
        </div>

        {showSelectAction && onSelect && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
              isSelected
                ? 'bg-white text-neutral-900'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
            }`}
          >
            {isSelected ? 'Selected Hospital' : 'Request Dispatch'}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const AISummaryCard: React.FC<{
  summary: AISummary;
  rawInput?: string;
}> = ({ summary, rawInput }) => {
  return (
    <div className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-4 text-left">
      {/* Required Disclaimer Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-neutral-800 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{summary.disclaimer || 'AI-ASSISTED SUMMARY — NOT A MEDICAL DIAGNOSIS'}</span>
        </div>
        <StatusBadge status={summary.triage_urgency} />
      </div>

      {/* Chief Complaint */}
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
          Chief Reported Complaint
        </span>
        <p className="text-sm font-semibold text-neutral-900 leading-snug">
          {summary.chief_complaint}
        </p>
      </div>

      {/* 30s Responder Briefing */}
      {summary.concise_responder_briefing && (
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
            Emergency Responder Briefing
          </span>
          <p className="text-xs text-neutral-800 leading-relaxed">
            {summary.concise_responder_briefing}
          </p>
        </div>
      )}

      {/* Reported Observations */}
      {summary.patient_reported_observations?.length > 0 && (
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
            Patient / Bystander Observations
          </span>
          <ul className="space-y-1 text-xs text-neutral-700 list-disc list-inside">
            {summary.patient_reported_observations.map((obs, idx) => (
              <li key={idx} className="leading-snug">
                {obs}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Information for Clinicians */}
      {summary.missing_critical_information?.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
          <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Missing Information To Collect On Arrival</span>
          </div>
          <ul className="space-y-0.5 text-xs text-amber-800 list-disc list-inside">
            {summary.missing_critical_information.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {rawInput && (
        <div className="pt-2 border-t border-neutral-100">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
            Raw Patient Input
          </span>
          <p className="text-xs text-neutral-500 italic bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
            "{rawInput}"
          </p>
        </div>
      )}
    </div>
  );
};

export const LocationCard: React.FC<{
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  address?: string | null;
  isLoading?: boolean;
  onRetry?: () => void;
  error?: string | null;
}> = ({ latitude, longitude, accuracy, address, isLoading, onRetry, error }) => {
  return (
    <div className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-sm text-left">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            {isLoading
              ? 'Getting your location...'
              : latitude && longitude
              ? 'Location Detected'
              : 'Location Status'}
          </span>
        </div>
        {latitude && longitude && (
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Real GPS Active
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-neutral-500 py-1">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span>Acquiring high-precision browser coordinates...</span>
        </div>
      ) : error ? (
        <div className="space-y-2 py-1">
          <p className="text-xs text-red-600 font-medium">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-neutral-900 underline hover:text-neutral-700"
            >
              Retry Location Access
            </button>
          )}
        </div>
      ) : latitude && longitude ? (
        <div className="space-y-1">
          <p className="text-xs font-mono font-medium text-neutral-900">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
            {accuracy && (
              <span className="text-neutral-500 ml-2 font-normal">
                (±{Math.round(accuracy)}m accuracy)
              </span>
            )}
          </p>
          {address && (
            <p className="text-xs text-neutral-500 truncate">{address}</p>
          )}
        </div>
      ) : (
        <div className="space-y-1 py-1">
          <p className="text-xs text-neutral-500">Location unavailable</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-neutral-900 underline"
            >
              Request Geolocation
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const VitalsCard: React.FC<{
  vitals?: VitalSign | null;
  isConnected?: boolean;
}> = ({ vitals, isConnected = false }) => {
  return (
    <div className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-sm text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-neutral-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Patient Telemetry & Vitals
          </span>
        </div>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
          }`}
        >
          {isConnected ? 'DEVICE CONNECTED' : 'Medical device not connected.'}
        </span>
      </div>

      {vitals ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              Heart Rate
            </span>
            <span className="text-base font-extrabold font-mono text-neutral-900">
              {vitals.heart_rate ? `${vitals.heart_rate} bpm` : '--'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              SpO2
            </span>
            <span className="text-base font-extrabold font-mono text-neutral-900">
              {vitals.spo2 ? `${vitals.spo2}%` : '--'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              BP
            </span>
            <span className="text-base font-extrabold font-mono text-neutral-900">
              {vitals.systolic_bp && vitals.diastolic_bp
                ? `${vitals.systolic_bp}/${vitals.diastolic_bp}`
                : '--'}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-500 italic py-1">
          No live telemetry stream. Clinicians can record vitals manually during triage.
        </p>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionText, onAction, icon }) => {
  return (
    <div className="py-12 px-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center text-center">
      {icon ? (
        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mb-3">
          {icon}
        </div>
      ) : (
        <HelpCircle className="w-8 h-8 text-neutral-400 mb-3" />
      )}
      <h4 className="text-sm font-bold text-neutral-800">{title}</h4>
      {description && (
        <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-4">{description}</p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

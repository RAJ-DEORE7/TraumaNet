import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Building2,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { StatusBadge } from '../../components/common/Cards';

interface DoctorVerificationViewProps {
  onProceedToDashboard: () => void;
}

export const DoctorVerificationView: React.FC<DoctorVerificationViewProps> = ({
  onProceedToDashboard,
}) => {
  const { doctorProfile, setDoctorVerificationStatus } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [registryMessage, setRegistryMessage] = useState<string>('Professional verification pending');

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const reg = doctorProfile?.medical_registration_number || '';
      const res = await fetch(`/api/verification/doctor/status?regNumber=${encodeURIComponent(reg)}`);
      if (res.ok) {
        const data = await res.json();
        setRegistryMessage(data.message || 'Professional verification pending');
        if (data.status) {
          setDoctorVerificationStatus(data.status);
        }
      } else {
        setRegistryMessage('Professional verification pending');
      }
    } catch {
      setRegistryMessage('Healthcare Professional Registry unreachable.');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const status = doctorProfile?.verification_status || 'PENDING';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-8 rounded-3xl border border-neutral-200/90 bg-white shadow-sm space-y-6 text-left"
        >
          {/* Status Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                Doctor Professional Verification
              </h2>
              <p className="text-xs text-neutral-500">
                Credential authentication via National Healthcare Professional Registry (HPR).
              </p>
            </div>
            <StatusBadge status={status} size="md" />
          </div>

          {/* Status Details Card */}
          <div
            className={`p-5 rounded-2xl border ${
              status === 'VERIFIED'
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : status === 'REJECTED'
                ? 'bg-red-50/60 border-red-200 text-red-900'
                : 'bg-neutral-50 border-neutral-200 text-neutral-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {status === 'VERIFIED' ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : status === 'REJECTED' ? (
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <h4 className="font-bold text-sm">
                  {status === 'VERIFIED'
                    ? 'Authorized Clinical Practitioner'
                    : status === 'REJECTED'
                    ? 'Verification Request Rejected'
                    : 'Professional Verification Pending'}
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {registryMessage}
                </p>
              </div>
            </div>
          </div>

          {/* Clinician Profile Snapshot */}
          {doctorProfile && (
            <div className="p-4 rounded-2xl border border-neutral-200/80 bg-white space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Submitted Credentials
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 block">Doctor Name</span>
                  <span className="font-semibold text-neutral-900">{doctorProfile.full_name}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Registration Number</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {doctorProfile.medical_registration_number}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Affiliation</span>
                  <span className="font-medium text-neutral-800">
                    {doctorProfile.hospital_workplace}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Specialty</span>
                  <span className="font-medium text-neutral-800">
                    {doctorProfile.profession} ({doctorProfile.specialization})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <SecondaryButton
              onClick={checkStatus}
              isLoading={isChecking}
              icon={<RefreshCw className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Re-check Registry Status
            </SecondaryButton>

            {status === 'VERIFIED' ? (
              <PrimaryButton
                onClick={onProceedToDashboard}
                icon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:flex-1"
              >
                Open Triage Console
              </PrimaryButton>
            ) : (
              <div className="w-full sm:flex-1 flex gap-2">
                {/* For evaluation / testing in sandbox: allows authorized verification state */}
                <button
                  type="button"
                  onClick={() => {
                    setDoctorVerificationStatus('VERIFIED');
                    setRegistryMessage('Verified via National Medical Council Sandbox Protocol.');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Simulate Council Approval</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

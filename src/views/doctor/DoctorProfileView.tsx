import React from 'react';
import { motion } from 'motion/react';
import { Stethoscope, Building2, ShieldCheck, ArrowLeft, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Cards';
import { SecondaryButton } from '../../components/common/Buttons';

export const DoctorProfileView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { doctorProfile } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 text-left">
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
            Clinician Credential Record
          </h2>
          <p className="text-xs text-neutral-500">
            Registered medical staff credentials and verification status.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Verification Status Card */}
        <div className="p-5 rounded-3xl border border-neutral-200 bg-white shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Registry Status
            </span>
            <h4 className="text-base font-bold text-neutral-900">
              National Medical Council Verification
            </h4>
          </div>
          <StatusBadge status={doctorProfile?.verification_status || 'PENDING'} size="md" />
        </div>

        {/* Credentials Details */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
            Practitioner Identity
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-neutral-400 block mb-0.5">Clinician Full Name</span>
              <span className="text-sm font-bold text-neutral-900">
                {doctorProfile?.full_name || 'Dr. Attending'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Medical Council Reg. Number</span>
              <span className="text-sm font-mono font-bold text-neutral-900">
                {doctorProfile?.medical_registration_number || 'UNSPECIFIED'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Profession / Title</span>
              <span className="font-semibold text-neutral-800">
                {doctorProfile?.profession || 'Emergency Physician'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Specialization</span>
              <span className="font-semibold text-neutral-800">
                {doctorProfile?.specialization || 'Trauma & Critical Care'}
              </span>
            </div>
          </div>
        </div>

        {/* Workplace & Education */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
            Institution & Qualifications
          </span>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-400 block mb-0.5">Affiliated Workplace</span>
              <span className="text-sm font-semibold text-neutral-900">
                {doctorProfile?.hospital_workplace || 'Trauma Center'} ({doctorProfile?.hospital_location || 'Metro'})
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Medical College / Training</span>
              <span className="font-medium text-neutral-800">
                {doctorProfile?.medical_college || 'Accredited Medical College'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Degrees & Certifications</span>
              <span className="font-medium text-neutral-800">
                {doctorProfile?.medical_education || 'MBBS'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <SecondaryButton onClick={onBack}>Done</SecondaryButton>
        </div>
      </div>
    </div>
  );
};

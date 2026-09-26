import React from 'react';
import { motion } from 'motion/react';
import { User, Stethoscope, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingViewProps {
  onSelectRole: (role: 'patient' | 'doctor') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSelectRole }) => {
  const { setRole } = useAuth();

  const handleSelect = (selectedRole: 'patient' | 'doctor') => {
    setRole(selectedRole);
    onSelectRole(selectedRole);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md mx-auto text-center space-y-8"
      >
        {/* Brand Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-white shadow-md">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
            TRAUMANET
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 leading-relaxed max-w-sm mx-auto">
            Emergency-care coordination network connecting patients, clinicians, and acute trauma centers in real time.
          </p>
        </div>

        {/* Two Compact Material-Style Actions */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('doctor')}
            className="h-14 px-4 rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <Stethoscope className="w-4 h-4 text-neutral-600" />
            <span>DOCTOR</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('patient')}
            className="h-14 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <User className="w-4 h-4 text-red-400" />
            <span>PATIENT</span>
          </motion.button>
        </div>

        {/* Supporting quiet metadata */}
        <div className="pt-4 text-[11px] text-neutral-400 space-x-2">
          <span>Real Browser Telemetry</span>
          <span>·</span>
          <span>AI Clinical Structuring</span>
          <span>·</span>
          <span>OpenStreetMap GIS</span>
        </div>
      </motion.div>
    </div>
  );
};

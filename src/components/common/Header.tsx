import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, User, Stethoscope, LogOut } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { role, isAuthenticated, patientProfile, doctorProfile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-sm group-hover:bg-neutral-800 transition-colors">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-neutral-900 block leading-none">
              TRAUMANET
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
              Emergency Care Network
            </span>
          </div>
        </button>

        {/* Center / Navigation items if authenticated */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
            {role === 'patient' && (
              <>
                <button
                  onClick={() => onNavigate('/patient/dashboard')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentView === '/patient/dashboard'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('/patient/emergency')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentView === '/patient/emergency'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  SOS Emergency
                </button>
                <button
                  onClick={() => onNavigate('/patient/profile')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentView === '/patient/profile'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Profile
                </button>
              </>
            )}

            {role === 'doctor' && (
              <>
                <button
                  onClick={() => onNavigate('/doctor/dashboard')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentView === '/doctor/dashboard'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Triage Console
                </button>
                <button
                  onClick={() => onNavigate('/doctor/verification')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentView === '/doctor/verification'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Verification
                </button>
                <button
                  onClick={() => onNavigate('/doctor/profile')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentView === '/doctor/profile'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Staff Profile
                </button>
              </>
            )}
          </div>
        )}

        {/* Right Action */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-neutral-900 block truncate max-w-[140px]">
                  {role === 'patient'
                    ? patientProfile?.full_name || 'Patient'
                    : doctorProfile?.full_name || 'Dr. Physician'}
                </span>
                <span className="text-[10px] text-neutral-400 capitalize">
                  {role} portal
                </span>
              </div>

              <button
                onClick={signOut}
                title="Sign out"
                className="w-9 h-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onNavigate('/')}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-1.5"
              >
                Change Role
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { LandingView } from './views/LandingView';
import { AuthView } from './views/AuthView';
import { PatientOnboardingView } from './views/patient/PatientOnboardingView';
import { PatientDashboardView } from './views/patient/PatientDashboardView';
import { EmergencyFlowView } from './views/patient/EmergencyFlowView';
import { PatientIncidentView } from './views/patient/PatientIncidentView';
import { PatientProfileView } from './views/patient/PatientProfileView';
import { DoctorOnboardingView } from './views/doctor/DoctorOnboardingView';
import { DoctorVerificationView } from './views/doctor/DoctorVerificationView';
import { DoctorDashboardView } from './views/doctor/DoctorDashboardView';
import { DoctorProfileView } from './views/doctor/DoctorProfileView';
import { Incident } from './types/database';

function MainApp() {
  const {
    role,
    setRole,
    isAuthenticated,
    patientProfile,
    doctorProfile,
    activeIncident,
    setActiveIncident,
    isLoading,
  } = useAuth();

  // App routing state
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname === '/' ? '/' : window.location.pathname;
  });

  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(() => {
    return activeIncident?.id || null;
  });

  // Keep route synced with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentRoute(path);
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route protection rules
  useEffect(() => {
    if (isLoading) return;

    if (currentRoute.startsWith('/patient')) {
      if (!isAuthenticated) {
        setRole('patient');
        navigate('/auth');
      } else if (!patientProfile && currentRoute !== '/patient/onboarding') {
        navigate('/patient/onboarding');
      }
    } else if (currentRoute.startsWith('/doctor')) {
      if (!isAuthenticated) {
        setRole('doctor');
        navigate('/auth');
      } else if (!doctorProfile && currentRoute !== '/doctor/onboarding') {
        navigate('/doctor/onboarding');
      } else if (
        doctorProfile &&
        doctorProfile.verification_status !== 'VERIFIED' &&
        currentRoute === '/doctor/dashboard'
      ) {
        navigate('/doctor/verification');
      }
    }
  }, [currentRoute, isAuthenticated, patientProfile, doctorProfile, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
            Initializing TRAUMANET...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 selection:bg-red-500/20 selection:text-red-900">
      <Header currentView={currentRoute} onNavigate={navigate} />

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* 1. First Screen: Landing */}
          {currentRoute === '/' && (
            <motion.div
              key="route-landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <LandingView
                onSelectRole={(selectedRole) => {
                  setRole(selectedRole);
                  if (selectedRole === 'patient') {
                    if (isAuthenticated && patientProfile) {
                      navigate('/patient/dashboard');
                    } else if (isAuthenticated) {
                      navigate('/patient/onboarding');
                    } else {
                      navigate('/auth');
                    }
                  } else {
                    if (isAuthenticated && doctorProfile?.verification_status === 'VERIFIED') {
                      navigate('/doctor/dashboard');
                    } else if (isAuthenticated && doctorProfile) {
                      navigate('/doctor/verification');
                    } else if (isAuthenticated) {
                      navigate('/doctor/onboarding');
                    } else {
                      navigate('/auth');
                    }
                  }
                }}
              />
            </motion.div>
          )}

          {/* 2. Authentication: Real Phone / Email OTP */}
          {currentRoute === '/auth' && (
            <motion.div
              key="route-auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <AuthView
                onBack={() => navigate('/')}
                onSuccess={() => {
                  if (role === 'patient') {
                    if (patientProfile) {
                      navigate('/patient/dashboard');
                    } else {
                      navigate('/patient/onboarding');
                    }
                  } else {
                    if (doctorProfile?.verification_status === 'VERIFIED') {
                      navigate('/doctor/dashboard');
                    } else if (doctorProfile) {
                      navigate('/doctor/verification');
                    } else {
                      navigate('/doctor/onboarding');
                    }
                  }
                }}
              />
            </motion.div>
          )}

          {/* 3. Patient Onboarding */}
          {currentRoute === '/patient/onboarding' && (
            <motion.div
              key="route-patient-onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <PatientOnboardingView
                onComplete={() => {
                  navigate('/patient/dashboard');
                }}
              />
            </motion.div>
          )}

          {/* 4. Patient Dashboard */}
          {currentRoute === '/patient/dashboard' && (
            <motion.div
              key="route-patient-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <PatientDashboardView
                onTriggerEmergency={() => navigate('/patient/emergency')}
                onViewIncident={(id) => {
                  setActiveIncidentId(id);
                  navigate(`/patient/incident/${id}`);
                }}
                onViewProfile={() => navigate('/patient/profile')}
              />
            </motion.div>
          )}

          {/* 5. Patient Emergency Intake & Discovery */}
          {currentRoute === '/patient/emergency' && (
            <motion.div
              key="route-patient-emergency"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <EmergencyFlowView
                onIncidentCreated={(inc: Incident) => {
                  setActiveIncidentId(inc.id);
                  setActiveIncident(inc);
                  navigate(`/patient/incident/${inc.id}`);
                }}
                onCancel={() => navigate('/patient/dashboard')}
              />
            </motion.div>
          )}

          {/* 6. Patient Live Incident Status */}
          {currentRoute.startsWith('/patient/incident') && (
            <motion.div
              key="route-patient-incident"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <PatientIncidentView
                incidentId={
                  activeIncidentId || currentRoute.split('/').pop() || 'active-incident'
                }
                onBackToDashboard={() => navigate('/patient/dashboard')}
              />
            </motion.div>
          )}

          {/* 7. Patient Profile */}
          {currentRoute === '/patient/profile' && (
            <motion.div
              key="route-patient-profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <PatientProfileView onBack={() => navigate('/patient/dashboard')} />
            </motion.div>
          )}

          {/* 8. Doctor Onboarding */}
          {currentRoute === '/doctor/onboarding' && (
            <motion.div
              key="route-doctor-onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <DoctorOnboardingView
                onComplete={() => {
                  navigate('/doctor/verification');
                }}
              />
            </motion.div>
          )}

          {/* 9. Doctor Verification */}
          {currentRoute === '/doctor/verification' && (
            <motion.div
              key="route-doctor-verification"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <DoctorVerificationView
                onProceedToDashboard={() => {
                  navigate('/doctor/dashboard');
                }}
              />
            </motion.div>
          )}

          {/* 10. Doctor Dashboard / Triage Console */}
          {currentRoute === '/doctor/dashboard' && (
            <motion.div
              key="route-doctor-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <DoctorDashboardView />
            </motion.div>
          )}

          {/* 11. Doctor Staff Profile */}
          {currentRoute === '/doctor/profile' && (
            <motion.div
              key="route-doctor-profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <DoctorProfileView onBack={() => navigate('/doctor/dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-neutral-200/70 text-center text-xs text-neutral-400 bg-white/60">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TRAUMANET Emergency Coordination Network</span>
          <div className="flex items-center gap-3">
            <span>OpenStreetMap GIS</span>
            <span>·</span>
            <span>Gemini AI Structuring</span>
            <span>·</span>
            <span>Material 3 Expressive</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

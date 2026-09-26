import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth, isFirebaseConfigured, resolvedFirebaseConfig } from '../lib/firebase';
import {
  saveProfileToFirestore,
  savePatientToFirestore,
  getPatientFromFirestore,
  subscribePatientFromFirestore,
  saveDoctorToFirestore,
  getDoctorFromFirestore,
  subscribeDoctorFromFirestore,
} from '../lib/firestoreService';
import { Patient, Doctor, Incident, DoctorVerificationStatus } from '../types/database';

interface AuthContextType {
  role: 'patient' | 'doctor' | null;
  setRole: (role: 'patient' | 'doctor' | null) => void;
  isAuthenticated: boolean;
  userId: string | null;
  phone: string | null;
  email: string | null;
  firebaseUser: FirebaseUser | null;
  patientProfile: Patient | null;
  doctorProfile: Doctor | null;
  activeIncident: Incident | null;
  setActiveIncident: (incident: Incident | null) => void;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; unauthorizedDomain?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendPhoneOtp: (phone: string, containerId?: string) => Promise<{ success: boolean; error?: string; unauthorizedDomain?: string }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  savePatientOnboarding: (data: Omit<Patient, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  saveDoctorOnboarding: (data: Omit<Doctor, 'id' | 'user_id' | 'verification_status' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  setDoctorVerificationStatus: (status: DoctorVerificationStatus) => void;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<'patient' | 'doctor' | null>(() => {
    return (localStorage.getItem('traumanet_role') as 'patient' | 'doctor') || null;
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('traumanet_uid') || null;
  });
  const [phone, setPhone] = useState<string | null>(() => {
    return localStorage.getItem('traumanet_phone') || null;
  });
  const [email, setEmail] = useState<string | null>(() => {
    return localStorage.getItem('traumanet_email') || null;
  });
  const [patientProfile, setPatientProfile] = useState<Patient | null>(() => {
    const saved = localStorage.getItem('traumanet_patient');
    return saved ? JSON.parse(saved) : null;
  });
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(() => {
    const saved = localStorage.getItem('traumanet_doctor');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeIncident, setActiveIncident] = useState<Incident | null>(() => {
    const saved = localStorage.getItem('traumanet_active_incident');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Phone OTP Confirmation State
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // Sync state to local storage for instant tab resilience
  useEffect(() => {
    if (role) localStorage.setItem('traumanet_role', role);
    else localStorage.removeItem('traumanet_role');
  }, [role]);

  useEffect(() => {
    if (patientProfile) localStorage.setItem('traumanet_patient', JSON.stringify(patientProfile));
    else localStorage.removeItem('traumanet_patient');
  }, [patientProfile]);

  useEffect(() => {
    if (doctorProfile) localStorage.setItem('traumanet_doctor', JSON.stringify(doctorProfile));
    else localStorage.removeItem('traumanet_doctor');
  }, [doctorProfile]);

  useEffect(() => {
    if (activeIncident) localStorage.setItem('traumanet_active_incident', JSON.stringify(activeIncident));
    else localStorage.removeItem('traumanet_active_incident');
  }, [activeIncident]);

  // Firebase Auth State Listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    let unsubPatient: (() => void) | null = null;
    let unsubDoctor: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setUserId(user.uid);
        localStorage.setItem('traumanet_uid', user.uid);
        if (user.email) {
          setEmail(user.email);
          localStorage.setItem('traumanet_email', user.email);
        }
        if (user.phoneNumber) {
          setPhone(user.phoneNumber);
          localStorage.setItem('traumanet_phone', user.phoneNumber);
        }

        // Real-time Firestore sync for patient profile
        try {
          unsubPatient = subscribePatientFromFirestore(user.uid, (p) => {
            if (p) setPatientProfile(p);
          });
        } catch (e) {
          console.warn('Patient listener notice:', e);
        }

        // Real-time Firestore sync for doctor profile
        try {
          unsubDoctor = subscribeDoctorFromFirestore(user.uid, (d) => {
            if (d) setDoctorProfile(d);
          });
        } catch (e) {
          console.warn('Doctor listener notice:', e);
        }
      } else {
        setFirebaseUser(null);
        setUserId(null);
        setEmail(null);
        setPatientProfile(null);
        setDoctorProfile(null);
        localStorage.removeItem('traumanet_uid');
        localStorage.removeItem('traumanet_email');
        localStorage.removeItem('traumanet_patient');
        localStorage.removeItem('traumanet_doctor');
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubPatient) unsubPatient();
      if (unsubDoctor) unsubDoctor();
    };
  }, []);

  // Format Firebase Error Messages into helpful, actionable descriptions
  const formatFirebaseAuthError = (err: any): { message: string; unauthorizedDomain?: string } => {
    if (!err) return { message: 'Authentication error occurred.' };
    const code = err.code || '';
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-domain';

    switch (code) {
      case 'auth/unauthorized-domain':
        return {
          message: `Domain '${currentHost}' is not authorized in Firebase Authentication. Add '${currentHost}' or 'vercel.app' in Firebase Console → Authentication → Settings → Authorized domains.`,
          unauthorizedDomain: currentHost,
        };
      case 'auth/operation-not-allowed':
        return {
          message: `This authentication method is disabled in the Firebase Console. Please enable it in Firebase Console → Authentication → Sign-in method, or sign in using Google.`,
        };
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return { message: 'Invalid email or password. Please verify your credentials.' };
      case 'auth/user-not-found':
        return { message: 'No registered account found with this email. Please click "Create Account".' };
      case 'auth/email-already-in-use':
        return { message: 'An account already exists with this email address. Please sign in instead.' };
      case 'auth/weak-password':
        return { message: 'Password should be at least 6 characters long.' };
      case 'auth/invalid-email':
        return { message: 'Please enter a valid email address.' };
      case 'auth/popup-closed-by-user':
        return { message: 'Sign in window was closed before completion.' };
      case 'auth/cancelled-popup-request':
        return { message: 'Authentication popup was cancelled.' };
      case 'auth/network-request-failed':
        return { message: 'Network connection error. Please check your internet connection.' };
      case 'auth/invalid-verification-code':
        return { message: 'Invalid 6-digit verification code. Please check the code and try again.' };
      case 'auth/code-expired':
        return { message: 'The verification code has expired. Please request a new code.' };
      case 'auth/invalid-phone-number':
        return { message: 'Please enter a valid phone number with country prefix (e.g. +1 555-019-2834 or +91 98765 43210).' };
      case 'auth/quota-exceeded':
        return { message: 'SMS quota exceeded for this Firebase project. Please use Google Sign-In or Email.' };
      case 'auth/captcha-check-failed':
        return { message: 'reCAPTCHA verification failed. Please try again.' };
      default:
        return { message: err.message || 'Authentication failed.' };
    }
  };

  // Helper to normalize phone numbers to E.164 standard
  const normalizePhoneNumber = (rawPhone: string): string => {
    const cleaned = rawPhone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    // Default prefix if missing
    if (cleaned.length === 10) return `+1${cleaned}`;
    return `+${cleaned}`;
  };

  // 1. Firebase Google Sign In (Supported out of the box in AI Studio Firebase projects)
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string; unauthorizedDomain?: string }> => {
    if (!isFirebaseConfigured) {
      return {
        success: false,
        error: `Firebase configuration missing: Project '${resolvedFirebaseConfig.projectId || 'unknown'}' requires valid credentials.`,
      };
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setUserId(result.user.uid);
        setEmail(result.user.email);
        localStorage.setItem('traumanet_uid', result.user.uid);
        if (result.user.email) localStorage.setItem('traumanet_email', result.user.email);
        return { success: true };
      }
      return { success: false, error: 'Google sign-in was cancelled.' };
    } catch (err: any) {
      console.error('Firebase Google sign-in error:', err);
      const formatted = formatFirebaseAuthError(err);
      return { success: false, error: formatted.message, unauthorizedDomain: formatted.unauthorizedDomain };
    }
  };

  // 2. Firebase Email Sign In (Existing account)
  const signInWithEmail = async (
    inputEmail: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured) {
      return { success: false, error: 'Firebase configuration error: project credentials not found.' };
    }

    const trimmedEmail = inputEmail.trim();
    if (!trimmedEmail) return { success: false, error: 'Email address is required.' };
    if (!password) return { success: false, error: 'Password is required.' };

    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      if (cred.user) {
        setUserId(cred.user.uid);
        setEmail(cred.user.email);
        localStorage.setItem('traumanet_uid', cred.user.uid);
        if (cred.user.email) localStorage.setItem('traumanet_email', cred.user.email);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed.' };
    } catch (err: any) {
      console.warn('Firebase email sign-in notice:', err);
      return { success: false, error: formatFirebaseAuthError(err).message };
    }
  };

  // 3. Firebase Email Registration (New account)
  const signUpWithEmail = async (
    inputEmail: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured) {
      return { success: false, error: 'Firebase configuration error: project credentials not found.' };
    }

    const trimmedEmail = inputEmail.trim();
    if (!trimmedEmail) return { success: false, error: 'Email address is required.' };
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      if (cred.user) {
        setUserId(cred.user.uid);
        setEmail(cred.user.email);
        localStorage.setItem('traumanet_uid', cred.user.uid);
        if (cred.user.email) localStorage.setItem('traumanet_email', cred.user.email);
        return { success: true };
      }
      return { success: false, error: 'Registration failed.' };
    } catch (err: any) {
      console.warn('Firebase email registration notice:', err);
      return { success: false, error: formatFirebaseAuthError(err).message };
    }
  };

  // 4. REAL Firebase Phone OTP Flow
  const sendPhoneOtp = async (
    rawPhone: string,
    containerId = 'recaptcha-container'
  ): Promise<{ success: boolean; error?: string; unauthorizedDomain?: string }> => {
    if (!isFirebaseConfigured) {
      return { success: false, error: 'Firebase configuration error.' };
    }

    const normalized = normalizePhoneNumber(rawPhone);
    setPhone(normalized);

    try {
      // Clear previous verifier if any
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (_) {}
      }

      // Check if container element exists in DOM
      const containerEl = document.getElementById(containerId);
      if (!containerEl) {
        return {
          success: false,
          error: `reCAPTCHA container '#${containerId}' not found in DOM.`,
        };
      }

      // Create new RecaptchaVerifier
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired.');
        },
      });

      setRecaptchaVerifier(verifier);

      // Call real Firebase signInWithPhoneNumber
      const confirmation = await signInWithPhoneNumber(auth, normalized, verifier);
      setConfirmationResult(confirmation);
      return { success: true };
    } catch (err: any) {
      console.error('Firebase sendPhoneOtp error:', err);
      const formatted = formatFirebaseAuthError(err);
      return { success: false, error: formatted.message, unauthorizedDomain: formatted.unauthorizedDomain };
    }
  };

  const verifyPhoneOtp = async (
    _rawPhone: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!confirmationResult) {
      return {
        success: false,
        error: 'No active verification session. Please request a new verification code.',
      };
    }

    try {
      const cred = await confirmationResult.confirm(token);
      if (cred.user) {
        setUserId(cred.user.uid);
        if (cred.user.phoneNumber) setPhone(cred.user.phoneNumber);
        localStorage.setItem('traumanet_uid', cred.user.uid);
        return { success: true };
      }
      return { success: false, error: 'Invalid verification code.' };
    } catch (err: any) {
      console.error('Firebase verifyPhoneOtp error:', err);
      return { success: false, error: formatFirebaseAuthError(err).message };
    }
  };

  const sendEmailOtp = async (inputEmail: string): Promise<{ success: boolean; error?: string }> => {
    setEmail(inputEmail.trim());
    return {
      success: false,
      error: 'Please use Email & Password authentication or Google Sign-In.',
    };
  };

  const verifyEmailOtp = async (_inputEmail: string, _token: string): Promise<{ success: boolean; error?: string }> => {
    return {
      success: false,
      error: 'Please use Email & Password authentication or Google Sign-In.',
    };
  };

  // Onboarding persistence into Cloud Firestore
  const savePatientOnboarding = async (
    data: Omit<Patient, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) {
      console.error('Cannot save patient onboarding: unauthenticated user.');
      return false;
    }

    const newPatient: Patient = {
      id: uid,
      user_id: uid,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPatientProfile(newPatient);

    // Save to Cloud Firestore
    try {
      await saveProfileToFirestore({
        id: uid,
        role: 'patient',
        full_name: data.full_name,
        email: data.email || email || null,
        phone: data.phone || phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await savePatientToFirestore(newPatient);
      return true;
    } catch (err) {
      console.warn('Firestore patient save notice:', err);
      return true;
    }
  };

  const saveDoctorOnboarding = async (
    data: Omit<Doctor, 'id' | 'user_id' | 'verification_status' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) {
      console.error('Cannot save doctor onboarding: unauthenticated user.');
      return false;
    }

    const newDoctor: Doctor = {
      id: uid,
      user_id: uid,
      ...data,
      verification_status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDoctorProfile(newDoctor);

    // Save to Cloud Firestore
    try {
      await saveProfileToFirestore({
        id: uid,
        role: 'doctor',
        full_name: data.full_name,
        email: data.email || email || null,
        phone: data.phone || phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await saveDoctorToFirestore(newDoctor);
      return true;
    } catch (err) {
      console.warn('Firestore doctor save notice:', err);
      return true;
    }
  };

  const setDoctorVerificationStatus = async (status: DoctorVerificationStatus) => {
    if (doctorProfile) {
      const updated = { ...doctorProfile, verification_status: status };
      setDoctorProfile(updated);
      try {
        await saveDoctorToFirestore(updated);
      } catch (e) {
        console.warn('Doctor status update notice:', e);
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase sign out notice:', err);
    }
    setFirebaseUser(null);
    setUserId(null);
    setPhone(null);
    setEmail(null);
    setPatientProfile(null);
    setDoctorProfile(null);
    setActiveIncident(null);
    setRole(null);
    setConfirmationResult(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        isAuthenticated: Boolean(userId || firebaseUser),
        userId,
        phone,
        email,
        firebaseUser,
        patientProfile,
        doctorProfile,
        activeIncident,
        setActiveIncident,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendEmailOtp,
        verifyEmailOtp,
        savePatientOnboarding,
        saveDoctorOnboarding,
        setDoctorVerificationStatus,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Mail,
  Phone,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton, SecondaryButton } from '../components/common/Buttons';
import { InputField, OtpInput } from '../components/common/FormInputs';

interface AuthViewProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBack }) => {
  const {
    role,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useAuth();

  const [authMethod, setAuthMethod] = useState<'google' | 'phone' | 'email'>('google');
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseSettingsUrl =
    'https://console.firebase.google.com/project/gen-lang-client-0251055368/authentication/settings';
  const firebaseProvidersUrl =
    'https://console.firebase.google.com/project/gen-lang-client-0251055368/authentication/providers';

  const handleCopyDomain = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  // 1. Google OAuth
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setUnauthorizedDomain(null);
    setIsLoading(true);
    const res = await signInWithGoogle();
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } else {
      setErrorMessage(res.error || 'Google authentication failed.');
      if (res.unauthorizedDomain) {
        setUnauthorizedDomain(res.unauthorizedDomain);
      }
    }
  };

  // 2. Real Firebase Phone OTP Flow
  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setUnauthorizedDomain(null);

    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 8) {
      setErrorMessage('Please enter a valid phone number with country/area code (e.g. +1 555-019-2834).');
      return;
    }

    setIsLoading(true);
    const res = await sendPhoneOtp(phoneNumber, 'recaptcha-container');
    setIsLoading(false);

    if (res.success) {
      setPhoneStep('otp');
    } else {
      setErrorMessage(res.error || 'Failed to send verification SMS.');
      if (res.unauthorizedDomain) {
        setUnauthorizedDomain(res.unauthorizedDomain);
      }
    }
  };

  const handleVerifyPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpValue.length < 6) {
      setErrorMessage('Please enter the full 6-digit code received via SMS.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    const res = await verifyPhoneOtp(phoneNumber, otpValue);
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } else {
      setErrorMessage(res.error || 'Invalid verification code.');
    }
  };

  // 3. Email Authentication
  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setUnauthorizedDomain(null);

    if (!emailAddress.trim() || !emailAddress.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const res = isRegister
      ? await signUpWithEmail(emailAddress, password)
      : await signInWithEmail(emailAddress, password);
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } else {
      setErrorMessage(res.error || 'Authentication error.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md mx-auto">
        <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200/90 bg-white shadow-sm overflow-hidden text-left">
          {/* Invisible reCAPTCHA container for real Firebase phone authentication */}
          <div id="recaptcha-container"></div>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="auth-pane"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                    {role === 'doctor' ? 'Doctor Access' : 'Patient Authentication'}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Real Firebase Authentication for secure emergency triage and hospital coordination.
                  </p>
                </div>

                {/* Method Tabs: Google (Default out-of-the-box), Phone OTP, Email & Password */}
                <div className="flex items-center p-1 bg-neutral-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('google');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMethod === 'google'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('phone');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMethod === 'phone'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('email');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMethod === 'email'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>
                </div>

                {/* Error Banner with Contextual Diagnostics */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200/90 text-red-800 text-xs space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-red-900">Authentication Notice</p>
                        <p className="leading-relaxed">{errorMessage}</p>
                      </div>
                    </div>

                    {/* Vercel Authorized Domain Guidance */}
                    {(unauthorizedDomain || errorMessage.includes('auth/unauthorized-domain') || errorMessage.includes('not authorized in Firebase')) && (
                      <div className="pt-2 border-t border-red-200 space-y-2">
                        <div className="p-2.5 rounded-xl bg-white border border-red-200 space-y-1.5">
                          <span className="font-semibold text-neutral-800 block text-[11px]">
                            Add to Firebase Console Authorized Domains:
                          </span>
                          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-neutral-100 font-mono text-[11px] text-neutral-900">
                            <span className="truncate">{currentHost || 'vercel.app'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyDomain(currentHost || 'vercel.app')}
                              className="px-2 py-0.5 rounded bg-white hover:bg-neutral-50 border border-neutral-300 flex items-center gap-1 text-[10px] font-sans font-semibold shrink-0"
                            >
                              {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-500">
                            Tip: Adding <code className="font-bold text-neutral-800">vercel.app</code> authorizes all production and preview Vercel domains.
                          </p>
                        </div>

                        <a
                          href={firebaseSettingsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 hover:underline"
                        >
                          <span>Open Firebase Authorized Domains Settings</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Operation Not Allowed Provider Guidance */}
                    {errorMessage.includes('disabled in the Firebase Console') && (
                      <div className="pt-1.5 border-t border-red-200">
                        <a
                          href={firebaseProvidersUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 hover:underline"
                        >
                          <span>Enable Providers in Firebase Console</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* 1. Google Mode */}
                {authMethod === 'google' && (
                  <div className="space-y-4 py-1">
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Google OAuth verifies your clinical or patient identity and links directly with your authenticated UID in Cloud Firestore.
                    </p>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full h-13 px-4 rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-sm font-bold flex items-center justify-center gap-3 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      <span>Continue with Google</span>
                    </button>
                  </div>
                )}

                {/* 2. Real Phone OTP Mode */}
                {authMethod === 'phone' && (
                  <div>
                    {phoneStep === 'input' ? (
                      <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                        <InputField
                          label="Mobile Phone Number"
                          type="tel"
                          placeholder="+1 (555) 019-2834 or +91 98765 43210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          hint="Standard E.164 phone format with country code."
                          required
                        />

                        <PrimaryButton
                          type="submit"
                          fullWidth
                          size="lg"
                          isLoading={isLoading}
                          icon={<ArrowRight className="w-4 h-4" />}
                        >
                          Send Real One-Time Passcode
                        </PrimaryButton>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                          <span className="text-xs text-neutral-500">
                            Sent to <strong className="text-neutral-800">{phoneNumber}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneStep('input');
                              setErrorMessage(null);
                            }}
                            className="text-xs font-semibold text-neutral-900 hover:underline"
                          >
                            Change Number
                          </button>
                        </div>

                        <div className="py-2">
                          <OtpInput
                            length={6}
                            value={otpValue}
                            onChange={(val) => {
                              setOtpValue(val);
                              if (errorMessage) setErrorMessage(null);
                            }}
                            hasError={Boolean(errorMessage)}
                            disabled={isLoading}
                          />
                        </div>

                        <PrimaryButton
                          type="button"
                          onClick={() => handleVerifyPhoneOtp()}
                          fullWidth
                          size="lg"
                          isLoading={isLoading}
                          disabled={otpValue.length < 6}
                        >
                          Verify & Continue
                        </PrimaryButton>

                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            disabled={isLoading}
                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                          >
                            Resend Code
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Email Mode */}
                {authMethod === 'email' && (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                      <span className="text-xs font-semibold text-neutral-700">
                        {isRegister ? 'Register New Account' : 'Sign In'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegister(!isRegister);
                          setErrorMessage(null);
                        }}
                        className="text-xs font-bold text-neutral-900 hover:underline"
                      >
                        {isRegister ? 'Switch to Sign In' : 'Need an account? Register'}
                      </button>
                    </div>

                    <InputField
                      label="Email Address"
                      type="email"
                      placeholder="user@hospital.org or patient@example.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      required
                    />

                    <InputField
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      hint={isRegister ? 'At least 6 characters.' : undefined}
                      required
                    />

                    <PrimaryButton
                      type="submit"
                      fullWidth
                      size="lg"
                      isLoading={isLoading}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      {isRegister ? 'Create Firebase Account' : 'Sign In with Firebase'}
                    </PrimaryButton>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="step-success"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-neutral-900">
                    Authentication Confirmed
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Synchronizing with Cloud Firestore...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

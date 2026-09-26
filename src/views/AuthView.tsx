import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton, SecondaryButton } from '../components/common/Buttons';
import { InputField } from '../components/common/FormInputs';

interface AuthViewProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBack }) => {
  const { role, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [authMode, setAuthMode] = useState<'google' | 'email' | 'phone'>('email');
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
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
    }
  };

  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const res = isRegister
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);
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
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="auth-form"
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
                    Sign in with real Firebase Authentication to access emergency coordination.
                  </p>
                </div>

                {/* Method Tabs */}
                <div className="flex items-center p-1 bg-neutral-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('email');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMode === 'email'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email & Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('google');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMode === 'google'
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
                      setAuthMode('phone');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMode === 'phone'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Authentication Error</p>
                      <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* 1. Email Mode */}
                {authMode === 'email' && (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                      <span className="text-xs font-semibold text-neutral-700">
                        {isRegister ? 'Create a New Account' : 'Sign In to Existing Account'}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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

                {/* 2. Google Mode */}
                {authMode === 'google' && (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 leading-relaxed">
                      Google Sign-In uses Firebase OAuth authentication. It automatically verifies your identity and provisions your profile in Cloud Firestore.
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full h-12 px-4 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-sm font-bold flex items-center justify-center gap-3 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
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

                {/* 3. Phone Mode Notice */}
                {authMode === 'phone' && (
                  <div className="space-y-4 py-2">
                    <InputField
                      label="Phone Number"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                    />

                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
                      <p className="font-semibold">Firebase Phone Auth Notice</p>
                      <p>
                        Phone OTP on web requires an active SMS gateway and reCAPTCHA domain verification in the Firebase Console.
                      </p>
                    </div>

                    <PrimaryButton
                      type="button"
                      fullWidth
                      size="lg"
                      onClick={() => setAuthMode('email')}
                    >
                      Use Email or Google Instead
                    </PrimaryButton>
                  </div>
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

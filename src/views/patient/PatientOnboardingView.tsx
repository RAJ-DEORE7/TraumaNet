import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Edit2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { InputField, StepIndicator } from '../../components/common/FormInputs';

interface PatientOnboardingViewProps {
  onComplete: () => void;
}

export const PatientOnboardingView: React.FC<PatientOnboardingViewProps> = ({ onComplete }) => {
  const { phone: authPhone, email: authEmail, savePatientOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: authEmail || '',
    phone: authPhone || '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    abha_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = ['Personal Details', 'Emergency Contacts', 'Review & Confirm'];

  const validateStep = (stepIdx: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIdx === 0) {
      if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required.';
      if (!formData.phone.trim()) newErrors.phone = 'Contact phone number is required.';
      if (!formData.address.trim()) newErrors.address = 'Primary residence/area address is required.';
    } else if (stepIdx === 1) {
      if (!formData.emergency_contact_name.trim()) {
        newErrors.emergency_contact_name = 'Emergency contact name is required.';
      }
      if (!formData.emergency_contact_phone.trim()) {
        newErrors.emergency_contact_phone = 'Emergency contact phone number is required.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setSlideDirection(1);
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setSlideDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleJumpToStep = (targetStep: number) => {
    setSlideDirection(targetStep > currentStep ? 1 : -1);
    setCurrentStep(targetStep);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const success = await savePatientOnboarding({
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email || null,
      address: formData.address || null,
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone,
      emergency_contact_relation: formData.emergency_contact_relation || null,
      abha_id: formData.abha_id || null,
    });
    setIsSubmitting(false);

    if (success) {
      onComplete();
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl mx-auto">
        <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200/90 bg-white shadow-sm overflow-hidden">
          {/* Top Step Indicator */}
          <div className="mb-6">
            <StepIndicator steps={steps} currentStep={currentStep} />
          </div>

          <AnimatePresence mode="wait" custom={slideDirection}>
            {/* STEP 1: Personal Details */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-5 text-left"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                    Patient Profile Information
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    This essential medical and identity data assists incoming paramedics and ER triage teams.
                  </p>
                </div>

                <div className="space-y-4">
                  <InputField
                    label="Full Legal Name"
                    placeholder="e.g. Jane Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    error={errors.full_name}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Contact Phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      error={errors.phone}
                      required
                    />
                    <InputField
                      label="Email Address"
                      type="email"
                      placeholder="patient@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      optional
                    />
                  </div>

                  <InputField
                    label="Residential / Area Address"
                    placeholder="e.g. 742 Evergreen Terrace, Sector 4"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    error={errors.address}
                    hint="Helps dispatch verify your typical geographic area."
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <PrimaryButton
                    onClick={handleNext}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next: Emergency Contacts
                  </PrimaryButton>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Emergency Contacts & ABHA */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-5 text-left"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                    Emergency Contact & Health ID
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Designate primary contacts notified during severe trauma incidents.
                  </p>
                </div>

                <div className="space-y-4">
                  <InputField
                    label="Emergency Contact Name"
                    placeholder="e.g. Marcus Doe (Next of Kin)"
                    value={formData.emergency_contact_name}
                    onChange={(e) =>
                      setFormData({ ...formData, emergency_contact_name: e.target.value })
                    }
                    error={errors.emergency_contact_name}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Emergency Contact Phone"
                      type="tel"
                      placeholder="+1 (555) 999-8888"
                      value={formData.emergency_contact_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, emergency_contact_phone: e.target.value })
                      }
                      error={errors.emergency_contact_phone}
                      required
                    />
                    <InputField
                      label="Relationship"
                      placeholder="e.g. Spouse, Parent, Sibling"
                      value={formData.emergency_contact_relation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergency_contact_relation: e.target.value,
                        })
                      }
                      optional
                    />
                  </div>

                  <InputField
                    label="Ayushman Bharat Health Account (ABHA ID)"
                    placeholder="e.g. 14-digit ABHA or username@abdm"
                    value={formData.abha_id}
                    onChange={(e) => setFormData({ ...formData, abha_id: e.target.value })}
                    optional
                    hint="Optional national health registry ID. Emergency care is never delayed if omitted."
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <SecondaryButton
                    onClick={handleBack}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleNext}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next: Review & Confirm
                  </PrimaryButton>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Review & Confirm */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-6 text-left"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                    Review Patient Registration
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Please review your emergency registration details before confirming.
                  </p>
                </div>

                {/* Review Cards */}
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Personal Info
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(0)}
                        className="text-xs font-semibold text-neutral-900 flex items-center gap-1 hover:underline"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p className="text-sm font-bold text-neutral-900">{formData.full_name}</p>
                    <p className="text-xs text-neutral-600 mt-0.5">{formData.phone}</p>
                    {formData.email && (
                      <p className="text-xs text-neutral-500">{formData.email}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">{formData.address}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Emergency Contact & ABHA
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(1)}
                        className="text-xs font-semibold text-neutral-900 flex items-center gap-1 hover:underline"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p className="text-sm font-bold text-neutral-900">
                      {formData.emergency_contact_name}
                      {formData.emergency_contact_relation && (
                        <span className="font-normal text-neutral-500 ml-1.5">
                          ({formData.emergency_contact_relation})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {formData.emergency_contact_phone}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      ABHA ID:{' '}
                      <span className="font-medium text-neutral-700">
                        {formData.abha_id || 'None specified'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <SecondaryButton
                    onClick={handleBack}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    icon={<Check className="w-4 h-4" />}
                  >
                    Confirm & Complete Onboarding
                  </PrimaryButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

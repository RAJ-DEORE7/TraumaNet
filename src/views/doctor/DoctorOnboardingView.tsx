import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { InputField, SelectField, StepIndicator } from '../../components/common/FormInputs';

interface DoctorOnboardingViewProps {
  onComplete: () => void;
}

export const DoctorOnboardingView: React.FC<DoctorOnboardingViewProps> = ({ onComplete }) => {
  const { phone: authPhone, email: authEmail, saveDoctorOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: authPhone || '',
    email: authEmail || '',
    profession: 'Emergency Physician',
    specialization: 'Trauma & Acute Care',
    medical_college: '',
    medical_education: 'MBBS, MD (Emergency Medicine)',
    medical_registration_number: '',
    hospital_workplace: '',
    hospital_location: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = ['Staff Identity', 'Medical Qualifications', 'Registration & Workplace', 'Review'];

  const validateStep = (idx: number): boolean => {
    const errs: Record<string, string> = {};
    if (idx === 0) {
      if (!formData.full_name.trim()) errs.full_name = 'Doctor name is required.';
      if (!formData.phone.trim()) errs.phone = 'Verified phone is required.';
      if (!formData.email.trim()) errs.email = 'Hospital or professional email is required.';
    } else if (idx === 1) {
      if (!formData.medical_college.trim()) errs.medical_college = 'Medical institution is required.';
      if (!formData.medical_education.trim()) errs.medical_education = 'Degree / degrees are required.';
    } else if (idx === 2) {
      if (!formData.medical_registration_number.trim()) {
        errs.medical_registration_number = 'State or National Medical Council Registration Number is required.';
      }
      if (!formData.hospital_workplace.trim()) {
        errs.hospital_workplace = 'Current affiliated hospital/trauma center is required.';
      }
      if (!formData.hospital_location.trim()) {
        errs.hospital_location = 'Hospital city and state location is required.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setSlideDirection(1);
      setCurrentStep((p) => Math.min(p + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setSlideDirection(-1);
    setCurrentStep((p) => Math.max(p - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const ok = await saveDoctorOnboarding({
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email,
      profession: formData.profession,
      specialization: formData.specialization,
      medical_college: formData.medical_college,
      medical_education: formData.medical_education,
      medical_registration_number: formData.medical_registration_number,
      hospital_workplace: formData.hospital_workplace,
      hospital_location: formData.hospital_location,
    });
    setIsSubmitting(false);

    if (ok) {
      onComplete();
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl mx-auto">
        <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200/90 bg-white shadow-sm overflow-hidden">
          <div className="mb-6">
            <StepIndicator steps={steps} currentStep={currentStep} />
          </div>

          <AnimatePresence mode="wait" custom={slideDirection}>
            {/* Step 0: Identity */}
            {currentStep === 0 && (
              <motion.div
                key="doc-step-0"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-4 text-left"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                    Clinician Identity
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Enter your professional details for clinical credential verification.
                  </p>
                </div>

                <InputField
                  label="Full Name (with credentials)"
                  placeholder="e.g. Dr. Emily Watson, MD"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  error={errors.full_name}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Primary Phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={errors.phone}
                    required
                  />
                  <InputField
                    label="Hospital/Institutional Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Profession"
                    placeholder="e.g. Trauma Surgeon"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    required
                  />
                  <InputField
                    label="Clinical Specialization"
                    placeholder="e.g. Acute Critical Care"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <PrimaryButton onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
                    Next: Medical Education
                  </PrimaryButton>
                </div>
              </motion.div>
            )}

            {/* Step 1: Education */}
            {currentStep === 1 && (
              <motion.div
                key="doc-step-1"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-4 text-left"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                    Medical Education & Training
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Accredited institutions and medical degrees completed.
                  </p>
                </div>

                <InputField
                  label="Medical College / University"
                  placeholder="e.g. Johns Hopkins School of Medicine / AIIMS New Delhi"
                  value={formData.medical_college}
                  onChange={(e) => setFormData({ ...formData, medical_college: e.target.value })}
                  error={errors.medical_college}
                  required
                />

                <InputField
                  label="Medical Degrees & Certifications"
                  placeholder="e.g. MBBS, MD (Trauma Surgery), FACS"
                  value={formData.medical_education}
                  onChange={(e) => setFormData({ ...formData, medical_education: e.target.value })}
                  error={errors.medical_education}
                  required
                />

                <div className="pt-4 flex items-center justify-between">
                  <SecondaryButton onClick={handleBack} icon={<ArrowLeft className="w-4 h-4" />}>
                    Back
                  </SecondaryButton>
                  <PrimaryButton onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
                    Next: Council Registration
                  </PrimaryButton>
                </div>
              </motion.div>
            )}

            {/* Step 2: Registration & Workplace */}
            {currentStep === 2 && (
              <motion.div
                key="doc-step-2"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-4 text-left"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                    Registration & Affiliated Hospital
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Required for the professional registry verification adapter.
                  </p>
                </div>

                <InputField
                  label="Medical Council Registration Number"
                  placeholder="e.g. MED-REG-2023-89104"
                  value={formData.medical_registration_number}
                  onChange={(e) =>
                    setFormData({ ...formData, medical_registration_number: e.target.value })
                  }
                  error={errors.medical_registration_number}
                  hint="State Medical Council or National Medical Registry identifier."
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Hospital Workplace"
                    placeholder="e.g. St. Jude Trauma Center"
                    value={formData.hospital_workplace}
                    onChange={(e) =>
                      setFormData({ ...formData, hospital_workplace: e.target.value })
                    }
                    error={errors.hospital_workplace}
                    required
                  />
                  <InputField
                    label="Hospital City / Region"
                    placeholder="e.g. Downtown Metro"
                    value={formData.hospital_location}
                    onChange={(e) =>
                      setFormData({ ...formData, hospital_location: e.target.value })
                    }
                    error={errors.hospital_location}
                    required
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <SecondaryButton onClick={handleBack} icon={<ArrowLeft className="w-4 h-4" />}>
                    Back
                  </SecondaryButton>
                  <PrimaryButton onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
                    Next: Review & Submit
                  </PrimaryButton>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <motion.div
                key="doc-step-3"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5 text-left"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                    Review Doctor Application
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Per TRAUMANET clinical governance, newly onboarded clinicians enter PENDING verification until registry validation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Clinician Identity
                    </span>
                    <p className="text-sm font-bold text-neutral-900">{formData.full_name}</p>
                    <p className="text-xs text-neutral-600">
                      {formData.profession} · {formData.specialization}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Credentials & Workplace
                    </span>
                    <p className="text-xs text-neutral-800">
                      Registration: <span className="font-mono font-bold">{formData.medical_registration_number}</span>
                    </p>
                    <p className="text-xs text-neutral-600">
                      {formData.hospital_workplace} ({formData.hospital_location})
                    </p>
                    <p className="text-xs text-neutral-500">{formData.medical_education}</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <SecondaryButton onClick={handleBack} icon={<ArrowLeft className="w-4 h-4" />}>
                    Back
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    icon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Submit for Verification
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

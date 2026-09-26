import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Phone, MapPin, ShieldAlert, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { InputField } from '../../components/common/FormInputs';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';

export const PatientProfileView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { patientProfile, savePatientOnboarding } = useAuth();

  const [formData, setFormData] = useState({
    full_name: patientProfile?.full_name || '',
    phone: patientProfile?.phone || '',
    email: patientProfile?.email || '',
    address: patientProfile?.address || '',
    emergency_contact_name: patientProfile?.emergency_contact_name || '',
    emergency_contact_phone: patientProfile?.emergency_contact_phone || '',
    emergency_contact_relation: patientProfile?.emergency_contact_relation || '',
    abha_id: patientProfile?.abha_id || '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await savePatientOnboarding(formData);
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

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
            Emergency Health Profile
          </h2>
          <p className="text-xs text-neutral-500">
            Update contact details and emergency contacts stored securely for trauma dispatch.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-5">
        <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
            Personal Information
          </span>

          <InputField
            label="Full Legal Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Primary Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <InputField
              label="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              optional
            />
          </div>

          <InputField
            label="Residential / Primary Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>

        <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
            Emergency Contact & Health Account
          </span>

          <InputField
            label="Emergency Contact Name"
            value={formData.emergency_contact_name}
            onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Emergency Contact Phone"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              required
            />
            <InputField
              label="Relationship"
              value={formData.emergency_contact_relation}
              onChange={(e) =>
                setFormData({ ...formData, emergency_contact_relation: e.target.value })
              }
              optional
            />
          </div>

          <InputField
            label="Ayushman Bharat Health Account (ABHA ID)"
            value={formData.abha_id}
            onChange={(e) => setFormData({ ...formData, abha_id: e.target.value })}
            optional
            hint="Optional ABDM identifier. Emergency response is never withheld if omitted."
          />
        </div>

        {isSaved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile successfully updated.</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton type="button" onClick={onBack}>
            Done
          </SecondaryButton>
          <PrimaryButton type="submit" isLoading={isSaving}>
            Save Changes
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};

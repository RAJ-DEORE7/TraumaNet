import React, { useRef, useEffect } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  hint,
  optional = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-neutral-700 tracking-tight"
        >
          {label}
        </label>
        {optional && (
          <span className="text-[11px] text-neutral-400 font-normal">Optional</span>
        )}
      </div>

      <input
        id={inputId}
        className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-500 ${
          error
            ? 'border-red-400 focus-visible:ring-red-500'
            : 'border-neutral-300 hover:border-neutral-400'
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-neutral-500 leading-normal">{hint}</p>
      ) : null}
    </div>
  );
};

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  hint?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  error,
  hint,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full space-y-1.5 text-left">
      <label
        htmlFor={selectId}
        className="text-xs font-semibold text-neutral-700 tracking-tight"
      >
        {label}
      </label>

      <div className="relative">
        <select
          id={selectId}
          className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm text-neutral-900 appearance-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:bg-neutral-50 ${
            error
              ? 'border-red-400 focus-visible:ring-red-500'
              : 'border-neutral-300 hover:border-neutral-400'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-neutral-500 leading-normal">{hint}</p>
      ) : null}
    </div>
  );
};

export const OtpInput: React.FC<{
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}> = ({ length = 6, value, onChange, disabled = false, hasError = false }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, '');
    const currentOtp = value.split('');

    if (val.length > 1) {
      // Pasted full code
      const pasted = val.slice(0, length);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    currentOtp[index] = val;
    const newOtp = currentOtp.join('').slice(0, length);
    onChange(newOtp);

    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border bg-white transition-all focus-visible:outline-none focus-visible:ring-2 disabled:bg-neutral-100 ${
            hasError
              ? 'border-red-400 text-red-700 focus-visible:ring-red-500'
              : 'border-neutral-300 text-neutral-900 focus-visible:border-neutral-900 focus-visible:ring-neutral-900'
          }`}
        />
      ))}
    </div>
  );
};

export const StepIndicator: React.FC<{
  steps: string[];
  currentStep: number;
}> = ({ steps, currentStep }) => {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div key={step} className="flex-1 flex flex-col gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-neutral-900'
                    : isCurrent
                    ? 'bg-red-600'
                    : 'bg-neutral-200'
                }`}
              />
              <span
                className={`text-[11px] font-medium truncate ${
                  isCurrent
                    ? 'text-neutral-900 font-semibold'
                    : isCompleted
                    ? 'text-neutral-600'
                    : 'text-neutral-400'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

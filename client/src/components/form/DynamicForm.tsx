import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Globe,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import type { DomainConfig, FieldConfig, AdvisoryStyle } from 'wastewise-shared';
import { buildZodSchema } from 'wastewise-shared';
import { FieldRenderer } from './FieldRenderer';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';

export interface DynamicFormProps {
  domain: DomainConfig;
  onSubmit: (data: {
    inputs: Record<string, unknown>;
    style: AdvisoryStyle;
    language: string;
  }) => void;
  isSubmitting?: boolean;
}

const STORAGE_KEY_PREFIX = 'wastewise_draft_';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिन्दी)' },
  { value: 'ta', label: 'Tamil (தமிழ்)' },
  { value: 'te', label: 'Telugu (తెలుగు)' },
  { value: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { value: 'mr', label: 'Marathi (मराठी)' },
  { value: 'bn', label: 'Bengali (বাংলা)' },
];

export const DynamicForm: React.FC<DynamicFormProps> = ({
  domain,
  onSubmit,
  isSubmitting = false,
}) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${domain.slug}`;

  // Initialize form state from field defaults or localStorage draft
  const getInitialValues = (): Record<string, unknown> => {
    const defaults: Record<string, unknown> = {};
    domain.fields.forEach((f) => {
      if (f.defaultValue !== undefined) {
        defaults[f.name] = f.defaultValue;
      } else if (f.type === 'multiselect') {
        defaults[f.name] = [];
      } else if (f.type === 'checkbox') {
        defaults[f.name] = false;
      } else if (f.type === 'slider' && f.min !== undefined) {
        defaults[f.name] = f.min;
      } else {
        defaults[f.name] = '';
      }
    });

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      }
    } catch {
      // Ignore localStorage parse errors
    }
    return defaults;
  };

  const [formData, setFormData] = useState<Record<string, unknown>>(getInitialValues);
  const [style, setStyle] = useState<AdvisoryStyle>('concise');
  const [language, setLanguage] = useState<string>('en');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Sync draft to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch {
      // Ignore quota errors
    }
  }, [formData, storageKey]);

  // Evaluate visibleWhen condition
  const isFieldVisible = (field: FieldConfig): boolean => {
    if (!field.visibleWhen) return true;
    const targetVal = formData[field.visibleWhen.field];
    return targetVal === field.visibleWhen.equals;
  };

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on edit
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleReset = () => {
    localStorage.removeItem(storageKey);
    const defaults: Record<string, unknown> = {};
    domain.fields.forEach((f) => {
      if (f.defaultValue !== undefined) {
        defaults[f.name] = f.defaultValue;
      } else if (f.type === 'multiselect') {
        defaults[f.name] = [];
      } else if (f.type === 'checkbox') {
        defaults[f.name] = false;
      } else if (f.type === 'slider' && f.min !== undefined) {
        defaults[f.name] = f.min;
      } else {
        defaults[f.name] = '';
      }
    });
    setFormData(defaults);
    setErrors({});
    setGeneralError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Only validate fields that are currently visible
    const visibleFields = domain.fields.filter(isFieldVisible);
    const zodSchema = buildZodSchema(visibleFields);

    // Filter formData to visible fields only
    const payloadInputs: Record<string, unknown> = {};
    visibleFields.forEach((f) => {
      payloadInputs[f.name] = formData[f.name];
    });

    const result = zodSchema.safeParse(payloadInputs);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string') {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setGeneralError('Please fill in all required fields accurately before generating.');
      return;
    }

    setErrors({});
    onSubmit({
      inputs: result.data,
      style,
      language,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {generalError && (
        <Alert variant="error" onDismiss={() => setGeneralError(null)}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{generalError}</span>
          </div>
        </Alert>
      )}

      {/* Advisory Configuration Preferences Bar */}
      <Card className="border-emerald-500/20 bg-gray-950/60 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Style Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-300">
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
              <span>Advisory Depth</span>
            </label>
            <div className="inline-flex rounded-xl border border-emerald-500/20 bg-gray-900/80 p-1">
              <button
                type="button"
                onClick={() => setStyle('concise')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  style === 'concise'
                    ? 'bg-emerald-500 text-gray-950 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Concise (Action-first)
              </button>
              <button
                type="button"
                onClick={() => setStyle('detailed')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  style === 'detailed'
                    ? 'bg-emerald-500 text-gray-950 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Detailed (Comprehensive)
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-300">
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span>Output Language</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-xl border border-emerald-500/25 bg-gray-900/90 px-3 py-2 text-xs font-medium text-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Dynamic Fields Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-emerald-400" />
            <span>Domain Questionnaire</span>
          </h3>
          <span className="text-xs text-gray-400">
            * Required fields
          </span>
        </div>

        <div className="space-y-5">
          {domain.fields.map((field) => {
            const isVisible = isFieldVisible(field);
            return (
              <AnimatePresence key={field.name}>
                {isVisible && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FieldRenderer
                      field={field}
                      value={formData[field.name]}
                      error={errors[field.name]}
                      onChange={(val) => handleFieldChange(field.name, val)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-emerald-500/20">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isSubmitting}
          className="gap-2 text-gray-400 hover:text-rose-400"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset Form</span>
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto gap-2.5 shadow-xl shadow-emerald-500/20"
        >
          <Sparkles className="h-4 w-4" />
          <span>Generate Personalized Advisory</span>
        </Button>
      </div>
    </form>
  );
};

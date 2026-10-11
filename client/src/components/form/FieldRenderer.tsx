import React from 'react';
import type { FieldConfig } from 'wastewise-shared';
import {
  Input,
  Textarea,
  Select,
  Slider,
  Multiselect,
  RadioGroup,
  Checkbox,
} from '../ui';

export interface FieldRendererProps {
  field: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  error,
  onChange,
}) => {
  switch (field.type) {
    case 'text':
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          helperText={field.helpText}
          error={error}
          maxLength={field.maxLength}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          label={field.label}
          placeholder={field.placeholder}
          helperText={field.helpText}
          error={error}
          min={field.min}
          max={field.max}
          step={field.step || 1}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? undefined : Number(val));
          }}
        />
      );

    case 'textarea':
      return (
        <Textarea
          label={field.label}
          placeholder={field.placeholder}
          helperText={field.helpText}
          error={error}
          maxLength={field.maxLength}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'select':
      return (
        <Select
          label={field.label}
          helperText={field.helpText}
          error={error}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          options={[
            { value: '', label: `-- Select ${field.label} --` },
            ...(field.options || []).map((o) => ({ value: o.value, label: o.label })),
          ]}
        />
      );

    case 'slider':
      return (
        <Slider
          label={field.label}
          helperText={field.helpText}
          error={error}
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          value={typeof value === 'number' ? value : (field.min ?? 0)}
          onChange={(val) => onChange(val)}
        />
      );

    case 'multiselect':
      return (
        <Multiselect
          label={field.label}
          helperText={field.helpText}
          error={error}
          options={field.options || []}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(val) => onChange(val)}
        />
      );

    case 'radio':
      return (
        <RadioGroup
          label={field.label}
          helperText={field.helpText}
          error={error}
          options={field.options || []}
          value={(value as string) || ''}
          onChange={(val) => onChange(val)}
        />
      );

    case 'checkbox':
      return (
        <Checkbox
          label={field.label}
          description={field.helpText}
          error={error}
          checked={Boolean(value)}
          onChange={(checked) => onChange(checked)}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          label={field.label}
          helperText={field.helpText}
          error={error}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return null;
  }
};

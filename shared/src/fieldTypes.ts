import { z } from 'zod';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'slider';

export interface FieldOption {
  value: string;
  label: string;
}

export interface VisibleWhen {
  field: string;
  equals: unknown;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  defaultValue?: unknown;
  visibleWhen?: VisibleWhen;
}

/**
 * Generates a Zod schema from an array of FieldConfig.
 * Used by both client (form validation) and server (request validation).
 */
export function buildZodSchema(fields: FieldConfig[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case 'number':
      case 'slider': {
        let num = z.number();
        if (field.min !== undefined) num = num.min(field.min);
        if (field.max !== undefined) num = num.max(field.max);
        schema = num;
        break;
      }
      case 'checkbox':
        schema = z.boolean();
        break;
      case 'multiselect': {
        const values = field.options?.map((o) => o.value) ?? [];
        schema = z.array(z.enum(values as [string, ...string[]]));
        break;
      }
      case 'select':
      case 'radio': {
        const values = field.options?.map((o) => o.value) ?? [];
        if (values.length > 0) {
          schema = z.enum(values as [string, ...string[]]);
        } else {
          schema = z.string();
        }
        break;
      }
      case 'date':
        schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)');
        break;
      case 'textarea':
      case 'text':
      default: {
        let str = z.string().trim();
        if (field.maxLength) str = str.max(field.maxLength);
        schema = str;
        break;
      }
    }

    if (!field.required) {
      schema = schema.optional();
    } else if (field.type === 'text' || field.type === 'textarea') {
      schema = (schema as z.ZodString).min(1, `${field.label} is required`);
    }

    shape[field.name] = schema;
  }

  return z.object(shape);
}

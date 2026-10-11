import type { Advisory } from './aiSchemas';

// Standard API envelope types
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Advisory types
export type AdvisoryStatus = 'pending' | 'completed' | 'failed';
export type AdvisoryStyle = 'concise' | 'detailed';

export interface AdvisoryRecord {
  id: string;
  userId: string;
  domainSlug: string;
  title: string;
  inputs: Record<string, unknown>;
  output: Advisory | Record<string, unknown> | null;
  style: AdvisoryStyle;
  language: string;
  status: AdvisoryStatus;
  errorMessage?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  feedbackRating?: number | null;
  feedbackComment?: string | null;
  feedbackAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  preferences?: Record<string, unknown>;
}

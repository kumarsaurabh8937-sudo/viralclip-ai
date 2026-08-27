import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { auth } from './firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Create an axios instance that auto-attaches Firebase JWT */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    timeout: 30_000,
  });

  // Request interceptor — attach current user's ID token
  client.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor — normalise errors
  client.interceptors.response.use(
    (res) => res,
    (error) => {
      const msg =
        error.response?.data?.detail ??
        error.message ??
        'An unexpected error occurred.';
      return Promise.reject(new Error(msg));
    }
  );

  return client;
}

export const api = createApiClient();

// ── Typed API helpers ─────────────────────────────────────────────────────────

export interface UploadResponse {
  job_id: string;
  status: string;
  credits_remaining: number;
  estimated_duration: number;
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  progress: number;
  step?: string;
  output_url?: string;
  thumbnail_url?: string;
  expires_at?: string;
  duration?: number;
  filename: string;
  caption_language: string;
  created_at: string;
  error_message?: string;
}

export interface CreditBalance {
  credits: number;
  is_paid: boolean;
  plan: string;
}

export async function uploadVideo(
  file: File,
  captionLanguage: 'hinglish' | 'hindi' | 'english',
  deviceId: string,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('caption_language', captionLanguage);
  formData.append('device_id', deviceId);

  const res = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  } as AxiosRequestConfig);

  return res.data;
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await api.get<JobStatus>(`/jobs/${jobId}`);
  return res.data;
}

export async function getCredits(): Promise<CreditBalance> {
  const res = await api.get<CreditBalance>('/users/me/credits');
  return res.data;
}

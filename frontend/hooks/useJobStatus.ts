'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getJobStatus, type JobStatus } from '@/lib/api';

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds while processing

export function useJobStatus(jobId: string | null) {
  const [status, setStatus]   = useState<JobStatus | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef           = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async (id: string) => {
    try {
      const data = await getJobStatus(id);
      setStatus(data);
      setError(null);

      // Stop polling on terminal states
      if (['completed', 'failed', 'expired'].includes(data.status)) {
        stopPolling();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch job status';
      setError(msg);
    }
  }, [stopPolling]);

  useEffect(() => {
    if (!jobId) return;

    setLoading(true);
    fetchStatus(jobId).finally(() => setLoading(false));

    // Poll while processing
    intervalRef.current = setInterval(() => fetchStatus(jobId), POLL_INTERVAL_MS);

    return stopPolling;
  }, [jobId, fetchStatus, stopPolling]);

  return { status, error, loading };
}

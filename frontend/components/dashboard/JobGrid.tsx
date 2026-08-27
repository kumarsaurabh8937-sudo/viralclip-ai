'use client';

import Link from 'next/link';
import { Upload } from 'lucide-react';
import { JobCard, type Job } from './JobCard';

interface JobGridProps {
  jobs: Job[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="h-20 rounded-2xl bg-surface border border-[#333] animate-pulse" />
  );
}

export function JobGrid({ jobs, loading }: JobGridProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-[#333] flex items-center justify-center mx-auto mb-5">
          <Upload size={24} className="text-text-muted" />
        </div>
        <p className="font-semibold text-text-secondary">No videos yet</p>
        <p className="text-text-muted text-sm mt-1">Upload your first video to create a viral short</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 rounded-xl bg-neon-gradient text-white text-sm font-semibold shadow-neon-purple hover:opacity-90 transition-opacity"
        >
          <Upload size={15} />
          Upload Video
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
    </div>
  );
}

export default JobGrid;

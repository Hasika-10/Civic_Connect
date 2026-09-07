import React from 'react';

const statusConfig = {
  submitted: {
    label: 'Submitted',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  },
  ai_analyzed: {
    label: 'AI Triaged',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500'
  },
  assigned: {
    label: 'Assigned',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500'
  },
  under_review: {
    label: 'Under Review',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500'
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-orange-50 text-orange-800 border-orange-200',
    dot: 'bg-orange-500 animate-pulse'
  },
  resolved: {
    label: 'Resolved',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  verified: {
    label: 'Citizen Verified',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-500'
  },
  closed: {
    label: 'Closed',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400'
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500'
  }
};

const priorityConfig = {
  low: {
    label: 'Low',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  medium: {
    label: 'Medium',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  },
  high: {
    label: 'High Priority',
    badge: 'bg-orange-50 text-orange-800 border-orange-200 font-semibold',
    dot: 'bg-orange-500'
  },
  critical: {
    label: 'Critical Hazard',
    badge: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
    dot: 'bg-rose-600 animate-ping'
  }
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge} transition-all`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || {
    label: priority || 'Normal',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge} transition-all`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}

import React from 'react';
import { Check, Clock, AlertCircle, Bot, UserCheck, Search, Wrench, CheckCircle2, Star, XCircle } from 'lucide-react';

const timelineSteps = [
  { key: 'submitted', label: 'Submitted', icon: Clock },
  { key: 'ai_analyzed', label: 'AI Analyzed', icon: Bot },
  { key: 'assigned', label: 'Assigned', icon: UserCheck },
  { key: 'under_review', label: 'Under Review', icon: Search },
  { key: 'in_progress', label: 'In Progress', icon: Wrench },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
  { key: 'closed', label: 'Closed', icon: Star }
];

export default function StatusTimeline({ currentStatus, statusHistory }) {
  const currentIndex = timelineSteps.findIndex(s => s.key === currentStatus);
  const isRejected = currentStatus === 'rejected';

  if (isRejected) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-xl">
        <XCircle className="w-6 h-6 text-red-500" />
        <div>
          <p className="font-medium text-red-800">Complaint Rejected</p>
          <p className="text-sm text-red-600">This complaint has been rejected by the authority.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {timelineSteps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const historyEntry = statusHistory?.find(h => h.new_status === step.key);
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                isCompleted ? 'bg-civic-600 text-white' : isCurrent ? 'bg-civic-100 text-civic-600 ring-2 ring-civic-300' : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompleted && index < currentIndex ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              {index < timelineSteps.length - 1 && (
                <div className={`w-0.5 h-8 ${index < currentIndex ? 'bg-civic-600' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="pb-6 min-w-0">
              <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
              {historyEntry && (
                <p className="text-xs text-gray-500 mt-0.5">{new Date(historyEntry.created_at).toLocaleString()}</p>
              )}
              {historyEntry?.comment && (
                <p className="text-xs text-gray-500 mt-0.5">{historyEntry.comment}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


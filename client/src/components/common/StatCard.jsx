import React from 'react';

export default function StatCard({ icon: Icon, label, value, color = 'emerald', trend, onClick }) {
  const colorStyles = {
    civic: {
      bg: 'bg-slate-100 text-slate-800 border-slate-200',
      glow: 'border-l-4 border-l-slate-800'
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      glow: 'border-l-4 border-l-emerald-500'
    },
    green: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      glow: 'border-l-4 border-l-emerald-500'
    },
    yellow: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      glow: 'border-l-4 border-l-amber-500'
    },
    orange: {
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      glow: 'border-l-4 border-l-orange-500'
    },
    red: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      glow: 'border-l-4 border-l-rose-500'
    },
    purple: {
      bg: 'bg-violet-50 text-violet-700 border-violet-200',
      glow: 'border-l-4 border-l-violet-500'
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      glow: 'border-l-4 border-l-indigo-500'
    }
  };

  const current = colorStyles[color] || colorStyles.emerald;

  return (
    <div
      onClick={onClick}
      className={`card p-5 ${current.glow} ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : 'hover:shadow-md'} transition-all duration-300 relative group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">{value}</p>
          {trend && (
            <p className={`text-xs mt-1.5 font-semibold inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
              trend > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
            }`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${current.bg} group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}

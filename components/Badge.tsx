
import React from 'react';
import { Priority } from '../types';

interface BadgeProps {
  type: Priority | string;
  label: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label }) => {
  const getColors = () => {
    switch (type) {
      case Priority.HIGH: return 'bg-red-100 text-red-700 border-red-200';
      case Priority.MEDIUM: return 'bg-amber-100 text-amber-700 border-amber-200';
      case Priority.LOW: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors()}`}>
      {label}
    </span>
  );
};

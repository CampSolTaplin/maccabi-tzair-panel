'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string | number;
  change: string;
  changeUp: boolean;
  icon: LucideIcon;
  accentColor: string;
  accentBg: string;
}

export default function KPICard({
  label,
  value,
  change,
  changeUp,
  icon: Icon,
  accentColor,
  accentBg,
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2DFD8] relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: accentColor }}
      />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-[#5A6472] font-semibold">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: accentBg, color: accentColor }}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      <div className="font-serif text-[2rem] font-extrabold text-[#0F2440] leading-none">
        {value}
      </div>
      <div
        className={cn(
          'text-xs mt-1.5 font-medium flex items-center gap-1',
          changeUp ? 'text-[#2D8B4E]' : 'text-[#C0392B]'
        )}
      >
        <span>{changeUp ? '↑' : '↓'}</span> {change}
      </div>
    </div>
  );
}

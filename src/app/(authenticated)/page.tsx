'use client';

import { useMemo } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { Users, TrendingUp, CalendarCheck, Upload, UserCheck, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { attendance, isImported, setShowImportModal, activeMembers } = useData();

  const kpis = useMemo(() => {
    if (!attendance) return null;

    const totalMembers = activeMembers.length;
    const totalSessions = attendance.dates.length;

    let totalPresent = 0, totalLate = 0, totalAbsent = 0;
    for (const m of activeMembers) {
      const rec = attendance.records[m.contactId] || {};
      for (const d of attendance.dates) {
        if (rec[d] === true) totalPresent++;
        else if (rec[d] === 'late') totalLate++;
        else if (rec[d] === false) totalAbsent++;
      }
    }
    const totalMarked = totalPresent + totalLate + totalAbsent;
    const overallRate = totalMarked > 0 ? Math.round(((totalPresent + totalLate) / totalMarked) * 100) : 0;

    // Last session
    const lastDate = attendance.dates[attendance.dates.length - 1];
    let lastPresent = 0, lastLate = 0, lastAbsent = 0;
    for (const m of activeMembers) {
      const v = (attendance.records[m.contactId] || {})[lastDate];
      if (v === true) lastPresent++;
      else if (v === 'late') lastLate++;
      else if (v === false) lastAbsent++;
    }
    const lastTotal = lastPresent + lastLate + lastAbsent;
    const lastRate = lastTotal > 0 ? Math.round(((lastPresent + lastLate) / lastTotal) * 100) : 0;

    // Monthly
    const monthlyRates = attendance.months.map(month => {
      let p = 0, l = 0, a = 0;
      for (const m of activeMembers) {
        const rec = attendance.records[m.contactId] || {};
        for (const d of month.dates) {
          if (rec[d] === true) p++;
          else if (rec[d] === 'late') l++;
          else if (rec[d] === false) a++;
        }
      }
      const total = p + l + a;
      return { name: month.name, sessions: month.dates.length, rate: total > 0 ? Math.round(((p + l) / total) * 100) : 0 };
    });

    // Member rankings
    const memberRates = activeMembers.map(m => {
      const rec = attendance.records[m.contactId] || {};
      let p = 0, l = 0, a = 0;
      for (const d of attendance.dates) {
        if (rec[d] === true) p++;
        else if (rec[d] === 'late') l++;
        else if (rec[d] === false) a++;
      }
      const total = p + l + a;
      return { ...m, present: p + l, absent: a, total, rate: total > 0 ? Math.round(((p + l) / total) * 100) : 0 };
    }).filter(m => m.total > 0);
    memberRates.sort((a, b) => b.rate - a.rate);

    return {
      totalMembers, totalSessions, overallRate, totalPresent, totalAbsent,
      lastDate, lastPresent, lastAbsent, lastRate,
      monthlyRates,
      topMembers: memberRates.slice(0, 5),
      bottomMembers: [...memberRates].sort((a, b) => a.rate - b.rate).slice(0, 5),
    };
  }, [attendance, activeMembers]);

  if (!isImported || !kpis) {
    return (
      <>
        <Topbar title="Dashboard SOM" subtitle="School of Madrichim — Season 2025/2026" />
        <div className="p-7">
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E3F2FD] mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-[#1B2A6B]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Welcome to the SOM Dashboard</h3>
            <p className="text-sm text-[#5A6472] max-w-md mx-auto mb-6">
              Import the SOM attendance file to view statistics, trends, and participation metrics.
            </p>
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all mx-auto">
              <Upload className="w-4 h-4" /> Import Attendance
            </button>
          </div>
        </div>
      </>
    );
  }

  const fmtLast = () => {
    const d = new Date(kpis.lastDate + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <>
      <Topbar title="Dashboard SOM" subtitle="School of Madrichim — Season 2025/2026" />
      <div className="p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
          <KPI icon={Users} label="SOM Members" value={kpis.totalMembers} accent="#1B2A6B" bg="rgba(27,42,107,0.08)" sub={`${kpis.totalSessions} sessions recorded`} />
          <KPI icon={TrendingUp} label="Overall Attendance" value={`${kpis.overallRate}%`} accent="#2D8B4E" bg="rgba(45,139,78,0.1)" sub={`${kpis.totalPresent} total present`} />
          <KPI icon={CalendarCheck} label="Last Session" value={`${kpis.lastRate}%`} accent="#E8687D" bg="rgba(232,104,125,0.12)" sub={fmtLast()} />
          <KPI icon={UserCheck} label="Last Present" value={`${kpis.lastPresent}/${kpis.lastPresent + kpis.lastAbsent}`} accent="#E89B3A" bg="rgba(232,155,58,0.1)" sub={`${kpis.lastPresent} present · ${kpis.lastAbsent} absent`} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Monthly rates */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#D8E1EA]">
              <h3 className="text-[0.95rem] font-semibold text-[#1B2A6B]">Attendance by Month</h3>
            </div>
            <div className="px-5 py-3">
              {kpis.monthlyRates.map(m => (
                <div key={m.name} className="flex items-center justify-between py-2.5 border-b border-[#f0eeea] last:border-b-0">
                  <div className="min-w-[110px]">
                    <span className="text-[0.85rem] font-medium">{m.name}</span>
                    <span className="text-xs text-[#5A6472] ml-2">({m.sessions})</span>
                  </div>
                  <div className="flex-1 mx-4 h-2 bg-[#f0eeea] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.rate}%`, backgroundColor: m.rate >= 70 ? '#2D8B4E' : m.rate >= 40 ? '#E89B3A' : '#C0392B' }} />
                  </div>
                  <span className="text-sm font-bold min-w-[40px] text-right" style={{ color: m.rate >= 70 ? '#2D8B4E' : m.rate >= 40 ? '#E89B3A' : '#C0392B' }}>{m.rate}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rankings */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#D8E1EA] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#2D8B4E]" />
                <h3 className="text-[0.85rem] font-semibold text-[#1B2A6B]">Highest Attendance</h3>
              </div>
              <div className="px-5 py-2">
                {kpis.topMembers.map((m, i) => (
                  <div key={m.contactId} className="flex items-center justify-between py-2 border-b border-[#f0eeea] last:border-b-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#2D8B4E] text-white text-[0.6rem] font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm">{m.fullName}</span>
                    </div>
                    <span className="text-sm font-bold text-[#2D8B4E]">{m.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#D8E1EA] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C0392B]" />
                <h3 className="text-[0.85rem] font-semibold text-[#1B2A6B]">Lowest Attendance</h3>
              </div>
              <div className="px-5 py-2">
                {kpis.bottomMembers.map((m, i) => (
                  <div key={m.contactId} className="flex items-center justify-between py-2 border-b border-[#f0eeea] last:border-b-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#C0392B] text-white text-[0.6rem] font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm">{m.fullName}</span>
                    </div>
                    <span className="text-sm font-bold text-[#C0392B]">{m.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KPI({ icon: Icon, label, value, accent, bg, sub }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; value: string | number; accent: string; bg: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs uppercase tracking-wider text-[#5A6472] font-semibold">{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon className="w-[18px] h-[18px]" style={{ color: accent }} />
        </div>
      </div>
      <h3 className="text-[1.7rem] font-serif font-bold leading-none" style={{ color: accent }}>{value}</h3>
      <p className="text-xs text-[#5A6472] mt-2 capitalize">{sub}</p>
    </div>
  );
}

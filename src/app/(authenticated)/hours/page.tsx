'use client';

import { useState, useMemo } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useData } from '@/lib/data-context';
import { computeAllMemberHours, MemberHours } from '@/lib/community-hours';
import { CommunityEvent } from '@/types';
import {
  Upload, Search, FileText, Users, Clock, Award, Star, X,
} from 'lucide-react';
import Link from 'next/link';

export default function HoursPage() {
  const { attendance, isImported, setShowImportModal, events, activeMembers } = useData();
  const [search, setSearch] = useState('');
  const [letterMember, setLetterMember] = useState<MemberHours | null>(null);

  // Only compute hours for active members
  const activeIds = useMemo(() => new Set(activeMembers.map(m => m.contactId)), [activeMembers]);

  const allHours = useMemo(() =>
    computeAllMemberHours(attendance, events).filter(m => activeIds.has(m.contactId)),
  [attendance, events, activeIds]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allHours;
    return allHours.filter(m =>
      m.fullName.toLowerCase().includes(q) ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      `${m.lastName} ${m.firstName}`.toLowerCase().includes(q)
    );
  }, [allHours, search]);

  const totalRegular = allHours.reduce((s, m) => s + m.regularHours, 0);
  const totalEvent = allHours.reduce((s, m) => s + m.eventHours, 0);
  const avgHours = allHours.length > 0 ? Math.round((totalRegular + totalEvent) / allHours.length) : 0;

  // ── No data ──
  if (!isImported || !attendance) {
    return (
      <>
        <Topbar title="Community Hours" subtitle="Community Service Hours — School of Madrichim" />
        <div className="p-7">
          <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E3F2FD] mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-[#1B2A6B]" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1B2A6B] mb-2">Import Attendance</h3>
            <p className="text-sm text-[#5A6472] max-w-md mx-auto mb-6">
              Community hours are calculated automatically from attendance. Import the file first.
            </p>
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all mx-auto">
              <Upload className="w-4 h-4" /> Import Attendance
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Community Hours" subtitle="Community Service Hours — School of Madrichim" />
      <div className="p-5">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#1B2A6B]">{allHours.length}</div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Members</div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#2D8B4E]">{avgHours}</div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Average Hours</div>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <Link href="/events" className="hover:opacity-80 transition-opacity">
              <div className="text-2xl font-serif font-bold text-[#E89B3A]">{events.length}</div>
              <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Special Events</div>
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E1EA] p-4 text-center">
            <div className="text-2xl font-serif font-bold text-[#E8687D]">{totalRegular + totalEvent}</div>
            <div className="text-[0.68rem] uppercase tracking-wider text-[#5A6472] font-semibold">Total Hours</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D8E1EA] p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FAFAF8] rounded-lg">
              <Users className="w-4 h-4 text-[#1B2A6B]" />
              <span className="text-sm font-medium text-[#1B2A6B]">SOM Members</span>
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6472]" />
              <input type="text" placeholder="Search member..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D8E1EA] text-sm focus:outline-none focus:border-[#2A3D8F]" />
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto rounded-xl border border-[#D8E1EA] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['#', 'Member', 'Sessions', 'Regular Hours', 'Event Hours', 'Total Hours', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#5A6472] font-semibold bg-[#FAFAF8] border-b border-[#D8E1EA] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m, idx) => (
                <tr key={m.contactId} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-[#5A6472]">{idx + 1}</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee] font-medium">{m.lastName}, {m.firstName}</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee]">{m.regularSessions}</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-[#2D8B4E] font-medium">{m.regularHours}h</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee] text-[#E89B3A] font-medium">{m.eventHours}h</td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee]">
                    <span className="font-bold text-[#1B2A6B]">{m.totalHours}h</span>
                  </td>
                  <td className="px-4 py-2.5 border-b border-[#f4f2ee]">
                    <button onClick={() => setLetterMember(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8E1EA] text-xs font-medium hover:bg-[#f8f7f5] transition-all">
                      <FileText className="w-3.5 h-3.5" /> Letter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Letter Modal */}
      {letterMember && (
        <LetterModal member={letterMember} events={events} onClose={() => setLetterMember(null)} />
      )}
    </>
  );
}

// ─── Letter Modal ───
function LetterModal({ member, events, onClose }: { member: MemberHours; events: CommunityEvent[]; onClose: () => void }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const o = origin;

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Community Hours - ${member.fullName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;0,900;1,400&display=swap" rel="stylesheet">
  <style>
    @page { size: letter; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; color: #1a1a1a; font-size: 9pt; line-height: 1.5; }
    .page { position: relative; width: 8.5in; height: 11in; margin: 0 auto; overflow: hidden; }

    /* ── Left Sidebar column ── */
    .sidebar {
      position: absolute; top: 0; left: 0; width: 1.58in; height: 100%;
      padding: 0.24in 0 0 0.32in;
      font-family: 'Roboto', 'Segoe UI', sans-serif; font-size: 7.5pt; color: #0493B6; line-height: 1.2;
    }
    .sidebar img.logo { width: 1.21in; height: auto; margin-bottom: 10px; }
    .sidebar .sec { font-family: Arial, sans-serif; font-weight: bold; font-size: 7.5pt; margin-top: 8px; margin-bottom: 1px; }
    .sidebar .nm { font-weight: 400; line-height: 1.3; }
    .sidebar .rl { font-style: italic; font-size: 7pt; line-height: 1.2; }
    .sidebar .brd { margin-top: 2px; font-size: 7pt; line-height: 1.4; }
    .sidebar .brd div { line-height: 1.4; }
    .sidebar .logos { margin-top: 14px; }
    .sidebar .logos img { display: block; margin-bottom: 8px; }

    /* ── Main Content ── */
    .content {
      margin-left: 1.70in; padding: 1in 0.6in 0 0;
    }
    .date { margin-bottom: 20px; font-size: 9pt; }
    .salutation { font-size: 9pt; margin-bottom: 14px; }
    .body-text { font-size: 9pt; text-align: justify; margin-bottom: 12px; line-height: 1.6; }
    .body-text strong { color: #0493B6; }
    .breakdown { margin: 14px 0; padding: 12px 16px; background: #f5f9fa; border-left: 3px solid #0493B6; }
    .breakdown h4 { font-family: 'Roboto', sans-serif; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 1px; color: #0493B6; margin: 0 0 6px; font-weight: 700; }
    .breakdown-row { display: flex; justify-content: space-between; font-size: 8.5pt; padding: 2px 0; }
    .breakdown-row.total { border-top: 1px solid #cde3e8; padding-top: 5px; margin-top: 5px; font-weight: bold; color: #0493B6; }
    .sig-block { margin-top: 24px; }
    .sig-block img { height: 50px; display: block; margin-bottom: 0; }
    .sig-line { border-top: 1px solid #333; width: 180px; padding-top: 4px; }
    .sig-name { font-size: 9pt; font-weight: bold; }
    .sig-title { font-size: 8pt; color: #555; }

    /* ── Footer ── */
    .page-footer {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 0 0.375in 0.12in;
      font-family: 'Roboto', 'Segoe UI', sans-serif; color: #0493B6; text-align: center;
    }
    .footer-contact { font-size: 8pt; margin-bottom: 3px; }
    .footer-disc { font-size: 6pt; line-height: 1.3; text-align: left; padding: 0 0.375in; }

    @media print {
      body { margin: 0; }
      .page { width: 8.5in; height: 11in; page-break-after: always; }
    }
    @media screen {
      body { background: #ddd; padding: 20px 0; }
      .page { background: white; box-shadow: 0 2px 16px rgba(0,0,0,0.18); margin: 0 auto; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Left Sidebar -->
    <div class="sidebar">
      <img class="logo" src="${o}/letterhead/marjcc-logo.png" alt="MARJCC" />

      <div class="sec">Chair of the Board</div>
      <div class="nm">Joshua Weingard</div>

      <div class="sec">Executive Officers</div>
      <div class="nm">Tama Rozovski</div>
      <div class="rl">Chair-Elect</div>
      <div class="nm" style="margin-top:4px">Elise Scheck-Bonwitt</div>
      <div class="rl">Immediate Past Chair</div>
      <div class="nm" style="margin-top:4px">Nicole Gorin</div>
      <div class="rl">Vice Chair</div>
      <div class="nm" style="margin-top:4px">Daniel Halberstein</div>
      <div class="rl">Vice Chair of Operations</div>
      <div class="nm" style="margin-top:4px">Jacquie Weisblum</div>
      <div class="rl">At Large Member</div>
      <div class="nm" style="margin-top:4px">Joe Antebi</div>
      <div class="rl">At Large Member</div>
      <div class="nm" style="margin-top:4px">Leslie Sharpe</div>
      <div class="rl">Secretary</div>

      <div class="sec">Board of Directors</div>
      <div class="brd">
        <div>Joe Ackerman</div><div>Joel Bary</div><div>Amanda Bender</div>
        <div>Suzette Diamond</div><div>Carlos Frost</div><div>Matthew Grosack</div>
        <div>Uzi Hardoon</div><div>Alan Luchnick</div><div>Jason Morjain</div>
        <div>Leon Ojalvo</div><div>Josef Preschel</div><div>Ariel Saban</div>
        <div>Sami Shiro</div><div>Monica Sichel</div><div>Ofer Tamir</div>
        <div>Eduardo Tobias</div><div>Flynn Turner</div><div>Alex Wolak</div>
      </div>

      <div class="sec">Chief Executive Officer</div>
      <div class="nm">Alan Sataloff</div>

      <div class="logos">
        <img src="${o}/letterhead/gmjf-logo.png" alt="GMJF" style="width:1.24in" />
        <img src="${o}/letterhead/united-way-logo.png" alt="United Way" style="width:0.82in" />
        <img src="${o}/letterhead/jcc-assoc-logo.png" alt="JCC Association" style="width:0.89in" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="date">${dateStr}</div>

      <div class="salutation">To Whom It May Concern,</div>

      <div class="body-text">
        This letter is to certify that <strong>${member.fullName}</strong> has been an active participant
        in the <strong>School of Madrichim (SOM)</strong> program at Maccabi Tzair Miami, a youth leadership
        program of the Michael-Ann Russell Jewish Community Center (MARJCC) during the
        <strong>2025-2026</strong> season.
      </div>

      <div class="body-text">
        Through their participation in regular weekly sessions and community service events,
        <strong>${member.fullName}</strong> has completed a total of
        <strong>${member.totalHours} community service hours</strong>.
      </div>

      <div class="breakdown">
        <h4>Hours Breakdown</h4>
        <div class="breakdown-row">
          <span>Regular Sessions (${member.regularSessions} sessions &times; 2h)</span>
          <span>${member.regularHours} hours</span>
        </div>
        ${member.eventBreakdown.map(e => `
        <div class="breakdown-row">
          <span>${e.eventName}</span>
          <span>${e.hours} hours</span>
        </div>`).join('')}
        <div class="breakdown-row total">
          <span>Total Community Service Hours</span>
          <span>${member.totalHours} hours</span>
        </div>
      </div>

      <div class="body-text">
        We commend ${member.firstName} for their dedication and commitment to community service
        and youth leadership development.
      </div>

      <div class="body-text">Sincerely,</div>

      <div class="sig-block">
        <img src="${o}/letterhead/firma-marleny.png" alt="Signature" />
        <div class="sig-line">
          <div class="sig-name">Marleny Rosemberg</div>
          <div class="sig-title">Hebraica Director</div>
          <div class="sig-title">Michael-Ann Russell JCC</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div class="footer-contact">
        Michael-Ann Russell Jewish Community Center &bull; 18900 NE 25 Avenue, North Miami Beach, Florida 33180 &bull; 305.932.4200 &nbsp;&bull;&nbsp; www.marjcc.org
      </div>
      <div class="footer-disc">
        Our state registration number is CH-1998. A copy of the official registration and financial information may be obtained from the Division of Consumer Services by calling toll-free the state, 1-800-HELP-FLA. Registration does not imply endorsement, approval, or recommendation. Michael-Ann Russell Jewish Community Center is a beneficiary agency of the Greater Miami Jewish Federation, United Way of Miami-Dade, and a member of the JCC Association of North America.
      </div>
    </div>
  </div>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#D8E1EA]">
          <h2 className="font-serif font-bold text-lg text-[#1B2A6B]">Generate Letter</h2>
        </div>
        <div className="px-6 py-5">
          <div className="bg-[#FAFAF8] rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-[#1B2A6B] mb-2">{member.fullName}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-[#5A6472]">Regular sessions:</span> <strong>{member.regularSessions}</strong></div>
              <div><span className="text-[#5A6472]">Regular hours:</span> <strong>{member.regularHours}h</strong></div>
              <div><span className="text-[#5A6472]">Event hours:</span> <strong>{member.eventHours}h</strong></div>
              <div><span className="text-[#5A6472]">Total:</span> <strong className="text-[#1B2A6B] text-base">{member.totalHours}h</strong></div>
            </div>
          </div>

          {member.eventBreakdown.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-2">Event Breakdown</p>
              {member.eventBreakdown.map((e, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-[#f0eeea] last:border-b-0">
                  <span>{e.eventName}</span>
                  <span className="font-medium text-[#E89B3A]">{e.hours}h</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={handlePrint}
            className="w-full py-2.5 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" /> Generate & Print Letter
          </button>
          <button onClick={onClose} className="w-full py-2 rounded-lg text-sm text-[#5A6472] hover:bg-[#f4f2ee] transition-all mt-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

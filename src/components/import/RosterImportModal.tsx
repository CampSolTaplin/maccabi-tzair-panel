'use client';

import { useState, useRef } from 'react';
import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { useData } from '@/lib/data-context';
import { parseRoster, mergeRoster } from '@/lib/roster-parser';
import { RosterData, Program } from '@/types';

const PROGRAM_LABELS: Record<Program, string> = {
  Katan: 'Maccabi Katan (K-5)',
  Noar: 'Maccabi Noar (6-8)',
  'Pre-SOM': 'Pre-SOM (9th)',
  SOM: 'SOM (10th)',
  Trips: 'Trips/Seminars',
  Machanot: 'Machanot',
};

const PROGRAM_COLORS: Record<Program, string> = {
  Katan: 'bg-blue-50 text-blue-700',
  Noar: 'bg-purple-50 text-purple-700',
  'Pre-SOM': 'bg-amber-50 text-amber-700',
  SOM: 'bg-green-50 text-green-700',
  Trips: 'bg-rose-50 text-rose-700',
  Machanot: 'bg-cyan-50 text-cyan-700',
};

export default function RosterImportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { rosterData, importRoster } = useData();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RosterData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      let data = parseRoster(buffer, file.name);

      // If existing roster data, merge
      if (rosterData) {
        data = mergeRoster(rosterData, data);
      }

      setResult(data);
      importRoster(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error processing the file.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const close = () => {
    onClose();
    setResult(null);
    setError(null);
    setLoading(false);
  };

  // Group breakdown for success view
  const groupCounts = result
    ? (Object.keys(PROGRAM_LABELS) as Program[]).map(p => ({
        program: p,
        label: PROGRAM_LABELS[p],
        count: result.chanichim.filter(c => c.program === p).length,
        color: PROGRAM_COLORS[p],
      })).filter(g => g.count > 0)
    : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={close}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E1EA]">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-[#1B2A6B]" />
            <h2 className="font-serif font-bold text-lg text-[#1B2A6B]">Import Roster</h2>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f4f2ee] transition-colors">
            <X className="w-4 h-4 text-[#5A6472]" />
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-3 border-[#1B2A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#5A6472]">Processing Salesforce file...</p>
            </div>
          ) : result ? (
            /* Success */
            <div>
              <div className="flex items-center gap-3 mb-5">
                <CheckCircle2 className="w-8 h-8 text-[#2D8B4E]" />
                <div>
                  <h3 className="font-semibold text-[#1A1A2E]">Roster imported successfully</h3>
                  <p className="text-sm text-[#5A6472]">
                    {result.chanichim.length} participants in {groupCounts.length} groups
                  </p>
                </div>
              </div>

              {/* Group breakdown */}
              <div className="bg-[#FAFAF8] rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-2">Participants by group</p>
                <div className="space-y-1.5">
                  {groupCounts.map(g => (
                    <div key={g.program} className="flex items-center justify-between py-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${g.color}`}>
                        {g.label}
                      </span>
                      <span className="text-sm font-medium text-[#1B2A6B]">{g.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={close} className="w-full py-2.5 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all">
                View Rosters
              </button>
            </div>
          ) : error ? (
            /* Error */
            <div className="text-center py-6">
              <AlertCircle className="w-10 h-10 text-[#C0392B] mx-auto mb-3" />
              <h3 className="font-semibold text-[#1A1A2E] mb-1">Import error</h3>
              <p className="text-sm text-[#C0392B] mb-4">{error}</p>
              <button
                onClick={() => { setError(null); inputRef.current?.click(); }}
                className="px-5 py-2 rounded-lg border border-[#D8E1EA] text-sm font-medium hover:bg-[#f8f7f5] transition-all"
              >
                Try again
              </button>
            </div>
          ) : (
            /* Upload zone */
            <div>
              {rosterData && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                  <p className="text-sm text-amber-800">
                    There is already an imported roster ({rosterData.chanichim.length} participants).
                    Uploading a new file will update the existing data.
                  </p>
                </div>
              )}

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragging
                    ? 'border-[#1B2A6B] bg-[#1B2A6B]/5'
                    : 'border-[#D8E1EA] hover:border-[#1B2A6B]/40 hover:bg-[#FAFAF8]'
                }`}
              >
                <Upload className="w-10 h-10 text-[#5A6472] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#1A1A2E] mb-1">
                  Drag the Salesforce report here
                </p>
                <p className="text-xs text-[#5A6472]">
                  Format: Hebraica Roster .xlsx
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={onFileSelect}
                  className="hidden"
                />
              </div>

              <p className="text-xs text-[#5A6472] mt-3 text-center">
                The file must contain: Full Name, Contact ID, Course Option Enrollment ID, Full Course Option Name
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, Upload } from 'lucide-react';
import { useData } from '@/lib/data-context';
import { parseSOMAttendance } from '@/lib/som-attendance-parser';
import { SOMAttendanceData } from '@/types';

export default function ImportModal() {
  const { showImportModal, setShowImportModal, importAttendance, clearImport, isImported } = useData();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SOMAttendanceData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!showImportModal) return null;

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const data = parseSOMAttendance(buffer);

      if (data.members.length === 0) {
        throw new Error('No se encontraron miembros en el archivo.');
      }

      setResult(data);
      importAttendance(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido al procesar el archivo.');
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
    setShowImportModal(false);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  // Calculate stats from result
  const totalSessions = result ? result.dates.length : 0;
  const totalPresent = result ? Object.values(result.records).reduce((sum, rec) =>
    sum + Object.values(rec).filter(v => v === true).length, 0
  ) : 0;
  const totalAbsent = result ? Object.values(result.records).reduce((sum, rec) =>
    sum + Object.values(rec).filter(v => v === false).length, 0
  ) : 0;
  const attendanceRate = totalPresent + totalAbsent > 0
    ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={close}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E1EA]">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-[#1B2A6B]" />
            <h2 className="font-serif font-bold text-lg text-[#1B2A6B]">Importar Asistencia SOM</h2>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f4f2ee] transition-colors">
            <X className="w-4 h-4 text-[#5A6472]" />
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-3 border-[#1B2A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#5A6472]">Procesando archivo de asistencia...</p>
            </div>
          ) : result ? (
            /* Success */
            <div>
              <div className="flex items-center gap-3 mb-5">
                <CheckCircle2 className="w-8 h-8 text-[#2D8B4E]" />
                <div>
                  <h3 className="font-semibold text-[#1A1A2E]">Asistencia importada correctamente</h3>
                  <p className="text-sm text-[#5A6472]">{result.members.length} miembros · {totalSessions} sesiones</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-[#2D8B4E]">{attendanceRate}%</div>
                  <div className="text-[0.68rem] text-[#5A6472] font-medium">Asistencia</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-[#1B2A6B]">{totalPresent}</div>
                  <div className="text-[0.68rem] text-[#5A6472] font-medium">Presentes</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-[#C0392B]">{totalAbsent}</div>
                  <div className="text-[0.68rem] text-[#5A6472] font-medium">Ausentes</div>
                </div>
              </div>

              {/* Monthly breakdown */}
              <div className="bg-[#FAFAF8] rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-[#5A6472] uppercase tracking-wider mb-2">Sesiones por mes</p>
                {result.months.map(m => (
                  <div key={m.name} className="flex justify-between text-sm py-1">
                    <span className="text-[#1A1A2E]">{m.name}</span>
                    <span className="font-medium text-[#1B2A6B]">{m.dates.length} sesiones</span>
                  </div>
                ))}
              </div>

              <button onClick={close} className="w-full py-2.5 rounded-lg bg-[#1B2A6B] text-white text-sm font-medium hover:bg-[#2A3D8F] transition-all">
                Ver Asistencia
              </button>
            </div>
          ) : error ? (
            /* Error */
            <div className="text-center py-6">
              <AlertCircle className="w-10 h-10 text-[#C0392B] mx-auto mb-3" />
              <h3 className="font-semibold text-[#1A1A2E] mb-1">Error al importar</h3>
              <p className="text-sm text-[#C0392B] mb-4">{error}</p>
              <button
                onClick={() => { setError(null); inputRef.current?.click(); }}
                className="px-5 py-2 rounded-lg border border-[#D8E1EA] text-sm font-medium hover:bg-[#f8f7f5] transition-all"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : (
            /* Upload zone */
            <div>
              {isImported && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                  <p className="text-sm text-amber-800">Ya hay datos importados. Subir un archivo nuevo los reemplazará.</p>
                  <button
                    onClick={() => { clearImport(); close(); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Borrar datos
                  </button>
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
                  Arrastrá el archivo de asistencia SOM
                </p>
                <p className="text-xs text-[#5A6472]">
                  Formato: SOM ATTENDANCE.xlsx
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
                El archivo debe tener: FirstName, LastName, Contact ID, y columnas de fechas con true/false
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

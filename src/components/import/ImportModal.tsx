'use client';

import { useState, useRef } from 'react';
import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { useData } from '@/lib/data-context';
import { parseExcelFile, ImportSummary } from '@/lib/excel-parser';

export default function ImportModal() {
  const { showImportModal, setShowImportModal, importData, isImported, clearImport, importCount } = useData();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!showImportModal) return null;

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer);
      if (result.chanichim.length === 0) {
        setError('No se encontraron chanichim en el archivo. Verifica que el formato sea correcto.');
      } else {
        importData(result.chanichim);
        setSummary(result.summary);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar el archivo. Verifica que sea un archivo Excel válido.');
    }
    setLoading(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const close = () => {
    setShowImportModal(false);
    setSummary(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={close}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E1EA] sticky top-0 bg-white z-10">
          <h2 className="text-lg font-serif font-bold text-[#1B2A6B]">Importar Datos de Salesforce</h2>
          <button onClick={close} className="w-8 h-8 rounded-lg hover:bg-[#f4f2ee] flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-[#5A6472]" />
          </button>
        </div>

        <div className="p-6">
          {summary ? (
            /* ── Success View ── */
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#2D8B4E]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B2A6B]">Importación exitosa</h3>
                  <p className="text-sm text-[#5A6472]">{summary.totalImported} chanichim importados de {summary.totalRows} filas</p>
                </div>
              </div>

              {/* Stats overview */}
              <div className="bg-[#f8f7f5] rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5A6472]">Filas en Excel:</span>
                    <span className="font-medium">{summary.totalRows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6472]">Importados:</span>
                    <span className="font-bold text-[#2D8B4E]">{summary.totalImported}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6472]">Duplicados:</span>
                    <span className="font-medium">{summary.duplicatesRemoved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6472]">Trips/Sleepovers:</span>
                    <span className="font-medium">{summary.skippedNonMain}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-[#5A6472]">Solo programas principales (1-4)</span>
                    <span className="font-medium text-[#2D8B4E]">Activo</span>
                  </div>
                </div>
              </div>

              {/* By Program */}
              <div className="bg-[#f8f7f5] rounded-xl p-4 mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5A6472] mb-3">Por programa</h4>
                <div className="space-y-2">
                  {Object.entries(summary.byProgram).map(([prog, count]) => {
                    const pct = Math.round((count / summary.totalImported) * 100);
                    const colors: Record<string, string> = {
                      'Maccabi Katan': '#1B2A6B',
                      'Maccabi Noar': '#2D8B4E',
                      'Pre-SOM': '#E8687D',
                      'SOM': '#2A3D8F',
                    };
                    return (
                      <div key={prog}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#5A6472]">{prog}</span>
                          <span className="font-medium">{count} <span className="text-xs text-[#5A6472]">({pct}%)</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: colors[prog] || '#999' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Grade */}
              <div className="bg-[#f8f7f5] rounded-xl p-4 mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5A6472] mb-2">Por grado</h4>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  {Object.entries(summary.byGrade).map(([grade, count]) => (
                    <div key={grade} className="bg-white rounded-lg px-3 py-2 text-center">
                      <div className="font-bold text-[#1B2A6B]">{count}</div>
                      <div className="text-xs text-[#5A6472]">{grade}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={close}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1B2A6B] text-white font-medium text-sm hover:bg-[#2A3D8F] transition-all"
              >
                Listo
              </button>
            </div>
          ) : (
            /* ── Upload View ── */
            <div>
              <p className="text-sm text-[#5A6472] mb-4">
                Sube el archivo Excel exportado desde Salesforce con el roster de Hebraica.
                El sistema detectará automáticamente los programas, grados, y eliminará duplicados.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#1B2A6B] bg-[#C5E3F6]/20'
                    : 'border-[#D8E1EA] hover:border-[#2A3D8F] hover:bg-[#f8f7f5]'
                }`}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-[3px] border-[#1B2A6B] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[#5A6472]">Procesando archivo...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#f4f2ee] flex items-center justify-center">
                      <FileSpreadsheet className="w-7 h-7 text-[#5A6472]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1B2A6B]">
                        Arrastra tu archivo aquí o haz click para seleccionar
                      </p>
                      <p className="text-xs text-[#5A6472] mt-1">Formatos aceptados: .xlsx, .xls, .csv</p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    // Reset so same file can be selected again
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-red-50 text-[#C0392B] text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Currently imported info */}
              {isImported && (
                <div className="mt-4 p-4 rounded-xl bg-[#f8f7f5] border border-[#D8E1EA]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[#1B2A6B]">Datos importados activos</p>
                      <p className="text-xs text-[#5A6472]">{importCount} chanichim cargados</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#2D8B4E]" />
                    </div>
                  </div>
                  <p className="text-xs text-[#5A6472] mb-2">
                    Subir un nuevo archivo reemplazará los datos actuales.
                  </p>
                  <button
                    onClick={() => { clearImport(); }}
                    className="flex items-center gap-1.5 text-xs text-[#C0392B] hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    Volver a datos de ejemplo
                  </button>
                </div>
              )}

              {/* Help text */}
              <div className="mt-4 p-4 rounded-xl bg-[#E3F2FD]/50 border border-[#C5E3F6]">
                <h4 className="text-xs font-semibold text-[#1B2A6B] mb-2">¿Cómo exportar desde Salesforce?</h4>
                <ol className="text-xs text-[#5A6472] space-y-1 list-decimal list-inside">
                  <li>Ir a Salesforce → Reportes → Hebraica Roster</li>
                  <li>Click en &quot;Exportar&quot; → formato Excel (.xlsx)</li>
                  <li>Guardar el archivo y subirlo aquí</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

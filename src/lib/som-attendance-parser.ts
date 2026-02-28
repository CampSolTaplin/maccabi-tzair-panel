import * as XLSX from 'xlsx';
import { SOMMember, SOMAttendanceData, SOMAttendanceValue } from '@/types';

const MONTH_NAMES: Record<number, string> = {
  0: 'Enero', 1: 'Febrero', 2: 'Marzo', 3: 'Abril',
  4: 'Mayo', 5: 'Junio', 6: 'Julio', 7: 'Agosto',
  8: 'Septiembre', 9: 'Octubre', 10: 'Noviembre', 11: 'Diciembre',
};

/**
 * Parses the SOM ATTENDANCE.xlsx file.
 *
 * Structure:
 *   Row 0: Month headers spanning date columns (SEPTEMBER, OCTOBER, etc.)
 *   Row 1: Specific dates (Excel serial numbers or date objects)
 *   Row 2: Column headers (FirstName, LastName, Contact: Contact ID, + dates repeated)
 *   Row 3+: Member data
 *
 * Date columns (col 3-50): values are true (present), false (absent), or empty (no data)
 */
export function parseSOMAttendance(buffer: ArrayBuffer): SOMAttendanceData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Get raw data as array of arrays (to handle multi-row headers)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  if (raw.length < 4) {
    throw new Error('El archivo no tiene suficientes filas. Se esperan al menos 4 filas (3 de encabezado + datos).');
  }

  // Row 1 (index 1) has the actual date values
  const dateRow = raw[1];
  // Row 2 (index 2) has column headers: FirstName, LastName, Contact: Contact ID, then dates again
  // Data starts at row 3 (index 3)

  // Extract dates from row 1, starting at column 3
  const dates: string[] = [];
  const dateColMap: Map<number, string> = new Map();

  for (let col = 3; col < dateRow.length; col++) {
    const cellValue = dateRow[col];
    if (cellValue == null) continue;

    let dateStr: string | null = null;

    if (cellValue instanceof Date) {
      dateStr = formatDate(cellValue);
    } else if (typeof cellValue === 'number') {
      // Excel serial date number
      const d = excelSerialToDate(cellValue);
      dateStr = formatDate(d);
    } else if (typeof cellValue === 'string') {
      // Try parsing string date
      const d = new Date(cellValue);
      if (!isNaN(d.getTime())) {
        dateStr = formatDate(d);
      }
    }

    if (dateStr) {
      dates.push(dateStr);
      dateColMap.set(col, dateStr);
    }
  }

  if (dates.length === 0) {
    throw new Error('No se encontraron fechas de sesión en el archivo.');
  }

  // Parse members and their attendance (starting at row 3)
  const members: SOMMember[] = [];
  const records: Record<string, Record<string, SOMAttendanceValue>> = {};

  for (let row = 3; row < raw.length; row++) {
    const rowData = raw[row];
    if (!rowData || !rowData[0]) continue; // Skip empty rows

    const firstName = String(rowData[0] || '').trim();
    const lastName = String(rowData[1] || '').trim();
    const contactId = String(rowData[2] || `som-${row}`).trim();
    const fullName = `${firstName} ${lastName}`;

    if (!firstName && !lastName) continue;

    members.push({ firstName, lastName, fullName, contactId });

    // Parse attendance for each date column
    const memberRecords: Record<string, SOMAttendanceValue> = {};
    for (const [col, dateStr] of dateColMap) {
      const val = rowData[col];
      if (val === true || val === 'true' || val === 'TRUE') {
        memberRecords[dateStr] = true;
      } else if (val === false || val === 'false' || val === 'FALSE') {
        memberRecords[dateStr] = false;
      } else {
        memberRecords[dateStr] = null;
      }
    }
    records[contactId] = memberRecords;
  }

  // Sort members alphabetically by last name, then first name
  members.sort((a, b) => {
    const lastCmp = a.lastName.localeCompare(b.lastName);
    return lastCmp !== 0 ? lastCmp : a.firstName.localeCompare(b.firstName);
  });

  // Group dates by month
  const monthsMap = new Map<string, string[]>();
  for (const dateStr of dates) {
    const d = new Date(dateStr + 'T12:00:00');
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    const monthName = MONTH_NAMES[d.getMonth()] || `Mes ${d.getMonth() + 1}`;
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, []);
    }
    monthsMap.get(monthKey)!.push(dateStr);
  }

  const months = Array.from(monthsMap.entries()).map(([key, dts]) => {
    const [, monthIdx] = key.split('-');
    return { name: MONTH_NAMES[parseInt(monthIdx)], dates: dts };
  });

  return { members, dates, records, months };
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function excelSerialToDate(serial: number): Date {
  // Excel epoch is Dec 30, 1899
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  return new Date(utcValue);
}

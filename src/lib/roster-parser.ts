import * as XLSX from 'xlsx';
import { Chanich, Program, RosterData } from '@/types';

/** Map Excel column headers to Chanich property names */
const HEADER_MAP: Record<string, keyof Chanich> = {
  'Registration: Contact: Full Name': 'fullName',
  'Contact: Gender': 'gender',
  'Registration: Account: Account Name': 'accountName',
  'Contact: Age': 'age',
  'Registration: Account: Emergency Contact 1 Name': 'emergencyContactName',
  'Contact: Grade': 'grade',
  'Contact: School': 'school',
  'Contact: Allergies': 'allergies',
  'Registration: Account: Emergency Contact 1 Cell Phone': 'emergencyPhone',
  'Registration: Account: Self-Identifies as Jewish': 'jewishIdentification',
  'Contact: Jewish Community Service': 'communityService',
  'Registration: Account: Keep Kosher': 'keepKosher',
  'Registration: Account: Primary Contact Email': 'primaryEmail',
  'Registration: Account: Phone': 'primaryPhone',
  'Contact: Account Name: Primary Contact Phone': 'contactPhone',
  'Contact: All Emails': 'allEmails',
  'Course Option Enrollment ID': 'courseOptionId',
  'Contact: Contact ID': 'contactId',
  'Full Course Option Name': 'fullCourseOption',
};

/** Extract program and grade level from pipe-separated Full Course Option Name */
function classifyProgram(fullCourseOption: string): { program: Program; gradeLevel: string } {
  const segments = fullCourseOption.split('|').map(s => s.trim());
  const category = segments[1] || ''; // e.g. "1. Maccabi Katan (K-5 Grade)"
  const gradePart = segments[3] || ''; // e.g. "Katan - 1st Grade"

  if (/Katan/i.test(category)) {
    return { program: 'Katan', gradeLevel: gradePart };
  }
  if (/Noar/i.test(category)) {
    return { program: 'Noar', gradeLevel: gradePart };
  }
  if (/Pre.*School.*Madrichim|PRE-SOM/i.test(category)) {
    return { program: 'Pre-SOM', gradeLevel: gradePart };
  }
  if (/School.*Madrichim|SOM/i.test(category)) {
    return { program: 'SOM', gradeLevel: gradePart };
  }
  if (/Trip|Seminar/i.test(category)) {
    return { program: 'Trips', gradeLevel: gradePart };
  }
  if (/Machanot|Sleepover/i.test(category)) {
    return { program: 'Machanot', gradeLevel: gradePart };
  }

  // Fallback: try grade part
  if (/kinder|1st|2nd|3rd|4th|5th/i.test(gradePart)) return { program: 'Katan', gradeLevel: gradePart };
  if (/6th|7th|8th/i.test(gradePart)) return { program: 'Noar', gradeLevel: gradePart };
  if (/9th|pre.?som/i.test(gradePart)) return { program: 'Pre-SOM', gradeLevel: gradePart };
  if (/10th|\bsom\b/i.test(gradePart)) return { program: 'SOM', gradeLevel: gradePart };

  return { program: 'Katan', gradeLevel: gradePart || 'Sin clasificar' };
}

/** Parse a Salesforce roster Excel export into RosterData */
export function parseRoster(buffer: ArrayBuffer, fileName: string): RosterData {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

  if (rows.length === 0) {
    throw new Error('El archivo no contiene datos.');
  }

  // Validate that critical headers exist
  const headers = Object.keys(rows[0]);
  const criticalHeaders = [
    'Registration: Contact: Full Name',
    'Contact: Contact ID',
    'Course Option Enrollment ID',
    'Full Course Option Name',
  ];
  const missing = criticalHeaders.filter(h => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(
      `Columnas requeridas no encontradas: ${missing.join(', ')}. Asegurate de usar el reporte de Salesforce correcto.`
    );
  }

  const chanichim: Chanich[] = [];

  for (const row of rows) {
    const courseOptionId = String(row['Course Option Enrollment ID'] || '').trim();
    if (!courseOptionId) continue;

    const fullCourseOption = String(row['Full Course Option Name'] || '');
    const { program, gradeLevel } = classifyProgram(fullCourseOption);

    const chanich: Chanich = {
      id: courseOptionId,
      fullName: String(row['Registration: Contact: Full Name'] || '').trim(),
      gender: String(row['Contact: Gender'] || '').trim(),
      accountName: String(row['Registration: Account: Account Name'] || '').trim(),
      age: Number(row['Contact: Age']) || 0,
      emergencyContactName: String(row['Registration: Account: Emergency Contact 1 Name'] || '').trim(),
      grade: String(row['Contact: Grade'] || '').trim(),
      school: String(row['Contact: School'] || '').trim(),
      allergies: String(row['Contact: Allergies'] || '').trim(),
      emergencyPhone: String(row['Registration: Account: Emergency Contact 1 Cell Phone'] || '').trim(),
      jewishIdentification: String(row['Registration: Account: Self-Identifies as Jewish'] || '').trim(),
      communityService: String(row['Contact: Jewish Community Service'] || '').trim(),
      keepKosher: String(row['Registration: Account: Keep Kosher'] || '').trim(),
      primaryEmail: String(row['Registration: Account: Primary Contact Email'] || '').trim(),
      primaryPhone: String(row['Registration: Account: Phone'] || '').trim(),
      contactPhone: String(row['Contact: Account Name: Primary Contact Phone'] || '').trim(),
      allEmails: String(row['Contact: All Emails'] || '').trim(),
      enrollmentId: courseOptionId,
      contactId: String(row['Contact: Contact ID'] || '').trim(),
      courseOptionId,
      fullCourseOption,
      program,
      gradeLevel,
    };

    chanichim.push(chanich);
  }

  if (chanichim.length === 0) {
    throw new Error('No se encontraron registros de participantes en el archivo.');
  }

  // Sort by program order, then by full name
  const programOrder: Program[] = ['Katan', 'Noar', 'Pre-SOM', 'SOM', 'Trips', 'Machanot'];
  chanichim.sort((a, b) => {
    const pi = programOrder.indexOf(a.program) - programOrder.indexOf(b.program);
    return pi !== 0 ? pi : a.fullName.localeCompare(b.fullName);
  });

  // Deduplicate by contactId — keep first occurrence (main program wins due to sort order)
  const seen = new Set<string>();
  const unique = chanichim.filter(c => {
    if (!c.contactId) return true;
    if (seen.has(c.contactId)) return false;
    seen.add(c.contactId);
    return true;
  });

  return {
    chanichim: unique,
    importedAt: new Date().toISOString(),
    sourceFileName: fileName,
  };
}

/** Merge incoming roster with existing data, upserting by courseOptionId */
export function mergeRoster(existing: RosterData, incoming: RosterData): RosterData {
  const map = new Map(existing.chanichim.map(c => [c.courseOptionId, c]));

  for (const chanich of incoming.chanichim) {
    map.set(chanich.courseOptionId, chanich); // upsert
  }

  const programOrder: Program[] = ['Katan', 'Noar', 'Pre-SOM', 'SOM', 'Trips', 'Machanot'];
  const merged = Array.from(map.values()).sort((a, b) => {
    const pi = programOrder.indexOf(a.program) - programOrder.indexOf(b.program);
    return pi !== 0 ? pi : a.fullName.localeCompare(b.fullName);
  });

  // Deduplicate by contactId — keep first occurrence (main program wins due to sort order)
  const seen = new Set<string>();
  const unique = merged.filter(c => {
    if (!c.contactId) return true;
    if (seen.has(c.contactId)) return false;
    seen.add(c.contactId);
    return true;
  });

  return {
    chanichim: unique,
    importedAt: incoming.importedAt,
    sourceFileName: incoming.sourceFileName,
  };
}

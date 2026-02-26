import * as XLSX from 'xlsx';
import { Chanich, Program } from '@/types';
import { parseGrade } from './utils';

interface ExcelRow {
  'Full Name'?: string;
  'Gender'?: string;
  'Account Name'?: string;
  'Age'?: number;
  'Emergency Contact Name'?: string;
  'Grade'?: string;
  'School'?: string;
  'Allergies'?: string;
  'Emergency Phone'?: string;
  'Jewish Identification'?: string;
  'Community Service'?: string;
  'Keep Kosher'?: string;
  'Primary Email'?: string;
  'Primary Phone'?: string;
  'Contact Phone'?: string;
  'All Emails'?: string;
  'Enrollment ID'?: string;
  'Contact ID'?: string;
  'Course Option ID'?: string;
  'Full Course Option Name'?: string;
}

export interface ImportSummary {
  totalRows: number;
  totalImported: number;
  duplicatesRemoved: number;
  excludedGrades: number;
  skippedNonMain: number;
  byProgram: Record<string, number>;
  byGrade: Record<string, number>;
}

/**
 * Determines if a course option is a main program (Katan, Noar, Pre-SOM, SOM)
 * vs. a trip, sleepover, machaneh, etc.
 */
function isMainProgramCourse(courseOption: string): boolean {
  const lower = courseOption.toLowerCase();
  return (
    lower.includes('1. maccabi katan') ||
    lower.includes('2. maccabi noar') ||
    lower.includes('3. maccabi pre-school') ||
    lower.includes('3. pre-school of madrichim') ||
    lower.includes('4. school of madrichim') ||
    lower.includes('maccabi katan (k-5') ||
    lower.includes('maccabi noar (6') ||
    // Catch-all for non-numbered formats
    (lower.includes('maccabi katan') && !lower.includes('machane') && !lower.includes('sleepover') && !lower.includes('trip')) ||
    (lower.includes('maccabi noar') && !lower.includes('machane') && !lower.includes('sleepover') && !lower.includes('trip'))
  );
}

/**
 * Parses the program from the course option name.
 * Only call this after isMainProgramCourse returns true.
 */
function parseProgramFromCourse(courseOption: string): Program {
  const lower = courseOption.toLowerCase();
  if (lower.includes('maccabi katan') || lower.includes('1. maccabi katan')) return 'Maccabi Katan';
  if (lower.includes('maccabi noar') || lower.includes('2. maccabi noar')) return 'Maccabi Noar';
  if (lower.includes('pre-school of madrichim') || lower.includes('pre-som') || lower.includes('3.')) return 'Pre-SOM';
  if (lower.includes('school of madrichim') || lower.includes('4.')) return 'SOM';
  return 'Maccabi Katan';
}

const EXCLUDED_GRADES = ['11th', '12th'];

/**
 * Parses an Excel file (Salesforce export) and returns deduplicated Chanichim.
 * - Filters to main programs only (excludes trips, sleepovers, machanot)
 * - Deduplicates by Contact ID or Full Name
 * - Excludes 11th and 12th graders
 */
export function parseExcelFile(buffer: ArrayBuffer): { chanichim: Chanich[]; summary: ImportSummary } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

  let skippedNonMain = 0;
  let excludedGradesCount = 0;

  // Step 1: Map all valid rows with main programs
  const mainProgramRows: Chanich[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fullName = row['Full Name']?.toString().trim();
    const courseOption = row['Full Course Option Name']?.toString().trim() || '';

    if (!fullName) continue;

    // Skip non-main program courses (trips, sleepovers, machanot)
    if (!isMainProgramCourse(courseOption)) {
      skippedNonMain++;
      continue;
    }

    const program = parseProgramFromCourse(courseOption);
    const gradeLevel = parseGrade(row['Grade']?.toString() || '');

    // Skip 11th and 12th graders
    if (EXCLUDED_GRADES.includes(gradeLevel)) {
      excludedGradesCount++;
      continue;
    }

    mainProgramRows.push({
      id: row['Contact ID']?.toString() || `import-${i}`,
      fullName,
      gender: row['Gender']?.toString() || '',
      accountName: row['Account Name']?.toString() || '',
      age: Number(row['Age']) || 0,
      emergencyContactName: row['Emergency Contact Name']?.toString() || '',
      grade: row['Grade']?.toString() || '',
      school: row['School']?.toString() || '',
      allergies: row['Allergies']?.toString() || 'No',
      emergencyPhone: row['Emergency Phone']?.toString() || '',
      jewishIdentification: row['Jewish Identification']?.toString() || '',
      communityService: row['Community Service']?.toString() || '',
      keepKosher: row['Keep Kosher']?.toString() || '',
      primaryEmail: row['Primary Email']?.toString() || '',
      primaryPhone: row['Primary Phone']?.toString() || '',
      contactPhone: row['Contact Phone']?.toString() || '',
      allEmails: row['All Emails']?.toString() || '',
      enrollmentId: row['Enrollment ID']?.toString() || '',
      contactId: row['Contact ID']?.toString() || '',
      courseOptionId: row['Course Option ID']?.toString() || '',
      fullCourseOption: courseOption,
      program,
      gradeLevel,
    });
  }

  // Step 2: Deduplicate by Contact ID (or Full Name as fallback)
  const seen = new Set<string>();
  const deduplicated: Chanich[] = [];

  for (const c of mainProgramRows) {
    const key = c.contactId || c.fullName;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(c);
    }
  }

  // Step 3: Sort by name
  deduplicated.sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Build summary
  const summary: ImportSummary = {
    totalRows: rows.length,
    totalImported: deduplicated.length,
    duplicatesRemoved: mainProgramRows.length - deduplicated.length,
    excludedGrades: excludedGradesCount,
    skippedNonMain,
    byProgram: {
      'Maccabi Katan': deduplicated.filter(c => c.program === 'Maccabi Katan').length,
      'Maccabi Noar': deduplicated.filter(c => c.program === 'Maccabi Noar').length,
      'Pre-SOM': deduplicated.filter(c => c.program === 'Pre-SOM').length,
      'SOM': deduplicated.filter(c => c.program === 'SOM').length,
    },
    byGrade: {},
  };

  const gradeOrder = ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  deduplicated.forEach(c => {
    summary.byGrade[c.gradeLevel] = (summary.byGrade[c.gradeLevel] || 0) + 1;
  });

  // Sort byGrade by grade order
  const sortedByGrade: Record<string, number> = {};
  gradeOrder.forEach(g => {
    if (summary.byGrade[g]) sortedByGrade[g] = summary.byGrade[g];
  });
  // Add any grades not in the standard order
  Object.keys(summary.byGrade).forEach(g => {
    if (!sortedByGrade[g]) sortedByGrade[g] = summary.byGrade[g];
  });
  summary.byGrade = sortedByGrade;

  return { chanichim: deduplicated, summary };
}

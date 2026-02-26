import * as XLSX from 'xlsx';
import { Chanich, Program } from '@/types';

export interface ImportSummary {
  totalRows: number;
  totalImported: number;
  duplicatesRemoved: number;
  skippedNonMain: number;
  byProgram: Record<string, number>;
  byGrade: Record<string, number>;
}

/**
 * Flexible column getter: tries multiple possible column names.
 * Handles both Salesforce export format and simplified headers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getField(row: any, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key].toString().trim();
    }
  }
  return '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNumField(row: any, ...keys: string[]): number {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return Number(row[key]) || 0;
    }
  }
  return 0;
}

/**
 * Full Course Option Name format (pipe-delimited):
 *   segment[0] = "Hebraica"
 *   segment[1] = Program: "1. Maccabi Katan (K-5 Grade)", "2. Maccabi Noar...", etc.
 *   segment[2] = Season: "2025/2026 Maccabi Katan", etc.
 *   segment[3] = Group: "Katan - 1st Grade", "Noar 6th Grade", "Pre-SOM 9th Grade", etc.
 *   segment[4] = Day: "Saturday; ", "Monday; Saturday; ", etc.
 *
 * Main programs: numbers 1-4
 * Special events: 6 (Trips), 7 (Machanot/Sleepovers)
 */

/**
 * Checks if a course option is a main program (1-4) vs special event (6-7).
 */
function isMainProgramCourse(courseOption: string): boolean {
  const segments = courseOption.split('|');
  const programSegment = (segments[1] || '').trim().toLowerCase();
  return (
    programSegment.startsWith('1.') ||
    programSegment.startsWith('2.') ||
    programSegment.startsWith('3.') ||
    programSegment.startsWith('4.')
  );
}

/**
 * Determines the program from the course option (using segment[1]).
 */
function parseProgramFromCourse(courseOption: string): Program {
  const segments = courseOption.split('|');
  const programSegment = (segments[1] || '').trim().toLowerCase();

  if (programSegment.startsWith('1.')) return 'Maccabi Katan';
  if (programSegment.startsWith('2.')) return 'Maccabi Noar';
  if (programSegment.startsWith('3.')) return 'Pre-SOM';
  if (programSegment.startsWith('4.')) return 'SOM';
  return 'Maccabi Katan';
}

/**
 * Extracts the grade level from the course option (using segment[3]).
 *
 * Examples:
 *   "Katan - 1st Grade"          → "1st"
 *   "Katan - Kinder"             → "K"
 *   "Noar 6th Grade"             → "6th"
 *   "Pre-SOM 9th Grade"          → "9th"
 *   "SOM 10th Grade (MEMBERS ONLY)" → "10th"
 */
function parseGradeFromCourseOption(courseOption: string): string {
  const segments = courseOption.split('|');
  const groupSegment = (segments[3] || '').trim();

  if (!groupSegment) return 'N/A';

  const lower = groupSegment.toLowerCase();

  // Kindergarten
  if (lower.includes('kinder')) return 'K';

  // Try to extract Nth Grade pattern
  const match = lower.match(/(\d+)(?:st|nd|rd|th)\s*grade/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 1) return '1st';
    if (num === 2) return '2nd';
    if (num === 3) return '3rd';
    return `${num}th`;
  }

  // Fallback: try just a number
  const numMatch = lower.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num === 1) return '1st';
    if (num === 2) return '2nd';
    if (num === 3) return '3rd';
    if (num >= 4 && num <= 12) return `${num}th`;
  }

  return 'N/A';
}

/**
 * Parses an Excel file (Salesforce export) and returns deduplicated Chanichim.
 *
 * Key logic:
 * - Grade is determined from Full Course Option Name (segment 3), NOT from Contact: Grade
 * - Only main programs (1-4) are included; trips (6) and machanot (7) are skipped
 * - Deduplicates by Contact ID to avoid counting a person twice
 */
export function parseExcelFile(buffer: ArrayBuffer): { chanichim: Chanich[]; summary: ImportSummary } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  let skippedNonMain = 0;
  const mainProgramRows: Chanich[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Get full name
    const fullName = getField(row,
      'Registration: Contact: Full Name',
      'Full Name',
      'Name'
    );

    // Get course option name
    const courseOption = getField(row,
      'Full Course Option Name',
      'Course Option Name'
    );

    if (!fullName || !courseOption) continue;

    // Skip non-main programs (trips, sleepovers, machanot = categories 6, 7)
    if (!isMainProgramCourse(courseOption)) {
      skippedNonMain++;
      continue;
    }

    // Extract program and grade from the course option name
    const program = parseProgramFromCourse(courseOption);
    const gradeLevel = parseGradeFromCourseOption(courseOption);

    const contactId = getField(row,
      'Contact: Contact ID',
      'Contact ID'
    );

    mainProgramRows.push({
      id: contactId || `import-${i}`,
      fullName,
      gender: getField(row, 'Contact: Gender', 'Gender'),
      accountName: getField(row, 'Registration: Account: Account Name', 'Account Name'),
      age: getNumField(row, 'Contact: Age', 'Age'),
      emergencyContactName: getField(row,
        'Registration: Account: Emergency Contact 1 Name',
        'Emergency Contact Name'
      ),
      grade: getField(row, 'Contact: Grade', 'Grade'),
      school: getField(row, 'Contact: School', 'School'),
      allergies: getField(row, 'Contact: Allergies', 'Allergies') || 'No',
      emergencyPhone: getField(row,
        'Registration: Account: Emergency Contact 1 Cell Phone',
        'Emergency Phone'
      ),
      jewishIdentification: getField(row,
        'Registration: Account: Self-Identifies as Jewish',
        'Jewish Identification'
      ),
      communityService: getField(row,
        'Contact: Jewish Community Service',
        'Community Service'
      ),
      keepKosher: getField(row,
        'Registration: Account: Keep Kosher',
        'Keep Kosher'
      ),
      primaryEmail: getField(row,
        'Registration: Account: Primary Contact Email',
        'Primary Email'
      ),
      primaryPhone: getField(row,
        'Registration: Account: Phone',
        'Primary Phone'
      ),
      contactPhone: getField(row,
        'Contact: Account Name: Primary Contact Phone',
        'Contact Phone'
      ),
      allEmails: getField(row, 'Contact: All Emails', 'All Emails'),
      enrollmentId: getField(row, 'Course Option Enrollment ID', 'Enrollment ID'),
      contactId,
      courseOptionId: getField(row, 'Course Option: Course Option ID', 'Course Option ID'),
      fullCourseOption: courseOption,
      program,
      gradeLevel,
    });
  }

  // Deduplicate by Contact ID (or Full Name as fallback)
  // A person enrolled in the main program only appears once
  const seen = new Set<string>();
  const deduplicated: Chanich[] = [];

  for (const c of mainProgramRows) {
    const key = c.contactId || c.fullName;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(c);
    }
  }

  // Sort alphabetically
  deduplicated.sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Build summary
  const summary: ImportSummary = {
    totalRows: rows.length,
    totalImported: deduplicated.length,
    duplicatesRemoved: mainProgramRows.length - deduplicated.length,
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

  // Sort byGrade in logical order
  const sortedByGrade: Record<string, number> = {};
  gradeOrder.forEach(g => {
    if (summary.byGrade[g]) sortedByGrade[g] = summary.byGrade[g];
  });
  // Add any unexpected grades at the end
  Object.keys(summary.byGrade).forEach(g => {
    if (!sortedByGrade[g]) sortedByGrade[g] = summary.byGrade[g];
  });
  summary.byGrade = sortedByGrade;

  return { chanichim: deduplicated, summary };
}

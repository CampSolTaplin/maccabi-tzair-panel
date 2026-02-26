import * as XLSX from 'xlsx';
import { Chanich, Program } from '@/types';
import { parseGrade } from './utils';

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
 * Column mapping: tries Salesforce format first, then simple format as fallback.
 * This makes the parser work with both raw Salesforce exports and cleaned-up files.
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
 */
function parseProgramFromCourse(courseOption: string): Program {
  const lower = courseOption.toLowerCase();
  if (lower.includes('maccabi katan') || lower.includes('1. maccabi katan')) return 'Maccabi Katan';
  if (lower.includes('maccabi noar') || lower.includes('2. maccabi noar')) return 'Maccabi Noar';
  if (lower.includes('pre-school of madrichim') || lower.includes('pre-som') || lower.includes('3. maccabi pre')) return 'Pre-SOM';
  if (lower.includes('school of madrichim') || lower.includes('4. school')) return 'SOM';
  return 'Maccabi Katan';
}

const EXCLUDED_GRADES = ['11th', '12th'];

/**
 * Parses an Excel file (Salesforce export) and returns deduplicated Chanichim.
 * Handles both Salesforce column names and simplified column names.
 */
export function parseExcelFile(buffer: ArrayBuffer): { chanichim: Chanich[]; summary: ImportSummary } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  let skippedNonMain = 0;
  let excludedGradesCount = 0;

  const mainProgramRows: Chanich[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Get full name — try Salesforce format first, then simple
    const fullName = getField(row,
      'Registration: Contact: Full Name',
      'Full Name',
      'Name',
      'Nombre'
    );

    // Get course option name
    const courseOption = getField(row,
      'Full Course Option Name',
      'Course Option Name',
      'Program'
    );

    if (!fullName) continue;

    // Skip non-main program courses (trips, sleepovers, machanot)
    if (courseOption && !isMainProgramCourse(courseOption)) {
      skippedNonMain++;
      continue;
    }

    const program = parseProgramFromCourse(courseOption);

    const gradeRaw = getField(row,
      'Contact: Grade',
      'Grade',
      'Grado'
    );
    const gradeLevel = parseGrade(gradeRaw);

    // Skip 11th and 12th graders
    if (EXCLUDED_GRADES.includes(gradeLevel)) {
      excludedGradesCount++;
      continue;
    }

    const contactId = getField(row,
      'Contact: Contact ID',
      'Contact ID',
      'ContactID'
    );

    mainProgramRows.push({
      id: contactId || `import-${i}`,
      fullName,
      gender: getField(row, 'Contact: Gender', 'Gender'),
      accountName: getField(row, 'Registration: Account: Account Name', 'Account Name'),
      age: getNumField(row, 'Contact: Age', 'Age'),
      emergencyContactName: getField(row,
        'Registration: Account: Emergency Contact 1 Name',
        'Emergency Contact Name',
        'Emergency Contact'
      ),
      grade: gradeRaw,
      school: getField(row, 'Contact: School', 'School'),
      allergies: getField(row, 'Contact: Allergies', 'Allergies') || 'No',
      emergencyPhone: getField(row,
        'Registration: Account: Emergency Contact 1 Cell Phone',
        'Emergency Phone',
        'Emergency Cell Phone'
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
        'Primary Email',
        'Email'
      ),
      primaryPhone: getField(row,
        'Registration: Account: Phone',
        'Primary Phone',
        'Phone'
      ),
      contactPhone: getField(row,
        'Contact: Account Name: Primary Contact Phone',
        'Contact Phone'
      ),
      allEmails: getField(row,
        'Contact: All Emails',
        'All Emails'
      ),
      enrollmentId: getField(row,
        'Course Option Enrollment ID',
        'Enrollment ID'
      ),
      contactId,
      courseOptionId: getField(row,
        'Course Option: Course Option ID',
        'Course Option ID'
      ),
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
  Object.keys(summary.byGrade).forEach(g => {
    if (!sortedByGrade[g]) sortedByGrade[g] = summary.byGrade[g];
  });
  summary.byGrade = sortedByGrade;

  return { chanichim: deduplicated, summary };
}

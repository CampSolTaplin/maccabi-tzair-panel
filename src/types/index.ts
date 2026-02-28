export interface Chanich {
  id: string;
  fullName: string;
  gender: string;
  accountName: string;
  age: number;
  emergencyContactName: string;
  grade: string;
  school: string;
  allergies: string;
  emergencyPhone: string;
  jewishIdentification: string;
  communityService: string;
  keepKosher: string;
  primaryEmail: string;
  primaryPhone: string;
  contactPhone: string;
  allEmails: string;
  enrollmentId: string;
  contactId: string;
  courseOptionId: string;
  fullCourseOption: string;
  program: Program;
  gradeLevel: string;
}

export type Program = 'SOM';

// ── SOM Attendance ──

export interface SOMMember {
  firstName: string;
  lastName: string;
  fullName: string;
  contactId: string;
}

/** true = present, false = absent, null = no data */
export type SOMAttendanceValue = boolean | null;

export interface SOMAttendanceData {
  members: SOMMember[];
  /** ISO date strings like "2025-09-17" */
  dates: string[];
  /** Map: contactId -> { [date]: true/false/null } */
  records: Record<string, Record<string, SOMAttendanceValue>>;
  /** Monthly groupings for display */
  months: { name: string; dates: string[] }[];
}

export interface Activity {
  id: string;
  name: string;
  type: 'shabat' | 'sleepover' | 'machaneh' | 'trip' | 'special';
  date: string;
  endDate?: string;
  registeredCount: number;
  description?: string;
  location?: string;
}

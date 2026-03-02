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
  dates: string[];
  records: Record<string, Record<string, SOMAttendanceValue>>;
  months: { name: string; dates: string[] }[];
}

// ── Community Hours ──

export interface CommunityEvent {
  id: string;
  name: string;
  date: string;
  /** Real duration of the event in hours */
  realHours: number;
  /** Community hours awarded per real hour (1-4) */
  multiplier: number;
  /** Contact IDs of members who attended */
  attendees: string[];
}

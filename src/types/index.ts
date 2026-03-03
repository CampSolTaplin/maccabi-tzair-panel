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

export type Program = 'Katan' | 'Noar' | 'Pre-SOM' | 'SOM' | 'Trips' | 'Machanot';

/** Full roster imported from Salesforce */
export interface RosterData {
  chanichim: Chanich[];
  importedAt: string;
  sourceFileName: string;
}

// ── Multi-group Attendance (roster-based) ──

/** true = present, false = absent, 'late' = late, null = no data */
export type AttendanceValue = boolean | 'late' | null;

/** Attendance data per group: group -> contactId -> date -> value */
export type GroupAttendanceData = Record<string, Record<string, Record<string, AttendanceValue>>>;

// ── SOM Attendance (legacy Excel import) ──

export interface SOMMember {
  firstName: string;
  lastName: string;
  fullName: string;
  contactId: string;
}

/** true = present, false = absent, 'late' = late (half hours), null = no data */
export type SOMAttendanceValue = boolean | 'late' | null;

export interface SOMAttendanceData {
  members: SOMMember[];
  dates: string[];
  records: Record<string, Record<string, SOMAttendanceValue>>;
  months: { name: string; dates: string[] }[];
}

// ── Member Management ──

export type MemberStatus = 'active' | 'dropped';

export interface MemberOverride {
  status: MemberStatus;
  /** ISO date when status changed */
  statusDate: string;
}

/** Manually added members (not from Excel) */
export interface AddedMember {
  firstName: string;
  lastName: string;
  fullName: string;
  contactId: string;
  /** ISO date when member was added */
  joinDate: string;
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

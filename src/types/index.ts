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
  // Computed fields
  program: Program;
  gradeLevel: string;
}

export type Program =
  | 'Maccabi Katan'
  | 'Maccabi Noar'
  | 'Pre-SOM'
  | 'SOM'
  | 'Madrichim'
  | 'Sr. Madrichim';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  chanichId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  program: Program;
  activityId?: string;
}

export interface CommunityHours {
  id: string;
  chanichId: string;
  hours: number;
  activity: string;
  date: string;
  verified: boolean;
  verifiedBy?: string;
}

export interface Activity {
  id: string;
  name: string;
  type: 'shabat' | 'sleepover' | 'machaneh' | 'trip' | 'special';
  date: string;
  endDate?: string;
  programs: Program[];
  grades: string[];
  registeredCount: number;
  description?: string;
  location?: string;
}

export interface KPIData {
  totalChanichim: number;
  totalMadrichim: number;
  avgAttendance: number;
  totalCommunityHours: number;
}

export interface GradeGroup {
  id: string;
  label: string;
  program: Program;
  realCount: number;
  schedule: string;
  color: string;
}

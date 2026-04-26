export enum UserRole {
  STUDENT = 'STUDENT',
  LEAD = 'LEAD',
  FACULTY = 'FACULTY'
}

export enum AttendanceStatus {
  NOT_DECLARED = 'NOT_DECLARED',
  DECLARED = 'DECLARED', // Student says "I was there"
  PRESENT = 'PRESENT',   // Lead confirms
  ABSENT = 'ABSENT',     // Lead marks absent or rejects
  EXCUSED = 'EXCUSED'    // Faculty excuses for conflict
}

export interface Club {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  // Student specific fields
  admissionNumber?: string; 
  division?: string;
  collegeYear?: string;
  committee?: string;
  branch?: string;          
  year?: string;
  joinedClubIds?: string[]; 
  // Lead specific fields
  clubId?: string;          
  position?: string;
  // Faculty specific fields
  employeeNumber?: string;
  committeeCoordinator?: string;
}

export interface Meeting {
  id: string;
  clubId: string;
  clubName: string;
  title: string;       // Purpose of meeting
  description?: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  location: string;    // Venue
  status: 'SCHEDULED' | 'COMPLETED';
  createdBy?: string;
}

export interface AttendanceRecord {
  id: string;
  meetingId: string;
  studentId: string;
  studentName: string;
  studentAdmissionNumber?: string;
  studentDiv?: string;
  studentYear?: string;
  studentDepartment?: string;
  missedLecture?: string;
  status: AttendanceStatus;
  timestamp?: any;
  createdAt?: any;
}

export interface Announcement {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  content: string;
  date: string;
  priority?: 'NORMAL' | 'HIGH';
}

export interface LectureConflict {
  id: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  timeSlot: string;
  affectedStudents: number;
}
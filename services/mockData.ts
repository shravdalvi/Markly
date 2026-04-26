import { User, UserRole, Club, Meeting, AttendanceRecord, AttendanceStatus, Announcement } from '../types';

export const CLUBS: Club[] = [
  {
    id: 'gdg',
    name: 'GDG',
    category: 'Technical',
    description: 'Google Developer Groups - connecting developers and exploring new technologies.'
  },
  {
    id: 'gfg',
    name: 'GFG',
    category: 'Technical',
    description: 'GeeksforGeeks Student Chapter - focusing on data structures and algorithms.'
  },
  {
    id: 'hackoverflow',
    name: 'HackoverFlow',
    category: 'Technical',
    description: 'Coding committee dedicated to hackathons and competitive programming.'
  },
  {
    id: 'csi',
    name: 'CSI',
    category: 'Technical',
    description: 'Computer Society of India - fostering IT professionals and students.'
  },
  {
    id: 'euforia',
    name: 'Euforia',
    category: 'Cultural',
    description: 'The heartbeat of campus culture, organizing major fests and events.'
  },
  {
    id: 'tpc',
    name: 'TPC',
    category: 'Professional',
    description: 'Training and Placement Cell - preparing students for their professional careers.'
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Student',
    email: 'student@markly.edu',
    role: UserRole.STUDENT,
    admissionNumber: '2024HE0064',
    branch: 'Computer Engineering',
    year: '3rd Year',
    joinedClubIds: ['gdg', 'gfg']
  },
  {
    id: 'u2',
    name: 'Sarah Lead',
    email: 'lead@markly.edu',
    role: UserRole.LEAD,
    clubId: 'gdg', // Lead of GDG
    admissionNumber: '2023HE0012',
    branch: 'Computer Engineering',
    year: '4th Year'
  },
  {
    id: 'u3',
    name: 'Dr. Alan Grant',
    email: 'faculty@markly.edu',
    role: UserRole.FACULTY,
    branch: 'Computer Engineering'
  }
];

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    clubId: 'gdg',
    clubName: 'GDG',
    title: 'Hackathon Prep',
    description: 'Team formation and theme discussion for the upcoming Hex-Hackathon.',
    date: '2026-10-25',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Lab 304, IT Building',
    status: 'COMPLETED'
  },
  {
    id: 'm2',
    clubId: 'gdg',
    clubName: 'GDG',
    title: 'Intro to Generative AI',
    description: 'Guest lecture on LLM architecture and fine-tuning.',
    date: '2026-11-02',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Seminar Hall A',
    status: 'SCHEDULED'
  },
  {
    id: 'm3',
    clubId: 'gfg',
    clubName: 'GFG',
    title: 'Drone Motor Assembly',
    description: 'Hands-on workshop for calibrating BLDC motors.',
    date: '2026-11-05',
    startTime: '15:00',
    endTime: '17:00',
    location: 'Workshop Bay 2',
    status: 'SCHEDULED'
  }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'a1',
    meetingId: 'm1',
    studentId: 'u1',
    studentName: 'Alex Student',
    studentAdmissionNumber: '2024HE0064',
    studentDiv: 'A',
    studentYear: '3rd Year',
    studentDepartment: 'Computer Engineering',
    status: AttendanceStatus.PRESENT,
    timestamp: '2026-10-25T14:05:00'
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann1',
    clubId: 'gdg',
    clubName: 'GDG',
    title: 'Registration Open: Hex-Hackathon',
    content: 'Registration is now live! Form teams of 4 and submit your ideas by Friday.',
    date: '2026-10-20',
    priority: 'HIGH'
  },
  {
    id: 'ann2',
    clubId: 'gfg',
    clubName: 'GFG',
    title: 'Lab Maintenance Schedule',
    content: 'The robotics lab will be closed for maintenance this Saturday.',
    date: '2026-10-22',
    priority: 'NORMAL'
  }
];

export const MOCK_CONFLICTS = [
  {
    id: 'con1',
    subjectCode: 'CS302',
    subjectName: 'Database Management',
    date: '2026-10-25',
    timeSlot: '14:00 - 15:00',
    affectedStudents: 12
  }
];
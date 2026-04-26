import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Meeting, AttendanceStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

declare const gsap: any;

// ── Common academic subjects for autocomplete ─────────────────────────────────
const COMMON_SUBJECTS = [
  'Data Structures & Algorithms',
  'Database Management Systems',
  'Operating Systems',
  'Computer Networks',
  'Software Engineering',
  'Object Oriented Programming',
  'Discrete Mathematics',
  'Engineering Mathematics',
  'Digital Electronics',
  'Microprocessors',
  'Theory of Computation',
  'Compiler Design',
  'Machine Learning',
  'Artificial Intelligence',
  'Web Technology',
  'Computer Graphics',
  'Embedded Systems',
  'Data Warehousing & Mining',
  'Information Security',
  'Mobile Application Development',
];

// ── Missed Lecture Modal ──────────────────────────────────────────────────────
interface MissedLectureModalProps {
  meeting: Meeting;
  onConfirm: (missedLecture: string) => void;
  onCancel: () => void;
}

const MissedLectureModal: React.FC<MissedLectureModalProps> = ({ meeting, onConfirm, onCancel }) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');

  const handleConfirm = () => {
    let val = '';
    if (selectedOption === 'None') {
      val = 'None';
    } else if (selectedOption === 'Other') {
      val = customInput.trim();
    } else {
      val = selectedOption;
    }

    if (!val && selectedOption !== 'None') return;
    onConfirm(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fade-in">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 text-lg flex-shrink-0">
              📚
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight">Which lecture are you missing?</h3>
              <p className="text-xs text-slate-500 mt-0.5">For attending <span className="font-semibold text-primary-700">{meeting.title}</span></p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500 border border-slate-200 flex items-center gap-2 mt-3">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This will be visible to your faculty for OD approval.
          </div>
        </div>

        {/* Input */}
        <div className="relative mb-4 space-y-3">
          <label className="block text-sm font-bold text-slate-700 mb-2">Select Subject / Lecture</label>
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white transition-all text-sm font-medium appearance-none"
          >
            <option value="" disabled>-- Choose an Option --</option>
            <option value="None">None (No lecture skipped / Free lecture)</option>
            {COMMON_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
            <option value="Other">Add Custom Lecture (Not in list)</option>
          </select>

          {selectedOption === 'Other' && (
            <div className="mt-3 animate-fade-in">
              <label className="block text-xs font-bold text-slate-600 mb-1">Custom Lecture Name</label>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. Workshop on AI"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white transition-all text-sm font-medium"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="ghost"
            fullWidth
            onClick={onCancel}
            className="text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={handleConfirm}
            disabled={!selectedOption || (selectedOption === 'Other' && !customInput.trim())}
            className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm Attending
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [activeTab,      setActiveTab]      = useState<'active' | 'history'>('active');
  const [isSubmitting,   setIsSubmitting]   = useState<string | null>(null);

  const [activeMeetings, setActiveMeetings] = useState<Meeting[]>([]);
  const [allMeetingsMap, setAllMeetingsMap] = useState<Record<string, Meeting>>({});
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);

  // Modal state
  const [pendingAttend, setPendingAttend] = useState<Meeting | null>(null);

  // ── Real-time meetings ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const myCommittee = (user as any).committee || 'None';

    const unsubMeetings = onSnapshot(collection(db, 'meetings'), snap => {
      const fetchedMeetings = snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id:        docSnap.id,
          clubId:    data.clubId    || '',
          clubName:  data.clubName  || 'Unknown Club',
          title:     data.title     || '(Untitled)',
          date:      data.date      || '',
          startTime: data.startTime || '',
          endTime:   data.endTime   || '',
          location:  data.location  || '',
          status:    data.status    || 'scheduled',
        } as Meeting;
      });

      // Build lookup map for history join
      const map: Record<string, Meeting> = {};
      fetchedMeetings.forEach(m => { map[m.id] = m; });
      setAllMeetingsMap(map);

      const relevant = fetchedMeetings
        .filter(m =>
          (m.clubName === myCommittee) &&
          m.status.toLowerCase() === 'scheduled'
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setActiveMeetings(relevant);
    });

    return () => unsubMeetings();
  }, [user]);

  // ── Real-time attendance history ────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const unsubAttendance = onSnapshot(
      query(collection(db, 'attendance'), where('studentId', '==', user.id)),
      snap => {
        const records = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => {
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return tb - ta;
          });
        setHistoryRecords(records);
      }
    );

    return () => unsubAttendance();
  }, [user]);

  // ── Animations ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(
        '.attendance-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [activeTab, activeMeetings.length]);

  // ── Step 1: Student clicks "Attending" → show modal ────────────────────
  const handleAttendingClick = (meeting: Meeting) => {
    setPendingAttend(meeting);
  };

  // ── Step 2: Student confirms with missed lecture → write to Firestore ──
  const handleDeclareAttending = async (meeting: Meeting, missedLecture: string) => {
    if (!user) return;
    setPendingAttend(null);
    setIsSubmitting(meeting.id);

    try {
      await addDoc(collection(db, 'attendance'), {
        meetingId:              meeting.id,
        meetingTitle:           meeting.title,
        meetingClubName:        meeting.clubName,
        meetingDate:            meeting.date,
        meetingStartTime:       meeting.startTime,
        meetingEndTime:         meeting.endTime,
        studentId:              user.id,
        studentName:            user.name || 'Unknown Student',
        studentAdmissionNumber: (user as any).admissionNumber || 'UNKNOWN',
        studentDiv:             (user as any).division || '',
        studentYear:            (user as any).collegeYear || (user as any).year || '',
        studentDepartment:      (user as any).department || (user as any).branch || '',
        studentPosition:        (user as any).position || 'Member',
        missedLecture,          // ← shown in faculty conflicts
        status:                 'DECLARED',
        createdAt:              serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    } finally {
      setIsSubmitting(null);
    }
  };

  // ── Step 3: Student clicks "Not Attending" → direct write ──────────────
  const handleNotAttending = async (meeting: Meeting) => {
    if (!user) return;
    setIsSubmitting(meeting.id);

    try {
      await addDoc(collection(db, 'attendance'), {
        meetingId:              meeting.id,
        meetingTitle:           meeting.title,
        meetingClubName:        meeting.clubName,
        meetingDate:            meeting.date,
        meetingStartTime:       meeting.startTime,
        meetingEndTime:         meeting.endTime,
        studentId:              user.id,
        studentName:            user.name || 'Unknown Student',
        studentAdmissionNumber: (user as any).admissionNumber || 'UNKNOWN',
        studentDiv:             (user as any).division || '',
        studentYear:            (user as any).collegeYear || (user as any).year || '',
        studentDepartment:      (user as any).department || (user as any).branch || '',
        studentPosition:        (user as any).position || 'Member',
        missedLecture:          '',
        status:                 'ABSENT',
        createdAt:              serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <>
      {/* Modal overlay */}
      {pendingAttend && (
        <MissedLectureModal
          meeting={pendingAttend}
          onConfirm={missedLecture => handleDeclareAttending(pendingAttend, missedLecture)}
          onCancel={() => setPendingAttend(null)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance Portal</h2>
            <p className="text-slate-500 mt-2 text-lg">Mark your presence for active club sessions.</p>
          </div>

          {/* Tab Switcher */}
          <div className="bg-slate-100 p-1 rounded-lg flex">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'active' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Active Sessions
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              My History
            </button>
          </div>
        </div>

        {/* VIEW 1: Active Meetings */}
        {activeTab === 'active' && (
          <div className="grid md:grid-cols-2 gap-6">
            {activeMeetings.length > 0 ? (
              activeMeetings.map(meeting => {
                const hasMarked = historyRecords.find(r => r.meetingId === meeting.id);
                const isBusy = isSubmitting === meeting.id;

                return (
                  <div key={meeting.id} className="attendance-card bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all relative">
                    {/* Status Stripe */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live Now
                        </span>
                        <span className="text-slate-400 text-xs font-mono">{meeting.date}</span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-800 mb-1">{meeting.title}</h3>
                      <p className="text-primary-600 font-medium text-sm mb-6">{meeting.clubName}</p>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span>{meeting.startTime} – {meeting.endTime}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span>{meeting.location}</span>
                        </div>
                      </div>

                      {hasMarked ? (
                        <div className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Your Response</div>
                          <Badge status={hasMarked.status} size="sm" />
                          {hasMarked.missedLecture && (
                            <div className="mt-2 text-xs text-red-600 font-medium">
                              Missing: {hasMarked.missedLecture}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <Button
                            fullWidth
                            onClick={() => handleAttendingClick(meeting)}
                            disabled={isBusy}
                            className={isBusy ? 'bg-slate-100 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-md'}
                          >
                            {isBusy ? (
                              <span className="flex items-center gap-2 justify-center">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Saving...
                              </span>
                            ) : 'Attending'}
                          </Button>
                          <Button
                            fullWidth
                            onClick={() => handleNotAttending(meeting)}
                            disabled={isBusy}
                            className={isBusy ? 'bg-slate-100 text-slate-500' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 shadow-md'}
                          >
                            Not Attending
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">😴</div>
                <h3 className="text-lg font-bold text-slate-700">No Active Sessions</h3>
                <p className="text-slate-400 text-sm mt-1">There are no ongoing meetings for your clubs right now.</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: History Table */}
        {activeTab === 'history' && (
          <div className="attendance-card bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Meeting</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Missed Lecture</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyRecords.length > 0 ? (
                    historyRecords.map((record: any) => {
                      // Join with live meetings map for best data
                      const m = allMeetingsMap[record.meetingId];
                      const title    = m?.title    || record.meetingTitle    || 'Unknown Meeting';
                      const clubName = m?.clubName || record.meetingClubName || '';
                      const date     = m?.date     || record.meetingDate     || '—';

                      return (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-slate-500">{date}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-800">{title}</div>
                            {clubName && <div className="text-xs text-primary-600 font-medium mt-0.5">{clubName}</div>}
                          </td>
                          <td className="px-6 py-4">
                            {record.missedLecture ? (
                              <span className="text-sm text-red-600 font-medium">{record.missedLecture}</span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={record.status} size="sm" />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                        No attendance history yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
};
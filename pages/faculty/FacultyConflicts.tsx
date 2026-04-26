import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { db } from '../../firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';

declare const gsap: any;

interface AttendanceRecord {
  id: string;
  meetingId: string;
  meetingTitle: string;
  meetingClubName: string;
  meetingDate: string;
  meetingStartTime: string;
  meetingEndTime: string;
  studentId: string;
  studentName: string;
  studentAdmissionNumber: string;
  studentDiv?: string;
  studentYear?: string;
  studentDepartment?: string;
  studentPosition?: string;
  missedLecture: string;   // The academic class the student is missing
  status: string;
}

interface GroupedConflict {
  meetingId: string;
  meetingName: string;
  clubName: string;
  date: string;
  timeSlot: string;
  records: AttendanceRecord[];
}

export const FacultyConflicts: React.FC = () => {
  const [allRecords,     setAllRecords]     = useState<AttendanceRecord[]>([]);
  const [allMeetings,    setAllMeetings]    = useState<Record<string, any>>({});
  const [allUsers,       setAllUsers]       = useState<Record<string, any>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [loading,        setLoading]        = useState(true);

  // ── Fetch all meetings (for joining meeting details) ─────────────────────
  useEffect(() => {
    const unsubMeetings = onSnapshot(collection(db, 'meetings'), snap => {
      const map: Record<string, any> = {};
      snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
      setAllMeetings(map);
    });
    return () => unsubMeetings();
  }, []);

  // ── Fetch all users (for joining live student details) ───────────────────
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      const map: Record<string, any> = {};
      snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
      setAllUsers(map);
    });
    return () => unsubUsers();
  }, []);

  // ── Fetch conflicts in real-time ──────────────────────────────────────────
  useEffect(() => {
    const unsubAtt = onSnapshot(
      collection(db, 'attendance'),
      snap => {
        const recs: AttendanceRecord[] = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as AttendanceRecord))
          .filter(r => {
            const st = (r.status || '').toUpperCase();
            // Faculty only needs to approve if they haven't already and the lead didn't reject
            const isPendingOD = st === 'DECLARED' || st === 'PRESENT';
            // It's only a conflict if they actually missed a lecture
            const hasConflict = r.missedLecture && r.missedLecture.toLowerCase() !== 'none';
            return isPendingOD && hasConflict;
          });
        setAllRecords(recs);
        setLoading(false);
        // Animate new items
        setTimeout(() => {
          if (typeof gsap !== 'undefined') {
            gsap.fromTo('.group-card',
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
            );
          }
        }, 100);
      }
    );
    return () => unsubAtt();
  }, []);

  // ── Group records by meeting ─────────────────────────────────────────────
  const groupedData = (): GroupedConflict[] => {
    const groups: Record<string, GroupedConflict> = {};

    allRecords.forEach(rec => {
      const meeting = allMeetings[rec.meetingId];
      const meetingTitle = meeting?.title || rec.meetingTitle || '(Unknown Meeting)';
      const clubName     = meeting?.clubName || rec.meetingClubName || '';
      const date         = meeting?.date      || rec.meetingDate     || '';
      const startTime    = meeting?.startTime  || rec.meetingStartTime || '';
      const endTime      = meeting?.endTime    || rec.meetingEndTime   || '';

      const student = allUsers[rec.studentId];
      const mergedRec = {
        ...rec,
        studentName: student?.name || rec.studentName,
        studentAdmissionNumber: student?.admissionNumber || rec.studentAdmissionNumber,
        studentDiv: student?.division || rec.studentDiv,
        studentYear: student?.collegeYear || rec.studentYear,
        studentDepartment: student?.department || rec.studentDepartment,
        studentPosition: student?.position || rec.studentPosition
      };

      if (!groups[rec.meetingId]) {
        groups[rec.meetingId] = {
          meetingId:   rec.meetingId,
          meetingName: meetingTitle,
          clubName,
          date,
          timeSlot:    startTime && endTime ? `${startTime} – ${endTime}` : '',
          records:     [],
        };
      }
      groups[rec.meetingId].records.push(mergedRec);
    });

    return Object.values(groups).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const grouped = groupedData();

  const toggleGroup = (meetingId: string) => {
    setExpandedGroups(prev =>
      prev.includes(meetingId) ? prev.filter(id => id !== meetingId) : [...prev, meetingId]
    );
  };

  // ── Approve single OD ────────────────────────────────────────────────────
  const handleApprove = async (recordId: string) => {
    try {
      await updateDoc(doc(db, 'attendance', recordId), { status: 'EXCUSED' });
    } catch (err) {
      console.error('Error approving OD:', err);
    }
  };

  // ── Reject single OD (mark as ABSENT) ───────────────────────────────────
  const handleReject = async (recordId: string) => {
    try {
      await updateDoc(doc(db, 'attendance', recordId), { status: 'ABSENT' });
    } catch (err) {
      console.error('Error rejecting OD:', err);
    }
  };

  // ── Bulk approve all in a meeting group ──────────────────────────────────
  const handleBulkApprove = async (group: GroupedConflict) => {
    if (!confirm(`Approve OD for ALL ${group.records.length} students in "${group.meetingName}"?`)) return;
    const batch = writeBatch(db);
    group.records.forEach(r => {
      batch.update(doc(db, 'attendance', r.id), { status: 'EXCUSED' });
    });
    try {
      await batch.commit();
    } catch (err) {
      console.error('Error bulk approving:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance Conflicts</h2>
          <p className="text-slate-500 mt-2 text-lg">
            Real-time OD requests grouped by Club Meeting.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live — syncing with Firestore
        </div>
      </div>

      {/* Group List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-16 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : grouped.length > 0 ? (
          grouped.map(group => (
            <div key={group.meetingId} className="group-card bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Group Header (Clickable) */}
              <div
                className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleGroup(group.meetingId)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg transition-transform duration-300 ${expandedGroups.includes(group.meetingId) ? 'rotate-90' : ''}`}>
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div>
                    {/* Meeting name prominently displayed */}
                    <h3 className="text-lg font-bold text-slate-800">{group.meetingName}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-1">
                      {group.clubName && (
                        <span className="bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded text-xs font-semibold">
                          {group.clubName}
                        </span>
                      )}
                      {group.date && (
                        <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-xs">
                          {group.date}
                        </span>
                      )}
                      {group.timeSlot && <span className="text-xs">{group.timeSlot}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 md:mt-0 pl-11 md:pl-0">
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-slate-800">{group.records.length}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase">Students</span>
                  </div>

                  {/* Bulk Approve */}
                  <div onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkApprove(group)}
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                    >
                      Approve All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Students List (Collapsible) */}
              {expandedGroups.includes(group.meetingId) && (
                <div className="border-t border-slate-100 divide-y divide-slate-100 bg-white">
                  {group.records.length === 0 ? (
                    <p className="px-8 py-6 text-slate-400 text-sm">No student records found.</p>
                  ) : (
                    group.records.map(rec => (
                      <div key={rec.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">

                        {/* Student Info */}
                        <div className="flex items-center gap-4 pl-4 md:pl-12 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                            {(rec.studentName || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-700 truncate">{rec.studentName || 'Unknown Student'}</div>
                            <div className="text-xs text-slate-400 font-mono">
                              {rec.studentAdmissionNumber || rec.studentId}
                              {rec.studentDiv && ` · Div ${rec.studentDiv}`}
                              {rec.studentYear && ` · ${rec.studentYear}`}
                              {rec.studentDepartment && ` · ${rec.studentDepartment}`}
                              {rec.studentPosition && ` · ${rec.studentPosition}`}
                            </div>
                          </div>
                        </div>

                        {/* Missed Lecture */}
                        <div className="pl-16 md:pl-0 flex-shrink-0">
                          <div className="bg-red-50 px-3 py-2 rounded-lg border border-red-100 max-w-xs">
                            <div className="text-xs font-bold text-red-500 uppercase tracking-wide">Lecture Being Missed</div>
                            <div className="text-sm font-semibold text-slate-800 mt-0.5">
                              {rec.missedLecture || <span className="text-slate-400 italic font-normal">Not specified</span>}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pl-16 md:pl-0">
                          <button
                            onClick={() => handleReject(rec.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject — Mark Absent"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleApprove(rec.id)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve OD — Mark Excused"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">🎉</div>
            <h3 className="text-lg font-bold text-slate-700">No Conflicts Pending</h3>
            <p className="text-slate-400 text-sm mt-1">All attendance records have been reconciled.</p>
          </div>
        )}
      </div>
    </div>
  );
};
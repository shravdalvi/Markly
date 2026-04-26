import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole, Meeting } from '../types';
import { CLUBS } from '../services/mockData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

declare const gsap: any;

// ── Helper Components ─────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-slate-200 pb-4">
    <div>
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
      {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const MeetingCard: React.FC<{ meeting: Meeting; onClick?: () => void }> = ({ meeting, onClick }) => (
  <div
    onClick={onClick}
    className="gsap-card group cursor-pointer bg-bg-card p-6 rounded-xl border border-slate-200 shadow-card hover:shadow-soft hover:border-primary-200 transition-all duration-300 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-150 duration-500"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <Badge status={(meeting.status || 'SCHEDULED').toUpperCase()} size="sm" />
        <span className="text-xs font-mono text-slate-400 bg-bg-DEFAULT px-2 py-1 rounded border border-slate-200">
          {meeting.date}
        </span>
      </div>
      <h4 className="text-lg font-bold text-slate-800 group-hover:text-primary-700 transition-colors mb-1">
        {meeting.title}
      </h4>
      <p className="text-sm text-primary-600 font-medium mb-4">{meeting.clubName}</p>
      <div className="space-y-2 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {meeting.startTime} - {meeting.endTime}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {meeting.location}
        </div>
      </div>
    </div>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
    <p className="text-slate-400 text-sm">{message}</p>
  </div>
);

const LoadingSpinner = () => (
  <div className="col-span-full py-12 flex justify-center items-center">
    <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  </div>
);

// ── Firestore helper: map a doc to a Meeting object ───────────────────────────
const docToMeeting = (docSnap: any): Meeting => {
  const data = docSnap.data();
  return {
    id:        docSnap.id,
    clubId:    data.clubId    || '',
    clubName:  data.clubName  || CLUBS.find(c => c.id === data.clubId)?.name || 'Unknown Club',
    title:     data.title     || '(Untitled)',
    description: data.description || '',
    date:      data.date      || '',
    startTime: data.startTime || '',
    endTime:   data.endTime   || '',
    location:  data.location  || '',
    status:    data.status    || 'scheduled',
  } as Meeting;
};

// ── GSAP animate after data loads ────────────────────────────────────────────
const animateCards = () => {
  setTimeout(() => {
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(
        '.gsap-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, 100);
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [upcoming, setUpcoming]   = useState<Meeting[]>([]);
  const [history,  setHistory]    = useState<any[]>([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const myClubIds = (user as any).joinedClubIds || [];
    let allMeetings: Meeting[]  = [];
    let attendanceRecs: any[]   = [];

    const rebuildHistory = (meetings: Meeting[], records: any[]) => {
      const rows = records
        .map(rec => ({ rec, meeting: meetings.find(m => m.id === rec.meetingId) }))
        .filter(x => x.meeting)
        .sort((a, b) => new Date(b.meeting!.date).getTime() - new Date(a.meeting!.date).getTime());
      setHistory(rows);
      setLoading(false);
      animateCards();
    };

    // All meetings — student sees any club they joined
    const unsubMeetings = onSnapshot(collection(db, 'meetings'), snap => {
      allMeetings = snap.docs.map(docToMeeting);

      const relevant = allMeetings
        .filter(m =>
          myClubIds.length === 0        // if no clubs joined, show all (fallback)
          || myClubIds.includes(m.clubId)
        )
        .filter(m => (m.status || '').toLowerCase() === 'scheduled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setUpcoming(relevant);
      rebuildHistory(allMeetings, attendanceRecs);
    });

    // Student's personal attendance records
    const unsubAtt = onSnapshot(
      query(collection(db, 'attendance'), where('studentId', '==', user.id)),
      snap => {
        attendanceRecs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        rebuildHistory(allMeetings, attendanceRecs);
      }
    );

    return () => { unsubMeetings(); unsubAtt(); };
  }, [user]);

  return (
    <div className="space-y-10">
      <SectionHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Student'}`}
        subtitle={[user?.department || (user as any)?.branch, (user as any)?.collegeYear || (user as any)?.year].filter(Boolean).join(' • ')}
      />

      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-6 bg-primary-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Upcoming Schedule</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? <LoadingSpinner /> : upcoming.length > 0
            ? upcoming.map(m => <MeetingCard key={m.id} meeting={m} />)
            : <EmptyState message="No upcoming meetings scheduled for your clubs." />
          }
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-6 bg-slate-400 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Recent Attendance</h3>
        </div>
        <div className="gsap-card bg-bg-card rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Meeting</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3}><LoadingSpinner /></td></tr>
                ) : history.length > 0 ? (
                  history.map(({ rec, meeting }) => (
                    <tr key={rec.id} className="hover:bg-bg-DEFAULT transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{meeting?.date}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">{meeting?.title}</div>
                        <div className="text-xs text-slate-500">{meeting?.clubName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={rec.status.toUpperCase()} size="sm" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm">
                      No attendance history recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {history.length > 0 && (
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
              <button onClick={() => navigate('/attendance')} className="text-xs font-semibold text-primary-700 hover:text-primary-800">
                View Full History →
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEAD DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const LeadDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [past,     setPast]     = useState<Meeting[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Club name: prefer stored in Firestore doc, fallback to CLUBS list
  const myClubName = CLUBS.find(c => c.id === (user as any)?.clubId)?.name || 'Your Club';

  useEffect(() => {
    if (!user?.id) return;

    // ── KEY FIX: query by createdBy (user uid) so meetings always show
    //    regardless of whether clubId was saved correctly.
    //    We also run a parallel query by clubId for completeness.
    // ─────────────────────────────────────────────────────────────────

    const processSnapshot = (docs: any[]) => {
      const meetings: Meeting[] = docs.map(docToMeeting);

      // De-duplicate by id in case both queries return same doc
      const seen = new Set<string>();
      const unique = meetings.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

      setUpcoming(
        unique
          .filter(m => (m.status || '').toLowerCase() === 'scheduled')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
      setPast(
        unique
          .filter(m => (m.status || '').toLowerCase() === 'completed')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      setLoading(false);
      animateCards();
    };

    let docsFromCreatedBy: any[] = [];
    let docsFromClubId:    any[] = [];

    // Query 1: meetings created by this user (most reliable)
    const unsubCreatedBy = onSnapshot(
      query(collection(db, 'meetings'), where('createdBy', '==', user.id)),
      snap => {
        docsFromCreatedBy = snap.docs;
        processSnapshot([...docsFromCreatedBy, ...docsFromClubId]);
      }
    );

    // Query 2: meetings with matching clubId (for legacy/other data)
    const clubId = (user as any)?.clubId;
    let unsubClubId = () => {};
    if (clubId) {
      unsubClubId = onSnapshot(
        query(collection(db, 'meetings'), where('clubId', '==', clubId)),
        snap => {
          docsFromClubId = snap.docs;
          processSnapshot([...docsFromCreatedBy, ...docsFromClubId]);
        }
      );
    } else {
      // No clubId — just rely on createdBy query, stop loading after first result
      setLoading(false);
    }

    return () => { unsubCreatedBy(); unsubClubId(); };
  }, [user?.id, (user as any)?.clubId]);

  return (
    <div className="space-y-10">
      <SectionHeader
        title={`${myClubName} Dashboard`}
        subtitle="Committee Lead Panel"
        action={
          <Button onClick={() => navigate('/create-meeting')} variant="primary" className="shadow-lg shadow-primary-500/20">
            <span className="mr-2">+</span> Create New Meet
          </Button>
        }
      />

      {/* Scheduled Meetings */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-6 bg-primary-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Scheduled Meetings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? <LoadingSpinner /> : upcoming.length > 0
            ? upcoming.map(m => (
                <MeetingCard key={m.id} meeting={m} onClick={() => navigate('/mark-attendance')} />
              ))
            : <EmptyState message="No upcoming meetings. Create one to get started!" />
          }
        </div>
      </section>

      {/* Past Meetings */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-6 bg-slate-400 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Past Meetings & Reports</h3>
        </div>
        <div className="gsap-card bg-bg-card rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Meeting Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Venue</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4}><LoadingSpinner /></td></tr>
              ) : past.length > 0 ? (
                past.map(m => (
                  <tr key={m.id} className="hover:bg-bg-DEFAULT transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{m.date}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{m.title}</div>
                      <div className="text-xs text-slate-500">{m.startTime} - {m.endTime}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.location}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="text-primary-700 hover:text-primary-800 hover:bg-primary-50">
                        View Report
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                    No past meeting history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const FacultyDashboard = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [scheduledMeetings, setScheduledMeetings] = useState<Meeting[]>([]);
  const [recentActivity,    setRecentActivity]    = useState<Meeting[]>([]);
  const [pendingConflicts,  setPendingConflicts]  = useState(0);
  const [stats,             setStats]             = useState({ totalMeetings: 0, activeClubs: 0 });
  const [loading,           setLoading]           = useState(true);

  useEffect(() => {
    // Real-time meetings listener
    const unsubMeetings = onSnapshot(collection(db, 'meetings'), snap => {
      const meetings = snap.docs.map(docToMeeting);
      setStats({
        totalMeetings: meetings.length,
        activeClubs:   new Set(meetings.map(m => m.clubId)).size,
      });
      setScheduledMeetings(
        meetings
          .filter(m => (m.status || '').toLowerCase() === 'scheduled')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
      setRecentActivity(
        meetings
          .filter(m => (m.status || '').toLowerCase() === 'completed')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3)
      );
      setLoading(false);
      animateCards();
    });

    // Real-time attendance listener for pending conflicts count
    const unsubAttendance = onSnapshot(
      collection(db, 'attendance'),
      snap => {
        const pending = snap.docs.filter(d => {
          const s = (d.data().status || '').toUpperCase();
          return s === 'DECLARED';
        }).length;
        setPendingConflicts(pending);
      }
    );

    return () => { unsubMeetings(); unsubAttendance(); };
  }, []);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Faculty Overview"
        subtitle={[`Prof. ${user?.name?.split(' ')[1] || user?.name || ''}`, user?.department || (user as any)?.branch].filter(Boolean).join(' • ')}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="gsap-card p-6 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-white text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm text-xl">📊</div>
          <div>
            <h4 className="text-lg font-bold text-indigo-900">System Activity</h4>
            <p className="text-indigo-700 text-sm mt-1">
              {stats.totalMeetings} total meetings across {stats.activeClubs} active clubs.
            </p>
          </div>
        </div>
        <div className="gsap-card p-6 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-white text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm text-xl">📅</div>
          <div>
            <h4 className="text-lg font-bold text-emerald-900">Scheduled</h4>
            <p className="text-emerald-700 text-sm mt-1">
              {scheduledMeetings.length} upcoming meeting{scheduledMeetings.length !== 1 ? 's' : ''} across all clubs.
            </p>
          </div>
        </div>
        <div
          className="gsap-card p-6 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-4 cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/conflicts')}
        >
          <div className="w-12 h-12 rounded-lg bg-white text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm text-xl relative">
            ⚠️
            {pendingConflicts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingConflicts}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-lg font-bold text-amber-900">Conflicts</h4>
            <p className="text-amber-700 text-sm mt-1">
              {pendingConflicts > 0
                ? <><span className="font-bold text-red-600">{pendingConflicts}</span> pending OD requests need review.</>  
                : 'No pending conflicts. All clear ✅'
              }
            </p>
            <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">View Conflicts →</span>
          </div>
        </div>
      </div>

      {/* Live Scheduled Meetings */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-6 bg-primary-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Live Scheduled Meetings</h3>
          {scheduledMeetings.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full animate-pulse">
              {scheduledMeetings.length} Active
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? <LoadingSpinner /> : scheduledMeetings.length > 0
            ? scheduledMeetings.map(m => <MeetingCard key={m.id} meeting={m} />)
            : <EmptyState message="No meetings currently scheduled across all clubs." />
          }
        </div>
      </section>

      {/* Recently Completed */}
      <div className="gsap-card bg-bg-card rounded-xl border border-slate-200 shadow-card p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="w-1.5 h-6 bg-slate-800 rounded-full" />
            Recently Completed Meetings
          </h3>
        </div>
        <div className="space-y-4">
          {loading ? <LoadingSpinner /> : recentActivity.length > 0 ? (
            recentActivity.map(a => (
              <div key={a.id} className="p-5 bg-bg-DEFAULT border border-slate-200 rounded-xl flex items-start gap-5 hover:border-slate-300 transition-colors">
                <div className="p-3 bg-white rounded-lg text-slate-500 shadow-sm border border-slate-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{a.title} <span className="text-slate-500 font-normal">({a.clubName})</span></h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Concluded at: <span className="font-medium text-slate-800">{a.location}</span>
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="bg-slate-200 px-2 py-1 rounded">{a.date}</span>
                    <span>{a.startTime} – {a.endTime}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400 py-4">No recent meeting activity to show.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  switch (user.role) {
    case UserRole.STUDENT:  return <StudentDashboard />;
    case UserRole.LEAD:     return <LeadDashboard />;
    case UserRole.FACULTY:  return <FacultyDashboard />;
    default:                return <div>Unknown Role</div>;
  }
};
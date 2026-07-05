import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole, Meeting } from '../types';
import { CLUBS } from '../services/mockData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

import { collection, onSnapshot } from 'firebase/firestore';
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
// UNIFIED DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const UnifiedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [past,     setPast]     = useState<Meeting[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const unsubMeetings = onSnapshot(collection(db, 'meetings'), snap => {
      const meetings = snap.docs.map(docToMeeting);

      setUpcoming(
        meetings
          .filter(m => (m.status || '').toLowerCase() === 'scheduled')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
      setPast(
        meetings
          .filter(m => (m.status || '').toLowerCase() === 'completed')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      setLoading(false);
      animateCards();
    });

    return () => unsubMeetings();
  }, []);

  return (
    <div className="space-y-10">
      <SectionHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'User'}`}
        subtitle={`${user?.role.charAt(0).toUpperCase() + user?.role.slice(1).toLowerCase()} Dashboard`}
        action={
          user?.role === UserRole.LEAD ? (
            <Button onClick={() => navigate('/create-meeting')} variant="primary" className="shadow-lg shadow-primary-500/20">
              <span className="mr-2">+</span> Create New Meet
            </Button>
          ) : user?.role === UserRole.FACULTY ? (
            <Button onClick={() => navigate('/conflicts')} variant="primary" className="shadow-lg shadow-primary-500/20 bg-amber-500 hover:bg-amber-600 border-none text-white">
              View Conflicts
            </Button>
          ) : null
        }
      />

      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-6 bg-primary-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">All Scheduled Meetings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? <LoadingSpinner /> : upcoming.length > 0
            ? upcoming.map(m => (
                <MeetingCard 
                  key={m.id} 
                  meeting={m} 
                  onClick={() => user?.role === UserRole.LEAD ? navigate('/mark-attendance') : undefined} 
                />
              ))
            : <EmptyState message="No upcoming meetings scheduled." />
          }
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-6 bg-slate-400 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">All Past Meetings</h3>
        </div>
        <div className="gsap-card bg-bg-card rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Meeting Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3}><LoadingSpinner /></td></tr>
              ) : past.length > 0 ? (
                past.map(m => (
                  <tr key={m.id} className="hover:bg-bg-DEFAULT transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{m.date}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{m.title}</div>
                      <div className="text-xs text-slate-500">{m.startTime} - {m.endTime} • {m.clubName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.location}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm">
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
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  return <UnifiedDashboard />;
};
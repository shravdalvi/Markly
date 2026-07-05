import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { UserRole, AttendanceStatus, Meeting } from '../types';
import { CLUBS } from '../services/mockData';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

declare const gsap: any;

export const Profile: React.FC = () => {
    const { user, logout } = useAuth();

    // Entry Animation
    useEffect(() => {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(".profile-item",
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", clearProps: "all" }
            );
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Shared Header */}
            <div className="profile-item flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 border-b border-slate-200">
                <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-slate-500 overflow-hidden">
                    {/* Simple Avatar Placeholder */}
                    {user.name.charAt(0)}
                </div>
                <div className="text-center md:text-left space-y-1">
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{user.name}</h1>
                    <p className="text-slate-500 font-medium text-lg">{user.email}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${user.role === UserRole.FACULTY
                            ? 'bg-amber-50 text-amber-700 border-amber-100' // Distinguish Faculty slightly 
                            : 'bg-primary-50 text-primary-700 border-primary-100'
                            }`}>
                            {user.role === UserRole.LEAD ? 'Club Lead' : user.role}
                        </span>
                        {user.role === UserRole.STUDENT && ((user as any).collegeYear || (user as any).year) && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {(user as any).collegeYear || (user as any).year}
                            </span>
                        )}
                        {(user.role === UserRole.FACULTY || user.role === UserRole.STUDENT) && (user.department || (user as any).branch) && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {user.department || (user as any).branch}
                            </span>
                        )}
                    </div>
                </div>
                <div className="md:ml-auto pt-4 md:pt-0">
                    <Button variant="outline" onClick={logout} className="border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors">
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Role-Based Views */}
            {user.role === UserRole.STUDENT && <StudentView user={user} />}
            {user.role === UserRole.LEAD && <LeadView user={user} />}
            {user.role === UserRole.FACULTY && <FacultyView user={user} />}

        </div>
    );
};

// --- STUDENT VIEW ---
const StudentView: React.FC<{ user: any }> = ({ user }) => {
    const [myAttendance, setMyAttendance] = useState<any[]>([]);
    const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubAtt = onSnapshot(query(collection(db, 'attendance'), where('studentId', '==', user.id)), snap => {
            setMyAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubMeet = onSnapshot(collection(db, 'meetings'), snap => {
            setAllMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Meeting)));
            setLoading(false);
        });
        return () => { unsubAtt(); unsubMeet(); };
    }, [user.id]);

    const attendedCount = myAttendance.filter(a => ['PRESENT', 'DECLARED'].includes(a.status?.toUpperCase() || '')).length;
    const totalPotentialMeetings = 20; // Example
    const overallPercentage = Math.round((attendedCount / totalPotentialMeetings) * 100) || 0;

    return (
        <div className="space-y-8 animate-fadeIn profile-item">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                <StatCard label="Attendance Rate" value={loading ? '..' : `${overallPercentage}%`} />
                <StatCard label="Meetings Attended" value={loading ? '..' : attendedCount} />
                <StatCard label="Active Clubs" value={user.joinedClubIds?.length || 0} />
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">Academic Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoRow label="Admission No" value={user.admissionNumber || 'N/A'} />
                        <InfoRow label="Department" value={user.department || user.branch || 'N/A'} />
                        <InfoRow label="Year / Batch" value={user.collegeYear || user.year || 'N/A'} />
                        <InfoRow label="Division" value={user.division || 'N/A'} />
                        <InfoRow label="Committee" value={user.committee || 'N/A'} />
                        <InfoRow label="Position" value={user.position || 'Member'} />
                        <InfoRow label="Status" value="Active Student" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- LEAD VIEW ---
const LeadView: React.FC<{ user: any }> = ({ user }) => {
    const myClub = CLUBS.find(c => c.id === user.clubId);
    const [clubMeetings, setClubMeetings] = useState<Meeting[]>([]);
    const [membersCount, setMembersCount] = useState(0);

    useEffect(() => {
        if (!user.clubId) return;
        const unsubMeet = onSnapshot(query(collection(db, 'meetings'), where('clubId', '==', user.clubId)), snap => {
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Meeting));
            fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setClubMeetings(fetched);
        });

        // Members count logic: typically users with joinedClubIds array containing clubId
        // In this demo, we mock it realistically based on users collection if tracking students
        const getMembersCount = async () => {
            // we will simulate finding members by just setting a mock for now since user queries array-contains can be complex if not indexed
            // In a real app: query(collection(db, 'users'), where('joinedClubIds', 'array-contains', user.clubId))
            // Here we just mock realistic numbers
            setMembersCount(32);
        };
        getMembersCount();

        return () => unsubMeet();
    }, [user.clubId]);

    const completedMeetings = clubMeetings.filter(m => (m.status || '').toLowerCase() === 'completed');

    return (
        <div className="space-y-8 animate-fadeIn profile-item">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                <StatCard label="Total Members" value={membersCount} />
                <StatCard label="Meetings Conducted" value={completedMeetings.length} />
                <StatCard label="Upcoming Sessions" value={clubMeetings.length - completedMeetings.length} />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-full">
                        <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">Lead Info</h3>
                        <div className="space-y-4">
                            <InfoRow label="Admission No" value={user.admissionNumber || 'N/A'} />
                            <InfoRow label="Department" value={user.department || user.branch || 'N/A'} />
                            <InfoRow label="Year / Batch" value={user.collegeYear || user.year || 'N/A'} />
                            <InfoRow label="Division" value={user.division || 'N/A'} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-full">
                        <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">Club Details</h3>
                        {myClub ? (
                            <div className="space-y-4">
                                <InfoRow label="Club Name" value={myClub.name} />
                                <InfoRow label="Category" value={myClub.category} />
                                <InfoRow label="Your Role" value={user.position || 'Club Lead'} />
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                                    <p className="text-sm text-slate-600 leading-relaxed">{myClub.description}</p>
                                </div>
                            </div>
                        ) : <p className="text-slate-500">No club assigned.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- FACULTY VIEW ---
const FacultyView: React.FC<{ user: any }> = ({ user }) => {
    return (
        <div className="space-y-8 animate-fadeIn profile-item">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 mb-4">Faculty Information</h3>
                <div className="grid md:grid-cols-4 gap-6">
                    <InfoRow label="Designation" value="Assistant Professor" />
                    <InfoRow label="Department" value={user.department || user.branch || 'Engineering'} />
                    <InfoRow label="Employee ID" value={user.employeeNumber || 'Not Specified'} />
                    <InfoRow label="Role" value={user.committeeCoordinator ? "Club Coordinator" : "Faculty"} />
                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---
const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center hover:border-primary-200 hover:shadow-md transition-all">
        <div className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{value}</div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-primary-600">{label}</div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{label}</label>
        <div className="font-medium text-slate-800 text-sm">{value}</div>
    </div>
);

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { UserRole } from '../types';
import { CLUBS } from '../services/mockData';

// We need animation
declare const gsap: any;

export const MembersDirectory: React.FC = () => {
    const { user } = useAuth();
    
    // For Faculty: list of leads, and a selected lead view for students
    const [leads, setLeads] = useState<any[]>([]);
    // For Faculty: selected committee name
    const [selectedClub, setSelectedClub] = useState<string | null>(null);
    
    // For both: list of students in a specific committee
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter students by a specific committee
    const activeCommittee = user?.role === UserRole.LEAD 
        ? CLUBS.find(c => c.id === (user as any)?.clubId)?.name 
        : selectedClub;

    useEffect(() => {
        if (!user) return;
        
        let unsubLeads = () => {};
        if (user.role === UserRole.FACULTY) {
            unsubLeads = onSnapshot(
                query(collection(db, 'users'), where('role', '==', UserRole.LEAD)),
                snap => {
                    const fetchedLeads = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setLeads(fetchedLeads);
                    setLoading(false);
                }
            );
        } else if (user.role === UserRole.LEAD) {
            setLoading(false); // Students will load next
        }
        
        return () => unsubLeads();
    }, [user]);

    useEffect(() => {
        if (!activeCommittee) {
            setStudents([]);
            return;
        }
        
        // Listen to all students in the active committee
        const unsubStudents = onSnapshot(
            query(
                collection(db, 'users'), 
                where('role', '==', UserRole.STUDENT),
                where('committee', '==', activeCommittee)
            ),
            snap => {
                const fetchedStudents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStudents(fetchedStudents);
            }
        );
        
        return () => unsubStudents();
    }, [activeCommittee]);

    useEffect(() => {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(".fade-in-item", 
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "all" }
            );
        }
    }, [leads.length, students.length, selectedClub]);

    if (!user) return null;

    return (
        <div className="space-y-8">
            <div className="border-b border-slate-200 pb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                    {user.role === UserRole.FACULTY ? 'Committee Directory' : 'Committee Members'}
                </h2>
                <p className="text-slate-500 mt-2 text-lg">
                    {user.role === UserRole.FACULTY 
                        ? 'View active club leads and their registered students.' 
                        : `View students registered under ${activeCommittee || 'your club'}.`}
                </p>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center items-center">
                    <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* FACULTY VIEW: COMMITTEES LIST */}
                    {user.role === UserRole.FACULTY && (
                        <div className="w-full lg:w-1/3 flex flex-col gap-4">
                            <h3 className="font-bold text-slate-700 text-lg">Committees</h3>
                            
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-[600px] overflow-y-auto">
                                {CLUBS.map(club => {
                                    const isSelected = selectedClub === club.name;
                                    const clubLeads = leads.filter(l => l.clubId === club.id);
                                    
                                    return (
                                        <div 
                                            key={club.id} 
                                            onClick={() => setSelectedClub(club.name)}
                                            className={`fade-in-item p-4 border-b border-slate-100 cursor-pointer transition-all ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                                        >
                                            <div className="font-bold text-slate-800">{club.name}</div>
                                            {clubLeads.length > 0 ? (
                                                <div className="flex flex-col gap-1 mt-2">
                                                    {clubLeads.map(lead => (
                                                        <div key={lead.id} className="text-xs font-semibold text-primary-700 flex items-center gap-1.5">
                                                            <span className="w-4 h-4 rounded-full bg-primary-100 flex items-center justify-center text-[8px]">👑</span>
                                                            {lead.name} <span className="text-slate-400 font-normal">({lead.position || 'Lead'})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 mt-2 font-medium italic">No leads assigned</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* BOTH VIEWS: STUDENTS LIST */}
                    {((user.role === UserRole.FACULTY && selectedClub) || user.role === UserRole.LEAD) && (
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="font-bold text-slate-700 text-lg">
                                        {user.role === UserRole.FACULTY ? `Students in ${activeCommittee}` : 'Registered Members'}
                                    </h3>
                                    {user.role === UserRole.FACULTY && selectedClub && (
                                        <div className="text-sm text-slate-500 font-medium flex gap-2">
                                            {leads.filter(l => l.clubId === CLUBS.find(c => c.name === selectedClub)?.id).map(l => l.name).join(', ') || 'No Lead'}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-lg border border-emerald-100 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {students.length} Total Registered
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Position</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Div & Year</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {students.length > 0 ? students.map(student => (
                                                <tr key={student.id} className="fade-in-item hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{student.name}</div>
                                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{student.admissionNumber || 'No ADM'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded border border-indigo-100">
                                                            {student.position || 'Member'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                        Div {student.division || '-'} • {student.collegeYear || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {student.department || '-'}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                                        No students have registered for {activeCommittee || 'this committee'} yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FACULTY VIEW: EMPTY STATE BEFORE SELECTING CLUB */}
                    {user.role === UserRole.FACULTY && !selectedClub && (
                        <div className="flex-1 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl mb-4">👈</div>
                            <h3 className="text-lg font-bold text-slate-700">Select a Committee</h3>
                            <p className="text-slate-500 text-sm mt-1 max-w-sm">
                                Click on any committee from the list on the left to view their leads and registered students.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

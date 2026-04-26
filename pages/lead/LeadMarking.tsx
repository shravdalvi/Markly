import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AttendanceStatus, Meeting, UserRole } from '../../types';
import { MOCK_USERS } from '../../services/mockData';

declare const gsap: any;

export const LeadMarking: React.FC = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
    const [records, setRecords] = useState<any[]>([]);
    const [isSending, setIsSending] = useState(false);

    // 1. Fetch lead's meetings from Firestore
    useEffect(() => {
        if (!user?.id) return;
        
        // Listen to meetings for this user's club (or created by them)
        const q = query(
            collection(db, 'meetings'),
            // Optionally could filter: where('createdBy', '==', user.id)
        );

        const unsub = onSnapshot(q, snap => {
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Meeting));
            // filter for scheduled meetings by this user's club
            const myClubId = (user as any).clubId || '';
            const myMeetings = fetched.filter(m => 
                (m.status || '').toLowerCase() === 'scheduled' && 
                (m.createdBy === user.id || m.clubId === myClubId)
            );
            
            setMeetings(myMeetings);
            
            if (myMeetings.length > 0 && !selectedMeetingId) {
                setSelectedMeetingId(myMeetings[0].id);
            }
        });

        return () => unsub();
    }, [user, selectedMeetingId]);

    // 2. Fetch attendance for selected meeting
    useEffect(() => {
        if (!selectedMeetingId) {
            setRecords([]);
            return;
        }

        const unsub = onSnapshot(
            query(collection(db, 'attendance'), where('meetingId', '==', selectedMeetingId)),
            snap => {
                const attRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setRecords(attRecords);
            }
        );

        return () => unsub();
    }, [selectedMeetingId]);

    const activeMeeting = meetings.find(m => m.id === selectedMeetingId);

    // Stats
    const stats = {
        total: records.length,
        present: records.filter(r => r.status === 'PRESENT').length,
        pending: records.filter(r => r.status === 'DECLARED').length,
        absent: records.filter(r => r.status === 'ABSENT').length
    };

    useEffect(() => {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(".attendance-row",
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out", clearProps: "all" }
            );
        }
    }, [records.length]);

    const handleStatusChange = async (recordId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'attendance', recordId), {
                status: newStatus
            });
        } catch (e) {
            console.error("Failed to update status:", e);
        }
    };

    const handleDownloadCSV = () => {
        if (!activeMeeting) return;
        const presentStudents = records.filter(r => r.status === 'PRESENT');
        if (presentStudents.length === 0) {
            alert("No students are marked present.");
            return;
        }

        const headers = ["Name,Division,Year,Department,Admission No"];
        const rows = presentStudents.map(r => 
            `"${r.studentName || ''}","${r.studentDiv || ''}","${r.studentYear || ''}","${r.studentDepartment || ''}","${r.studentAdmissionNumber || ''}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_${activeMeeting.title.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEmailProfessors = async () => {
        if (!activeMeeting) return;
        const presentStudents = records.filter(r => r.status === 'PRESENT');
        if (presentStudents.length === 0) {
            alert("No students are marked present.");
            return;
        }

        setIsSending(true);
        const studentNames = presentStudents.map(r => r.studentName).join(', ');
        
        // Fetch professors from mock data or database
        const facultyEmails = MOCK_USERS.filter(u => u.role === UserRole.FACULTY).map(u => u.email).join(', ') || "faculty@college.edu";
        
        const subject = `Attendance Report: ${activeMeeting.title}`;
        const body = `The following students attended the meeting "${activeMeeting.title}":\n\n${studentNames}\n\nPlease mark them as active.`;

        // Generate CSV content correctly
        const headers = ["Name,Division,Year,Department,Admission No"];
        const rows = presentStudents.map(r => 
            `"${r.studentName || ''}","${r.studentDiv || ''}","${r.studentYear || ''}","${r.studentDepartment || ''}","${r.studentAdmissionNumber || ''}"`
        );
        const csvContent = headers.concat(rows).join("\n");
        const filename = `attendance_${activeMeeting.title.replace(/\s+/g, '_')}.csv`;

        try {
            const response = await fetch('http://localhost:5000/api/send-attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toEmail: facultyEmails,
                    ccEmail: user?.email, // Connected Lead login email
                    subject,
                    body,
                    csvData: csvContent,
                    filename
                })
            });
            const data = await response.json();
            
            if (data.success) {
                // Open Gmail so the lead can explicitly see the email directly
                window.open("https://mail.google.com/mail/u/0/#inbox", "_blank");
            } else {
                alert(`Failed to send email. Check backend configuration. Error: ${data.message}`);
            }
        } catch (err) {
            console.error("Error sending email via API:", err);
            alert("Failed to reach backend. Make sure the server is running.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmitFinal = () => {
        handleDownloadCSV();
        handleEmailProfessors();
        alert(`Attendance finalized for ${activeMeeting?.title}. ${stats.present} students marked present.`);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance Manager</h2>
                    <p className="text-slate-500 mt-2 text-lg">Verify student presence for your sessions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Session</span>
                        <select
                            value={selectedMeetingId}
                            onChange={(e) => setSelectedMeetingId(e.target.value)}
                            className="mt-1 block w-64 rounded-lg border-slate-300 bg-white py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm font-medium text-slate-700"
                        >
                            {meetings.length === 0 && <option value="">No active meetings</option>}
                            {meetings.map(m => (
                                <option key={m.id} value={m.id}>{m.title} ({m.date})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Meeting Context Banner */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-100 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{activeMeeting?.title || 'No Meeting Selected'}</h3>
                        <p className="text-sm text-slate-500">{activeMeeting?.startTime} - {activeMeeting?.endTime} • {activeMeeting?.location}</p>
                    </div>
                </div>

                <div className="flex gap-8 border-l border-slate-100 pl-8">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{stats.present}</div>
                        <div className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">Verified</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                        <div className="text-xs font-bold text-amber-600/70 uppercase tracking-wider">Pending</div>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Details (Div, Year, Dept, Pos)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.map((record) => (
                                <tr key={record.id} className="attendance-row hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 leading-tight">{record.studentName}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">{record.studentAdmissionNumber || 'NO ID'}</span>
                                            {record.missedLecture && (
                                                <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                                    Missing: {record.missedLecture}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            <div className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-[11px] font-bold border border-primary-100">
                                                Div: {record.studentDiv || '-'}
                                            </div>
                                            <div className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold border border-indigo-100">
                                                Year: {record.studentYear || '-'}
                                            </div>
                                            <div className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200">
                                                {record.studentDepartment || 'Dept N/A'}
                                            </div>
                                            {record.studentPosition && (
                                                <div className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[11px] font-bold border border-amber-200">
                                                    {record.studentPosition}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge status={record.status} size="sm" />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleStatusChange(record.id, 'PRESENT')}
                                                className={`p-2 rounded-lg transition-all duration-200 border ${record.status === 'PRESENT'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm'
                                                        : 'bg-white text-slate-400 border-slate-200 hover:text-emerald-600 hover:border-emerald-200'
                                                    }`}
                                                title="Mark Present"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(record.id, 'ABSENT')}
                                                className={`p-2 rounded-lg transition-all duration-200 border ${record.status === 'ABSENT'
                                                        ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                                                        : 'bg-white text-slate-400 border-slate-200 hover:text-red-600 hover:border-red-200'
                                                    }`}
                                                title="Mark Absent"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {records.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        No attendance records found for this session yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-wrap gap-4">
                    <p className="text-sm text-slate-500">
                        Ensure all students are verified before finalizing.
                    </p>
                    <div className="flex gap-3">
                        <Button onClick={handleDownloadCSV} variant="outline" className="text-slate-600 bg-white hover:bg-slate-50">
                            ⬇️ Download CSV
                        </Button>
                        <Button onClick={handleEmailProfessors} disabled={isSending} variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100">
                            {isSending ? "📧 Sending..." : "📧 Mail Professors"}
                        </Button>
                        <Button onClick={handleSubmitFinal} className="shadow-lg shadow-primary-500/20 bg-primary-600 hover:bg-primary-700">
                            Finalize & Check All
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
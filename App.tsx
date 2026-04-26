import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { LeadMarking } from './pages/lead/LeadMarking';
import { FacultyConflicts } from './pages/faculty/FacultyConflicts';
import { Profile } from './pages/Profile';
import { MembersDirectory } from './pages/MembersDirectory';
import { CreateMeet } from './pages/lead/CreateMeet';
import { UserRole } from './types'; // Added this import to check roles

// --- UPGRADED PROTECTED ROUTE ---
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[]; // Optional array of roles allowed to see the page
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  // 1. Wait for Firebase to finish checking auth state before doing anything
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 2. If nobody is logged in, kick them to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If roles are specified, check if the user has permission to view this page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If a student tries to go to /mark-attendance, send them back to the dashboard safely
    return <Navigate to="/dashboard" replace />; 
  }

  // 4. User is logged in and authorized! Let them in.
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* --- SHARED ROUTES (Everyone can access) --- */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/directory" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.LEAD, UserRole.FACULTY]}>
            <MembersDirectory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />

      {/* --- LEAD ONLY ROUTES --- */}
      <Route 
        path="/create-meeting" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.LEAD]}>
            <CreateMeet />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/mark-attendance" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.LEAD]}>
            <LeadMarking />
          </ProtectedRoute>
        } 
      />

      {/* --- STUDENT ONLY ROUTES --- */}
      <Route 
        path="/attendance" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentAttendance />
          </ProtectedRoute>
        } 
      />

      {/* --- FACULTY ONLY ROUTES --- */}
       <Route 
        path="/conflicts" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.FACULTY]}>
            <FacultyConflicts />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import BrowseEvents from './pages/BrowseEvents';
import MyRegistrations from './pages/MyRegistrations';
import AttendanceHistory from './pages/AttendanceHistory';
import MyCertificates from './pages/MyCertificates';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import MyEvents from './pages/MyEvents';
import EventRegistrations from './pages/EventRegistrations';
import QrScanner from './pages/QrScanner';
import AdminDashboard from './pages/AdminDashboard';
import PendingApprovals from './pages/PendingApprovals';
import AdminAllEvents from './pages/AdminAllEvents';
import UserManagement from './pages/UserManagement';
import VerifyCertificate from './pages/VerifyCertificate';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'ORGANIZER') return <Navigate to="/organizer" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyCertificate />} />

          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/events" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <BrowseEvents />
            </ProtectedRoute>
          } />
          <Route path="/student/registrations" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyRegistrations />
            </ProtectedRoute>
          } />
          <Route path="/student/attendance" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AttendanceHistory />
            </ProtectedRoute>
          } />
          <Route path="/student/certificates" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyCertificates />
            </ProtectedRoute>
          } />

          <Route path="/organizer" element={
            <ProtectedRoute allowedRoles={['ORGANIZER']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/organizer/create-event" element={
            <ProtectedRoute allowedRoles={['ORGANIZER']}>
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/organizer/events" element={
            <ProtectedRoute allowedRoles={['ORGANIZER']}>
              <MyEvents />
            </ProtectedRoute>
          } />
          <Route path="/organizer/events/:id/registrations" element={
            <ProtectedRoute allowedRoles={['ORGANIZER']}>
              <EventRegistrations />
            </ProtectedRoute>
          } />
          <Route path="/organizer/scanner" element={
            <ProtectedRoute allowedRoles={['ORGANIZER']}>
              <QrScanner />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/approvals" element={
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <PendingApprovals />
  </ProtectedRoute>
} />
<Route path="/admin/events" element={
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <AdminAllEvents />
  </ProtectedRoute>
} />
<Route path="/admin/users" element={  
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <UserManagement />
  </ProtectedRoute>
} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
} 
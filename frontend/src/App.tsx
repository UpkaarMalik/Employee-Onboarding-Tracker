import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import TemplateBuilder from './pages/admin/TemplateBuilder';
import OnboardingList from './pages/admin/OnboardingList';
import OnboardingDetail from './pages/admin/OnboardingDetail';
import Employees from './pages/admin/Employees';
import Checklist from './pages/employee/CheckList';
import ReadingTask from './pages/employee/ReadingTask';
import Notes from './pages/notes/Notes';
import Resources from './pages/resources/Resources';
import Company from './pages/company/Company';
import Dashboard from './pages/dashboard/Dashboard';
import Reports from './pages/reports/Reports';
import AuditLog from './pages/audit/AuditLog';
import Entitlements from './pages/entitlements/Entitlements';
import Profile from './pages/profile/Profile';
import Feedback from './pages/feedback/Feedback';
import ContentGallery from './pages/gallery/ContentGallery';
import Faq from './pages/faq/Faq';
import Community from './pages/community/Community';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './context/AuthContext';

function TemplateRoute() {
  const { user } = useAuth();
  return user && ['SUPER_ADMIN', 'HR'].includes(user.role)
    ? <TemplateBuilder />
    : <Navigate to="/dashboard" replace />;
}

function EmployeeChecklistRoute() {
  const { user } = useAuth();
  return user?.role === 'EMPLOYEE'
    ? <Checklist />
    : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/checklist" element={<EmployeeChecklistRoute />} />
              <Route path="/reading/:taskId" element={<ReadingTask />} />
              <Route path="/admin/employees" element={<Employees />} />
              <Route path="/admin/templates" element={<TemplateRoute />} />
              <Route path="/admin/onboardings" element={<OnboardingList />} />
              <Route path="/admin/onboardings/:id" element={<OnboardingDetail />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/company" element={<Company />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/audit-log" element={<AuditLog />} />
              <Route path="/entitlements" element={<Entitlements />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/gallery" element={<ContentGallery />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/community" element={<Community />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

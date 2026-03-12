import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import LoginPage from '@/pages/LoginPage';
import Layout from './Layout';

// Admin pages
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import LeaveManagement from './pages/LeaveManagement';
import SalaryApprovals from './pages/SalaryApprovals';
import PayslipManagement from './pages/PayslipManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import LeavePolicy from './pages/LeavePolicy';
import Reports from './pages/Reports';

// Employee pages
import EmployeeDashboard from './pages/EmployeeDashboard';
import ApplyLeave from './pages/ApplyLeave';
import MyPayslips from './pages/MyPayslips';
import SalaryRequest from './pages/SalaryRequest';
import MyProfile from './pages/MyProfile';
import MyAttendance from './pages/MyAttendance';
import SpringBootExport from './pages/SpringBootExport';

// Shared
import PageNotFound from './lib/PageNotFound';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, user } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page when not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  const isAdmin = user?.role === 'admin';

  // Admin routes
  if (isAdmin) {
    return (
      <Routes>
        <Route path="/" element={
          <Layout currentPageName="Dashboard"><Dashboard /></Layout>
        } />
        <Route path="/Dashboard" element={
          <Layout currentPageName="Dashboard"><Dashboard /></Layout>
        } />
        <Route path="/Employees" element={
          <Layout currentPageName="Employees"><Employees /></Layout>
        } />
        <Route path="/Departments" element={
          <Layout currentPageName="Departments"><Departments /></Layout>
        } />
        <Route path="/LeaveManagement" element={
          <Layout currentPageName="LeaveManagement"><LeaveManagement /></Layout>
        } />
        <Route path="/SalaryApprovals" element={
          <Layout currentPageName="SalaryApprovals"><SalaryApprovals /></Layout>
        } />
        <Route path="/PayslipManagement" element={
          <Layout currentPageName="PayslipManagement"><PayslipManagement /></Layout>
        } />
        <Route path="/AttendanceManagement" element={
          <Layout currentPageName="AttendanceManagement"><AttendanceManagement /></Layout>
        } />
        <Route path="/LeavePolicy" element={
          <Layout currentPageName="LeavePolicy"><LeavePolicy /></Layout>
        } />
        <Route path="/Reports" element={
          <Layout currentPageName="Reports"><Reports /></Layout>
        } />
        <Route path="/SpringBootExport" element={
          <Layout currentPageName="SpringBootExport"><SpringBootExport /></Layout>
        } />
        {/* Redirect employee routes to admin dashboard */}
        <Route path="/EmployeeDashboard" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/ApplyLeave" element={<Navigate to="/LeaveManagement" replace />} />
        <Route path="/MyPayslips" element={<Navigate to="/PayslipManagement" replace />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

  // Employee routes
  return (
    <Routes>
      <Route path="/" element={
        <Layout currentPageName="EmployeeDashboard"><EmployeeDashboard /></Layout>
      } />
      <Route path="/EmployeeDashboard" element={
        <Layout currentPageName="EmployeeDashboard"><EmployeeDashboard /></Layout>
      } />
      <Route path="/ApplyLeave" element={
        <Layout currentPageName="ApplyLeave"><ApplyLeave /></Layout>
      } />
      <Route path="/MyPayslips" element={
        <Layout currentPageName="MyPayslips"><MyPayslips /></Layout>
      } />
      <Route path="/SalaryRequest" element={
        <Layout currentPageName="SalaryRequest"><SalaryRequest /></Layout>
      } />
      <Route path="/MyProfile" element={
        <Layout currentPageName="MyProfile"><MyProfile /></Layout>
      } />
      <Route path="/MyAttendance" element={
        <Layout currentPageName="MyAttendance"><MyAttendance /></Layout>
      } />
      <Route path="/LeavePolicy" element={
        <Layout currentPageName="LeavePolicy"><LeavePolicy /></Layout>
      } />
      {/* Redirect admin routes to employee dashboard */}
      <Route path="/Dashboard" element={<Navigate to="/EmployeeDashboard" replace />} />
      <Route path="/Employees" element={<Navigate to="/EmployeeDashboard" replace />} />
      <Route path="/Departments" element={<Navigate to="/EmployeeDashboard" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App

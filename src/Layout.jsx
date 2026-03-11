import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CalendarDays,
  IndianRupee,
  Menu,
  X,
  LogOut,
  ChevronRight,
  User,
  Clock,
  BarChart3,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { name: "Employees", page: "Employees", icon: Users },
  { name: "Departments", page: "Departments", icon: Building2 },
  { name: "Attendance", page: "AttendanceManagement", icon: Clock },
  { name: "Leave Applications", page: "LeaveManagement", icon: CalendarDays },
  { name: "Leave Policy", page: "LeavePolicy", icon: CalendarDays },
  { name: "Salary Approvals", page: "SalaryApprovals", icon: IndianRupee },
  { name: "Payslips", page: "PayslipManagement", icon: FileText },
  { name: "Reports", page: "Reports", icon: BarChart3 },
];

const employeeNavItems = [
  { name: "My Dashboard", page: "EmployeeDashboard", icon: LayoutDashboard },
  { name: "My Profile", page: "MyProfile", icon: UserCircle },
  { name: "My Attendance", page: "MyAttendance", icon: Clock },
  { name: "Apply Leave", page: "ApplyLeave", icon: CalendarDays },
  { name: "My Payslips", page: "MyPayslips", icon: FileText },
  { name: "Salary Request", page: "SalaryRequest", icon: IndianRupee },
];

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <style>{`
        :root {
          --primary: #0f172a;
          --accent: #6366f1;
          --accent-light: #818cf8;
        }
      `}</style>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-indigo-950 text-white transform transition-transform duration-300 ease-out border-r border-indigo-500/10 shadow-2xl shadow-indigo-900/20
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">PayrollPro</h1>
                <p className="text-xs text-slate-400">{isAdmin ? "Admin Panel" : "Employee Portal"}</p>
              </div>
            </div>
            <button
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/10"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : ""}`} />
                {item.name}
                {isActive && <ChevronRight className="h-4 w-4 ml-auto text-indigo-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isAdmin ? "bg-indigo-600" : "bg-emerald-600"}`}>
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isAdmin ? "bg-indigo-500/20 text-indigo-300" : "bg-emerald-500/20 text-emerald-300"
              }`}>
              {isAdmin ? "Admin" : "Employee"}
            </span>
          </div>
          <button
            className="w-full mt-2 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-30 shadow-sm shadow-slate-200/20">
          <button
            className="lg:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className={`h-2 w-2 rounded-full ${isAdmin ? "bg-indigo-500" : "bg-emerald-500"}`} />
            {isAdmin ? "Administrator" : "Employee"}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
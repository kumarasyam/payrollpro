import React from "react";
import { appClient } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, CalendarDays, IndianRupee, FileText, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function Dashboard() {
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => appClient.entities.Employee.list(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => appClient.entities.Department.list(),
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ["leaves-all"],
    queryFn: () => appClient.entities.LeaveApplication.list("-created_date"),
  });

  const { data: payslips = [] } = useQuery({
    queryKey: ["payslips"],
    queryFn: () => appClient.entities.Payslip.list("-created_date", 10),
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ["approvals"],
    queryFn: () => appClient.entities.SalaryApproval.list("-created_date", 10),
  });

  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const approvedLeaves = leaves.filter((l) => l.status === "approved").length;
  const rejectedLeaves = leaves.filter((l) => l.status === "rejected").length;
  const totalPayroll = employees.reduce((sum, e) => sum + (e.base_salary || 0), 0);
  const pendingApprovals = approvals.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your payroll system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Employees" value={employees.length} icon={Users} color="indigo" subtitle="Active Staff" />
        <StatCard title="Departments" value={departments.length} icon={Building2} color="emerald" subtitle="Org Units" />
        <StatCard title="Pending Leaves" value={pendingLeaves} icon={CalendarDays} color="amber" subtitle="Action Required" />
        <StatCard title="Approved Leaves" value={approvedLeaves} icon={CheckCircle2} color="emerald" subtitle="Confirmed" />
        <StatCard title="Rejected Leaves" value={rejectedLeaves} icon={XCircle} color="rose" subtitle="Denied" />
        <StatCard title="Payslips" value={payslips.length} icon={FileText} color="blue" subtitle="Total Records" />
        <StatCard title="Monthly Payroll" value={`₹${totalPayroll.toLocaleString()}`} icon={TrendingUp} color="purple" subtitle="Gross Budget" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity title="Recent Leave Applications" items={leaves.slice(0, 10)} type="leave" />
        <RecentActivity title="Recent Payslips" items={payslips} type="payslip" />
      </div>
    </div>
  );
}
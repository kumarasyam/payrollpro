import React from "react";
import { appClient } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, IndianRupee, Clock } from "lucide-react";
import { format } from "date-fns";
import StatCard from "@/components/dashboard/StatCard";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const { data: employee } = useQuery({
    queryKey: ["my-employee", user?.email],
    queryFn: () => appClient.entities.Employee.filter({ email: user.email }),
    enabled: !!user?.email,
    select: (data) => data?.[0],
  });

  const { data: policy } = useQuery({
    queryKey: ["leave-policy"],
    queryFn: async () => {
        const list = await appClient.entities.LeavePolicy.list();
        return list?.[0] || { max_sick: 4, max_casual: 6, max_earned: 14, max_maternity: 168, max_paternity: 60 };
    }
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ["my-leaves", user?.email],
    queryFn: () => appClient.entities.LeaveApplication.filter({ employee_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: payslips = [] } = useQuery({
    queryKey: ["my-payslips", user?.email],
    queryFn: () => appClient.entities.Payslip.filter({ employee_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const approvedLeavesList = leaves.filter(l => l.status === "approved" && new Date(l.start_date).getFullYear() === new Date().getFullYear());
  const pendingLeavesCount = leaves.filter((l) => l.status === "pending").length;
  const rejectedLeavesCount = leaves.filter((l) => l.status === "rejected").length;
  const latestPayslip = payslips[0];

  const usedLeaves = {
    sick: approvedLeavesList.filter(l => l.leave_type === 'sick').reduce((acc, curr) => acc + (curr.days || 0), 0),
    casual: approvedLeavesList.filter(l => l.leave_type === 'casual').reduce((acc, curr) => acc + (curr.days || 0), 0),
    earned: approvedLeavesList.filter(l => l.leave_type === 'earned').reduce((acc, curr) => acc + (curr.days || 0), 0),
    maternity: approvedLeavesList.filter(l => l.leave_type === 'maternity').reduce((acc, curr) => acc + (curr.days || 0), 0),
    paternity: approvedLeavesList.filter(l => l.leave_type === 'paternity').reduce((acc, curr) => acc + (curr.days || 0), 0),
  };

  const availableLeaves = {
    sick: usedLeaves.sick,
    casual: usedLeaves.casual,
    earned: usedLeaves.earned,
    maternity: usedLeaves.maternity,
    paternity: usedLeaves.paternity,
  };

  const totalPolicy = (policy?.max_sick || 4) + (policy?.max_casual || 6) + (policy?.max_earned || 14);
  const totalUsedApproved = Object.values(usedLeaves).reduce((acc, curr) => acc + curr, 0);
  const totalAvailable = totalPolicy - totalUsedApproved;

  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.full_name || "Employee"}</h1>
        <p className="text-slate-500 mt-1">{employee?.designation || "Employee"} · {employee?.department || "—"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Available" value={`${totalAvailable} days`} icon={CalendarDays} color="indigo" subtitle="Remaining Leave Balance" />
        <StatCard title="Pending Leaves" value={pendingLeavesCount} icon={Clock} color="amber" subtitle="Awaiting administrative action" />
        <StatCard title="Rejected Leaves" value={rejectedLeavesCount} icon={XCircle} color="rose" subtitle="Requests not approved" />
        <StatCard title="Total Payslips" value={payslips.length} icon={FileText} color="blue" subtitle="Historical records" />
        <StatCard title="Last Net Pay" value={latestPayslip ? `₹${latestPayslip.net_salary?.toLocaleString()}` : "—"} icon={IndianRupee} color="emerald" subtitle={latestPayslip ? `Paid for ${latestPayslip.month}` : "No payslips generated"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Sick Used</p>
              <p className="text-lg font-bold text-slate-800">{usedLeaves.sick} / {policy?.max_sick || 4}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Casual Used</p>
              <p className="text-lg font-bold text-slate-800">{usedLeaves.casual} / {policy?.max_casual || 6}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Earned Used</p>
              <p className="text-lg font-bold text-slate-800">{usedLeaves.earned} / {policy?.max_earned || 14}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Maternity Used</p>
              <p className="text-lg font-bold text-slate-800">{employee?.gender === "Male" ? "0 / 0" : `${usedLeaves.maternity} / ${policy?.max_maternity || 168}`}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Paternity Used</p>
              <p className="text-lg font-bold text-slate-800">{employee?.gender === "Female" ? "0 / 0" : `${usedLeaves.paternity} / ${policy?.max_paternity || 60}`}</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Recent Leave Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No leave applications yet</p>
            ) : (
              <div className="space-y-3">
                {leaves.slice(0, 5).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium capitalize text-slate-800">{leave.leave_type?.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-400">
                        {leave.start_date && format(new Date(leave.start_date), "MMM d")} - {leave.end_date && format(new Date(leave.end_date), "MMM d")} · {leave.days} days
                      </p>
                    </div>
                    <Badge variant="secondary" className={`${statusColors[leave.status]} border-0 text-xs`}>{leave.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Recent Payslips</CardTitle>
          </CardHeader>
          <CardContent>
            {payslips.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No payslips yet</p>
            ) : (
              <div className="space-y-3">
                {payslips.slice(0, 5).map((slip) => (
                  <div key={slip.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{slip.month}</p>
                      <p className="text-xs text-slate-400">Net: ${slip.net_salary?.toLocaleString()}</p>
                    </div>
                    <Badge variant="secondary" className={`${statusColors[slip.status] || "bg-slate-100 text-slate-600"} border-0 text-xs`}>{slip.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
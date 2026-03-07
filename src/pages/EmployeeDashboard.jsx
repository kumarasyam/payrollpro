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

  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const latestPayslip = payslips[0];

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
        <StatCard title="Leave Balance" value={`${employee?.leave_balance ?? 24} days`} icon={CalendarDays} color="indigo" />
        <StatCard title="Pending Leaves" value={pendingLeaves} icon={Clock} color="amber" />
        <StatCard title="Total Payslips" value={payslips.length} icon={FileText} color="blue" />
        <StatCard title="Last Net Pay" value={latestPayslip ? `₹${latestPayslip.net_salary?.toLocaleString()}` : "—"} icon={IndianRupee} color="emerald" />
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
                    <Badge className={`${statusColors[leave.status]} border-0 text-xs`}>{leave.status}</Badge>
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
                    <Badge className={`${statusColors[slip.status] || "bg-slate-100 text-slate-600"} border-0 text-xs`}>{slip.status}</Badge>
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
import React, { useState } from "react";
import { appClient } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
};

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default function ApplyLeave() {
  const { user } = useAuth();
  const qc = useQueryClient();

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

  const [form, setForm] = useState({
    leave_type: "", start_date: "", end_date: "", reason: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => appClient.entities.LeaveApplication.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
      setForm({ leave_type: "", start_date: "", end_date: "", reason: "" });
      toast.success("Leave application submitted successfully");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => appClient.entities.LeaveApplication.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
      toast.success("Leave application cancelled");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = differenceInDays(endDate, startDate) + 1;

    // Load policy
    const policy = JSON.parse(localStorage.getItem("payrollpro_leave_policy")) || {
      max_sick: 12, max_casual: 12, max_earned: 15, advance_days_required: 3,
    };

    // Time-bound rules validation
    if (policy.advance_days_required > 0) {
      const advanceDays = differenceInDays(startDate, today);
      if (advanceDays < policy.advance_days_required) {
        toast.error(`Policy requires applying at least ${policy.advance_days_required} days in advance.`);
        return;
      }
    }

    // Leave balance per type validation
    const currentYear = new Date().getFullYear();
    const sameTypeLeaves = leaves.filter(l =>
      l.leave_type === form.leave_type &&
      l.status !== "rejected" &&
      new Date(l.start_date).getFullYear() === currentYear
    );
    const usedDays = sameTypeLeaves.reduce((sum, l) => sum + (l.days || 0), 0);
    const maxDays = policy[`max_${form.leave_type}`] !== undefined ? policy[`max_${form.leave_type}`] : 999;

    if (usedDays + days > maxDays) {
      toast.error(`Limit exceeded! You can take up to ${maxDays} ${form.leave_type} leaves per year. (Used: ${usedDays})`);
      return;
    }

    createMutation.mutate({
      employee_name: employee?.full_name || user?.full_name,
      employee_email: user.email,
      department: employee?.department || "",
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days,
      reason: form.reason,
      status: "pending",
    });
  };

  const days = form.start_date && form.end_date
    ? Math.max(differenceInDays(new Date(form.end_date), new Date(form.start_date)) + 1, 0)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Apply for Leave</h1>
        <p className="text-slate-500 mt-1">Leave balance: <span className="font-semibold text-indigo-600">{employee?.leave_balance ?? 24} days</span></p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
            New Leave Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Leave Type</Label>
                <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="earned">Earned Leave</SelectItem>
                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                    <SelectItem value="paternity">Paternity Leave</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            {days > 0 && (
              <p className="text-sm text-indigo-600 font-medium">Duration: {days} day{days > 1 ? "s" : ""}</p>
            )}
            <div>
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Describe your reason for leave..." className="h-24" />
            </div>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={!form.leave_type || !form.start_date || !form.end_date || !form.reason}>
              <Send className="h-4 w-4 mr-2" /> Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">My Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No leave applications yet</p>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{statusIcons[leave.status]}</div>
                    <div>
                      <p className="text-sm font-medium capitalize text-slate-800">{leave.leave_type?.replace(/_/g, " ")} Leave</p>
                      <p className="text-xs text-slate-400">
                        {leave.start_date && format(new Date(leave.start_date), "MMM d, yyyy")} — {leave.end_date && format(new Date(leave.end_date), "MMM d, yyyy")} · {leave.days} days
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{leave.reason}</p>
                      {leave.admin_remarks && (
                        <p className="text-xs text-slate-500 mt-1 italic">Admin: {leave.admin_remarks}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <Badge className={`${statusColors[leave.status]} border-0 text-xs`}>{leave.status}</Badge>
                    {leave.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 text-xs"
                        onClick={() => cancelMutation.mutate(leave.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
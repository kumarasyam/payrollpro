import React, { useState } from "react";
import { appClient } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle2, XCircle, Clock, Eye, AlertTriangle, FileImage, Briefcase } from "lucide-react";
import { format, differenceInDays, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";

// Fixed company policy (mirrors LeavePolicy.jsx constants)
const FIXED_POLICY = {
  max_sick: 4, max_casual: 10, max_earned: 10,
  max_maternity: 168, max_paternity: 60,
  advance_days_required: 2, admin_action_days: 3,
};

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default function LeaveManagement() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState("");
  const qc = useQueryClient();

  const policy = FIXED_POLICY;
  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ["leaves"],
    queryFn: () => appClient.entities.LeaveApplication.list("-created_date"),
  });

  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => appClient.entities.Employee.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.LeaveApplication.update(id, data),
    onSuccess: () => { 
        qc.invalidateQueries({ queryKey: ["leaves"] }); 
        setSelected(null); 
        setRemarks(""); 
    },
  });

  // Auto-reject overdue requests
  React.useEffect(() => {
    if (leaves.length > 0 && policy) {
      const overtimeLeaves = leaves.filter(l => {
        if (l.status !== 'pending') return false;
        const diff = differenceInDays(new Date(), new Date(l.created_date || new Date()));
        return diff >= policy.admin_action_days;
      });
      
      overtimeLeaves.forEach(l => {
        updateMutation.mutate({ 
          id: l.id, 
          data: { 
              status: 'rejected', 
              remarks: `due to the crucial time for project we cant approve` 
          } 
        });
      });
    }
  }, [leaves, policy]);

  const handleAction = async (status) => {
    if (status === "rejected" && !remarks.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    
    // Sync Attendance & Balance - ONLY for approved leaves
    if (status === "approved") {
      try {
        const days = eachDayOfInterval({
          start: new Date(selected.start_date),
          end: new Date(selected.end_date)
        });
        
        const attendanceStatus = "on_leave";
        
        // Fetch existing attendance to avoid duplicates
        const existingAtt = await appClient.entities.Attendance.filter({ 
          employee_email: selected.employee_email 
        });

        for (const day of days) {
          const dateStr = format(day, "yyyy-MM-dd");
          const existing = existingAtt.find(a => a.date === dateStr);
          
          if (existing) {
            await appClient.entities.Attendance.update(existing.id, { 
              status: attendanceStatus,
              notes: `Leave approved: ${remarks || selected.reason}`
            });
          } else {
            await appClient.entities.Attendance.create({
              employee_name: selected.employee_name,
              employee_email: selected.employee_email,
              department: selected.department,
              date: dateStr,
              status: attendanceStatus,
              notes: `Leave approved: ${remarks || selected.reason}`,
              worked_hours: 0,
              overtime_hours: 0
            });
          }
        }
        qc.invalidateQueries({ queryKey: ["attendance"] });

        // Update Balance
        const targetEmp = employees.find(e => e.email === selected.employee_email);
        if (targetEmp) {
          await appClient.entities.Employee.update(targetEmp.id, {
            leave_balance: Math.max(0, (targetEmp.leave_balance || 0) - (selected.days || 0))
          });
          qc.invalidateQueries({ queryKey: ["employees"] });
        }
      } catch (err) {
        console.error("Leave approval sync failed:", err);
        toast.error("Failed to sync attendance/balance records.");
      }
    }

    // Always update the leave application status
    updateMutation.mutate({ 
      id: selected.id, 
      data: { 
        status, 
        remarks: remarks || (status === 'rejected' ? 'Rejected by admin' : '') 
      } 
    });
  };

  const filtered = leaves.filter((l) => {
    const matchStatus = filter === "all" || l.status === filter;
    const matchSearch = l.employee_name?.toLowerCase().includes(search.toLowerCase()) || l.department?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredEmployees = employees.filter((e) => {
      return e.full_name?.toLowerCase().includes(search.toLowerCase()) || e.department?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Applications</h1>
        <p className="text-slate-500 mt-1">Review and manage employee leave requests</p>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All ({leaves.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({leaves.filter(l => l.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="balances" className="text-indigo-600 bg-indigo-50 border border-indigo-100 data-[state=active]:bg-indigo-600 data-[state=active]:text-white ml-2">Balances</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="overflow-x-auto">
            {filter === "balances" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Leaves Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isEmployeesLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-12 text-slate-400">Loading balances...</TableCell></TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-12 text-slate-400">No employees found</TableCell></TableRow>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{emp.full_name}</p>
                            <p className="text-xs text-slate-400">{emp.department}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{emp.designation}</TableCell>
                        <TableCell className="text-slate-600 font-medium">
                          <div className="space-y-1">
                            {(() => {
                              const empLeaves = leaves.filter(l => l.employee_email === emp.email && l.status !== 'rejected');
                              const usedSick = empLeaves.filter(l => l.leave_type === 'sick').reduce((s, c) => s + (c.days || 0), 0);
                              const usedCasual = empLeaves.filter(l => l.leave_type === 'casual').reduce((s, c) => s + (c.days || 0), 0);
                              const usedEarned = empLeaves.filter(l => l.leave_type === 'earned').reduce((s, c) => s + (c.days || 0), 0);
                              return (
                                <>
                                  <div className="flex justify-between w-48 text-xs"><span>Sick Used/Applied:</span> <span className="font-bold underline text-rose-600">{usedSick} / {FIXED_POLICY.max_sick}</span></div>
                                  <div className="flex justify-between w-48 text-xs"><span>Casual Used/Applied:</span> <span className="font-bold underline text-amber-600">{usedCasual} / {FIXED_POLICY.max_casual}</span></div>
                                  <div className="flex justify-between w-48 text-xs"><span>Earned Used/Applied:</span> <span className="font-bold underline text-indigo-600">{usedEarned} / {FIXED_POLICY.max_earned}</span></div>
                                </>
                              );
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">Loading...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">No leave applications found</TableCell></TableRow>
                  ) : (
                    filtered.map((leave) => (
                      <TableRow key={leave.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{leave.employee_name}</p>
                            <p className="text-xs text-slate-400">{leave.department}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-slate-600 font-medium">
                            {leave.leave_type?.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {leave.start_date && format(new Date(leave.start_date), "MMM d")} - {leave.end_date && format(new Date(leave.end_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{leave.days}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <Badge className={`${statusColors[leave.status]} border-0 text-xs`}>{leave.status}</Badge>
                            {leave.status === "pending" && policy && (
                              <span className={`text-[10px] font-medium ${(() => {
                                const diff = differenceInDays(new Date(), new Date(leave.created_date || new Date()));
                                const daysLeft = policy.admin_action_days - diff;
                                if (daysLeft < 0) return "text-rose-600 flex items-center gap-0.5";
                                if (daysLeft <= 2) return "text-amber-600";
                                return "text-slate-400";
                              })()}`}>
                                {(() => {
                                  const diff = differenceInDays(new Date(), new Date(leave.created_date || new Date()));
                                  const daysLeft = policy.admin_action_days - diff;
                                  return daysLeft < 0 ? <><AlertTriangle className="h-3 w-3" /> Overdue by {Math.abs(daysLeft)}d</> : `${daysLeft} days left to act`;
                                })()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelected(leave)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Application Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Employee</p>
                  <p className="font-medium text-slate-900">{selected.employee_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Department</p>
                  <p className="font-medium text-slate-900">{selected.department}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Leave Type</p>
                  <p className="capitalize font-medium text-slate-900">{selected.leave_type?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Days</p>
                  <p className="font-medium text-slate-900">{selected.days}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">From</p>
                  <p className="text-sm font-medium">{selected.start_date}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">To</p>
                  <p className="text-sm font-medium">{selected.end_date}</p>
                </div>
              </div>
              
              {selected.document_url && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <p className="text-xs text-indigo-500 font-bold uppercase mb-2">Supporting Document / Proof</p>
                  {selected.document_url.startsWith('data:image/') ? (
                    <img
                      src={selected.document_url}
                      alt="Proof document"
                      className="w-full max-h-64 object-contain rounded-lg border border-indigo-100 bg-white"
                    />
                  ) : selected.document_url.startsWith('data:application/pdf') ? (
                    <a
                      href={selected.document_url}
                      download={`proof_${selected.employee_name?.replace(' ', '_')}.pdf`}
                      className="text-sm text-indigo-600 hover:underline flex items-center gap-2"
                    >
                      <FileImage className="h-4 w-4" /> Download PDF Document
                    </a>
                  ) : (
                    <a href={selected.document_url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-2">
                      <FileImage className="h-3 w-3" /> View Document
                    </a>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400">Reason</p>
                <p className="text-sm text-slate-700 mt-1 p-3 bg-slate-50 rounded-lg">{selected.reason}</p>
              </div>
              {selected.status === "pending" && (
                <div>
                  <p className="text-xs text-slate-400 mb-1 font-bold">Admin Remarks / Rejection Reason</p>
                  <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Provide a reason for rejection or approval remarks..." />
                </div>
              )}
              {(selected.status === "rejected" || selected.status === "approved") && selected.remarks && (
                  <div>
                    <p className={`text-xs ${selected.status === 'rejected' ? 'text-rose-500' : 'text-emerald-500'} font-bold uppercase mb-1`}>
                        {selected.status === 'rejected' ? 'Rejection Reason' : 'Admin Remarks'}
                    </p>
                    <p className={`text-sm ${selected.status === 'rejected' ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'} p-3 rounded-lg border`}>
                        {selected.remarks}
                    </p>
                  </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selected?.status === "pending" ? (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => handleAction("rejected")} className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50">
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button onClick={() => handleAction("approved")} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setSelected(null)} className="w-full">Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
import { Search, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";

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

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ["leaves"],
    queryFn: () => appClient.entities.LeaveApplication.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.LeaveApplication.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leaves"] }); setSelected(null); setRemarks(""); },
  });

  const handleAction = (status) => {
    updateMutation.mutate({ id: selected.id, data: { status, admin_remarks: remarks } });
  };

  const filtered = leaves.filter((l) => {
    const matchStatus = filter === "all" || l.status === filter;
    const matchSearch = l.employee_name?.toLowerCase().includes(search.toLowerCase()) || l.department?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
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
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="overflow-x-auto">
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
                      <span className="capitalize text-slate-600">{leave.leave_type?.replace(/_/g, " ")}</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {leave.start_date && format(new Date(leave.start_date), "MMM d")} - {leave.end_date && format(new Date(leave.end_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{leave.days}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[leave.status]} border-0 text-xs`}>{leave.status}</Badge>
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
                  <p className="text-slate-700">{selected.start_date}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">To</p>
                  <p className="text-slate-700">{selected.end_date}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Reason</p>
                <p className="text-sm text-slate-700 mt-1 p-3 bg-slate-50 rounded-lg">{selected.reason}</p>
              </div>
              {selected.status === "pending" && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Admin Remarks</p>
                  <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks..." />
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
              <Badge className={`${statusColors[selected?.status]} border-0 text-sm px-4 py-2`}>
                {selected?.status === "approved" ? "Approved" : "Rejected"}
                {selected?.admin_remarks && ` — ${selected.admin_remarks}`}
              </Badge>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
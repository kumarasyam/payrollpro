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
import { CheckCircle2, XCircle, Eye, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export default function SalaryApprovals() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const qc = useQueryClient();

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: () => appClient.entities.SalaryApproval.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.SalaryApproval.update(id, data),
    onSuccess: () => { 
        qc.invalidateQueries({ queryKey: ["approvals"] }); 
        setSelected(null); 
        setRejectionReason("");
        toast.success("Action completed successfully");
    },
  });

  const handleAction = (status) => {
    if (status === "rejected" && !rejectionReason.trim()) {
        toast.error("Please provide a rejection reason");
        return;
    }
    updateMutation.mutate({ 
        id: selected.id, 
        data: { 
            status, 
            approved_by: "Admin",
            rejection_reason: status === "rejected" ? rejectionReason : null
        } 
    });
  };

  const filtered = approvals.filter((a) => filter === "all" || a.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Salary Approvals</h1>
        <p className="text-slate-500 mt-1">Review salary change requests</p>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="p-4 border-b">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All ({approvals.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({approvals.filter(a => a.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Current Salary</TableHead>
                <TableHead>Proposed Salary</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">No salary approvals found</TableCell></TableRow>
              ) : (
                filtered.map((item) => {
                  const diff = (item.proposed_salary || 0) - (item.current_salary || 0);
                  const isIncrease = diff >= 0;
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{item.employee_name}</p>
                          <p className="text-xs text-slate-400">{item.department}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{item.month}</TableCell>
                      <TableCell>
                        <span className="capitalize text-slate-600">{item.change_type}</span>
                      </TableCell>
                      <TableCell className="font-medium">₹{item.current_salary?.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">₹{item.proposed_salary?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 text-sm font-medium ${isIncrease ? "text-emerald-600" : "text-rose-600"}`}>
                          {isIncrease ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          ₹{Math.abs(diff).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[item.status]} border-0 text-xs`}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setRejectionReason(""); }}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salary Change Details</DialogTitle>
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
                  <p className="text-xs text-slate-400">Change Type</p>
                  <p className="capitalize font-medium text-slate-900">{selected.change_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Month</p>
                  <p className="font-medium text-slate-900">{selected.month}</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400">Current</p>
                  <p className="text-lg font-bold text-slate-900">₹{selected.current_salary?.toLocaleString()}</p>
                </div>
                <div className="flex items-center text-slate-300">→</div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400">Proposed</p>
                  <p className="text-lg font-bold text-indigo-600">₹{selected.proposed_salary?.toLocaleString()}</p>
                </div>
              </div>
              {selected.reason && (
                <div>
                  <p className="text-xs text-slate-400">Employee Reason</p>
                  <p className="text-sm text-slate-700 mt-1 p-3 bg-slate-50 rounded-lg whitespace-pre-wrap">{selected.reason}</p>
                </div>
              )}
              
              {selected.status === "pending" && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-rose-600 font-bold uppercase text-[10px]">Rejection Reason (Required for rejection)</Label>
                  <Textarea 
                    placeholder="Enter reason for rejection..." 
                    value={rejectionReason} 
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="h-20"
                  />
                </div>
              )}

              {selected.status === "rejected" && selected.rejection_reason && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                      <p className="text-xs text-rose-500 font-bold uppercase mb-1">Rejection Reason</p>
                      <p className="text-sm text-rose-700">{selected.rejection_reason}</p>
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
                <div className="w-full flex justify-center">
                    <Badge className={`${statusColors[selected?.status]} border-0 text-sm px-6 py-2`}>{selected?.status}</Badge>
                </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
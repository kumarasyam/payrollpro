import React, { useState } from "react";
import { appClient } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { IndianRupee, Send, Clock, CheckCircle2, XCircle, Plus, ArrowUp, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

export default function SalaryRequest() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState(null);

    // Fetch the employee record for current user
    const { data: employee } = useQuery({
        queryKey: ["my-employee", user?.email],
        queryFn: () => appClient.entities.Employee.filter({ email: user.email }),
        enabled: !!user?.email,
        select: (data) => data?.[0],
    });

    // Fetch this employee's salary requests
    const { data: requests = [], isLoading } = useQuery({
        queryKey: ["my-salary-requests", user?.email],
        queryFn: () => appClient.entities.SalaryApproval.filter({ employee_email: user.email }, "-created_date"),
        enabled: !!user?.email,
    });

    const [form, setForm] = useState({
        change_type: "raise",
        proposed_salary: "",
        reason: "",
    });

    const createMutation = useMutation({
        mutationFn: (data) => appClient.entities.SalaryApproval.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["my-salary-requests"] });
            setShowForm(false);
            setForm({ change_type: "raise", proposed_salary: "", reason: "" });
            toast.success("Salary request submitted successfully!");
        },
        onError: () => {
            toast.error("Failed to submit request. Please try again.");
        },
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const proposed = parseFloat(form.proposed_salary);
        if (!proposed || proposed <= 0) {
            toast.error("Please enter a valid proposed salary amount.");
            return;
        }
        if (!form.reason.trim()) {
            toast.error("Please provide a reason for the request.");
            return;
        }

        createMutation.mutate({
            employee_name: employee?.full_name || user?.full_name,
            employee_email: user?.email,
            department: employee?.department || "—",
            change_type: form.change_type,
            current_salary: employee?.base_salary || 0,
            proposed_salary: proposed,
            month: format(new Date(), "MMMM yyyy"),
            reason: form.reason,
            status: "pending",
        });
    };

    const currentSalary = employee?.base_salary || 0;
    const proposedNum = parseFloat(form.proposed_salary) || 0;
    const diff = proposedNum - currentSalary;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Salary Request</h1>
                    <p className="text-slate-500 mt-1">Submit and track salary change requests</p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Current Salary</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    ₹{currentSalary.toLocaleString()}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <IndianRupee className="h-5 w-5 text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Pending Requests</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">
                                    {requests.filter(r => r.status === "pending").length}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total Requests</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{requests.length}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <ArrowUp className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Request History */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">My Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400">Loading...</div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12">
                            <IndianRupee className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No salary requests yet</p>
                            <p className="text-sm text-slate-400 mt-1">Click "New Request" to submit your first salary request</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => {
                                const reqDiff = (req.proposed_salary || 0) - (req.current_salary || 0);
                                return (
                                    <div
                                        key={req.id}
                                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                                        onClick={() => setSelected(req)}
                                    >
                                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                            {statusIcons[req.status]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-900 capitalize">{req.change_type} Request</p>
                                                <Badge className={`${statusColors[req.status]} border-0 text-xs`}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                {req.month} • ₹{req.current_salary?.toLocaleString()} → ₹{req.proposed_salary?.toLocaleString()}
                                                <span className={`ml-2 font-medium ${reqDiff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                    ({reqDiff >= 0 ? "+" : ""}₹{reqDiff.toLocaleString()})
                                                </span>
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-slate-400">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* New Request Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Salary Request</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        {/* Current Salary Display */}
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Your Current Salary</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">₹{currentSalary.toLocaleString()}</p>
                            <p className="text-xs text-slate-400 mt-0.5">per month</p>
                        </div>

                        {/* Request Type */}
                        <div className="space-y-2">
                            <Label>Request Type</Label>
                            <Select value={form.change_type} onValueChange={(v) => setForm({ ...form, change_type: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="raise">Salary Raise</SelectItem>
                                    <SelectItem value="advance">Advance Salary</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Proposed Amount / Advance Amount */}
                        <div className="space-y-2">
                            <Label>{form.change_type === 'advance' ? 'Select Advance Amount (%)' : 'Select Increment (%)'}</Label>
                            <Select 
                                value={form.proposed_salary} 
                                onValueChange={(v) => setForm({ ...form, proposed_salary: v })}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder={form.change_type === 'advance' ? "Select advance percentage" : "Select percentage"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {form.change_type === 'advance' ? (
                                        <>
                                            {[10, 20, 30, 40, 50, 100, 200, 300].map(pct => (
                                                <SelectItem key={pct} value={((currentSalary * pct) / 100).toString()}>
                                                    {pct}% {pct >= 100 ? `(${pct/100} Month${pct > 100 ? 's' : ''})` : ''} - ₹{((currentSalary * pct) / 100).toLocaleString()}
                                                </SelectItem>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {[5, 10, 15, 20, 25, 30].map(pct => (
                                                <SelectItem key={pct} value={(currentSalary * (1 + pct/100)).toString()}>
                                                    {pct}% (₹{(currentSalary * (1 + pct/100)).toLocaleString()})
                                                </SelectItem>
                                            ))}
                                            <SelectItem value={(currentSalary + 5000).toString()}>Fixed +₹5,000</SelectItem>
                                            <SelectItem value={(currentSalary + 10000).toString()}>Fixed +₹10,000</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                            
                            {proposedNum > 0 && form.change_type !== 'advance' && (
                                <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                                    <ArrowUp className="h-3 w-3" />
                                    +₹{diff.toLocaleString()} increment from current salary
                                </div>
                            )}
                            {proposedNum > 0 && form.change_type === 'advance' && (
                                <div className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                                    <IndianRupee className="h-3 w-3" />
                                    Total advance requested: ₹{proposedNum.toLocaleString()}
                                </div>
                            )}
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label>Reason for Request</Label>
                            <Textarea
                                placeholder="Explain why you are requesting this salary change..."
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                className="min-h-[100px]"
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || !form.proposed_salary}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {createMutation.isPending ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit Request
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Request Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Details</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400">Request Type</p>
                                    <p className="capitalize font-medium text-slate-900">{selected.change_type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Month</p>
                                    <p className="font-medium text-slate-900">{selected.month}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Status</p>
                                    <Badge className={`${statusColors[selected.status]} border-0 text-xs mt-1`}>
                                        {selected.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Submitted</p>
                                    <p className="text-sm text-slate-700">
                                        {selected.created_date ? format(new Date(selected.created_date), "MMM d, yyyy") : "—"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                                {selected.change_type === 'advance' ? (
                                    <>
                                        <div className="flex-1 text-center">
                                            <p className="text-xs text-slate-400">Current Salary</p>
                                            <p className="text-lg font-bold text-slate-900">₹{selected.current_salary?.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center text-slate-300">→</div>
                                        <div className="flex-1 text-center">
                                            <p className="text-xs text-slate-400">Requested Advance</p>
                                            <p className="text-lg font-bold text-indigo-600">₹{selected.proposed_salary?.toLocaleString()}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 text-center">
                                            <p className="text-xs text-slate-400">Current</p>
                                            <p className="text-lg font-bold text-slate-900">₹{selected.current_salary?.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center text-slate-300">→</div>
                                        <div className="flex-1 text-center">
                                            <p className="text-xs text-slate-400">Proposed</p>
                                            <p className="text-lg font-bold text-indigo-600">₹{selected.proposed_salary?.toLocaleString()}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {selected.status === "rejected" && selected.rejection_reason && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                                    <p className="text-xs text-rose-500 font-bold uppercase mb-1">Rejection Reason</p>
                                    <p className="text-sm text-rose-700 font-medium">{selected.rejection_reason}</p>
                                </div>
                            )}

                            {selected.reason && (
                                <div>
                                    <p className="text-xs text-slate-400">My Reason</p>
                                    <p className="text-sm text-slate-700 mt-1 p-3 bg-white border border-slate-100 rounded-lg">{selected.reason}</p>
                                </div>
                            )}
                            {selected.approved_by && (
                                <div>
                                    <p className="text-xs text-slate-400">Reviewed by</p>
                                    <p className="text-sm text-slate-700 mt-1">{selected.approved_by}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

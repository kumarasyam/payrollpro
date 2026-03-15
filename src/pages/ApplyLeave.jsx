import React, { useState, useRef } from "react";
import { appClient } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Send, Clock, CheckCircle2, XCircle, Upload, FileImage, X } from "lucide-react";
import { format, differenceInDays, addDays, isBefore, startOfDay } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

// Fixed company leave policy limits
const FIXED_POLICY = {
  max_sick: 4,
  max_casual: 6,
  max_earned: 14,
  max_maternity: 168,
  max_paternity: 60,
  advance_days_required: 2,
  admin_action_days: 3,
};

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
  const fileInputRef = useRef(null);

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
  const [uploadedFile, setUploadedFile] = useState(null); // { name, type, base64 }
  const [uploading, setUploading] = useState(false);
  const [policyErrors, setPolicyErrors] = useState([]);
  const [showPolicyError, setShowPolicyError] = useState(false);

  const { data: policy } = useQuery({
    queryKey: ["leave-policy"],
    queryFn: async () => {
      const list = await appClient.entities.LeavePolicy.list();
      return list?.[0] || { 
        max_sick: 4, max_casual: 6, max_earned: 14, 
        max_maternity: 168, max_paternity: 60, 
        advance_days_required: 2 
      };
    }
  });

  const activePolicy = policy || FIXED_POLICY;



  const createMutation = useMutation({
    mutationFn: (data) => appClient.entities.LeaveApplication.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
      setForm({ leave_type: "", start_date: "", end_date: "", reason: "" });
      setUploadedFile(null);
      toast.success("Leave application submitted successfully");
    },
    onError: (err) => {
      toast.error(`Submission failed: ${err.message}`);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => appClient.entities.LeaveApplication.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
      toast.success("Leave application cancelled");
    },
  });

  // ── File Upload Handler ──────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG, GIF, or PDF files are allowed.");
      return;
    }
    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedFile({
        name: file.name,
        type: file.type,
        base64: ev.target.result, // data:image/png;base64,...
      });
      setUploading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read file. Please try again.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // ── Submit Handler ───────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = [];

    if (!form.leave_type || !form.start_date || !form.end_date) {
      toast.error("Please fill in all required fields (Leave Type, Dates)");
      return;
    }

    const startDate = startOfDay(new Date(form.start_date));
    const endDate = startOfDay(new Date(form.end_date));
    const today = startOfDay(new Date());

    if (isBefore(endDate, startDate)) {
      errors.push("End date cannot be before the start date.");
    }

    const daysCount = differenceInDays(endDate, startDate) + 1;

    // 1. Advance notice check
    if (activePolicy.advance_days_required > 0 && !["sick", "unpaid"].includes(form.leave_type)) {
      const minDate = addDays(today, activePolicy.advance_days_required);
      if (isBefore(startDate, minDate)) {
        errors.push(`This leave type requires at least ${activePolicy.advance_days_required} days advance notice. You can apply for dates starting from ${format(minDate, "PPP")} or later.`);
      }
    }

    // 2. Leave limit check
    const currentYear = new Date().getFullYear();
    const sameTypeLeaves = leaves.filter(l =>
      l.leave_type === form.leave_type &&
      l.status !== "rejected" &&
      new Date(l.start_date).getFullYear() === currentYear
    );
    const usedDays = sameTypeLeaves.reduce((sum, l) => sum + (l.days || 0), 0);
    const maxDaysKey = `max_${form.leave_type}`;
    const maxDays = activePolicy[maxDaysKey] !== undefined ? activePolicy[maxDaysKey] : 999;

    if (usedDays + daysCount > maxDays) {
      errors.push(`Maximum ${form.leave_type} leave limit exceeded. Policy allows ${maxDays} days/year. You have already used/applied for ${usedDays} days.`);
    }

    // 3. Documentation check
    const isSick = form.leave_type === 'sick' && daysCount >= 1;
    const isMaternity = form.leave_type === 'maternity';
    if ((isSick || isMaternity) && !uploadedFile) {
      errors.push(`A supporting document (Medical Certificate/Proof) is required for ${form.leave_type} leave.`);
    }

    // 4. Gender restriction
    if (form.leave_type === "maternity" && employee?.gender === "Male") {
      errors.push("Maternity leave is restricted to female employees.");
    }
    if (form.leave_type === "paternity" && employee?.gender === "Female") {
      errors.push("Paternity leave is restricted to male employees.");
    }

    if (errors.length > 0) {
      setPolicyErrors(errors);
      setShowPolicyError(true);
      return;
    }

    createMutation.mutate({
      employee_name: employee?.full_name || user?.full_name,
      employee_email: user.email,
      department: employee?.department || "Unassigned",
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days: daysCount,
      reason: form.reason || "",
      document_url: uploadedFile ? uploadedFile.base64 : "",
      status: "pending",
    });
  };

  const days = form.start_date && form.end_date
    ? Math.max(differenceInDays(new Date(form.end_date), new Date(form.start_date)) + 1, 0)
    : 0;

  const usedLeaves = {
    sick: leaves.filter(l => l.leave_type === 'sick' && l.status === 'approved').reduce((acc, curr) => acc + (curr.days || 0), 0),
    casual: leaves.filter(l => l.leave_type === 'casual' && l.status === 'approved').reduce((acc, curr) => acc + (curr.days || 0), 0),
    earned: leaves.filter(l => l.leave_type === 'earned' && l.status === 'approved').reduce((acc, curr) => acc + (curr.days || 0), 0),
  };

  const needsDocument = form.leave_type === 'maternity' || (form.leave_type === 'sick' && days >= 1);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Apply for Leave</h1>
          <p className="text-slate-500 mt-1">Submit your request for balance review</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center bg-white p-2 px-4 rounded-lg border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Sick Used</p>
            <p className="font-bold text-slate-700">{usedLeaves.sick} / {activePolicy.max_sick}</p>
          </div>
          <div className="text-center bg-white p-2 px-4 rounded-lg border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Casual Used</p>
            <p className="font-bold text-slate-700">{usedLeaves.casual} / {activePolicy.max_casual}</p>
          </div>
          <div className="text-center bg-white p-2 px-4 rounded-lg border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Earned Used</p>
            <p className="font-bold text-slate-700">{usedLeaves.earned} / {activePolicy.max_earned}</p>
          </div>
          <div className="text-center bg-indigo-50 p-2 px-4 rounded-lg border border-indigo-100">
            <p className="text-[10px] text-indigo-500 font-bold uppercase">Total Usage</p>
            <p className="font-bold text-indigo-700">
              {usedLeaves.sick + usedLeaves.casual + usedLeaves.earned} / {activePolicy.max_sick + activePolicy.max_casual + activePolicy.max_earned}
            </p>
          </div>
        </div>
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
                    <SelectItem value="earned">Earned Leave (EL)</SelectItem>
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

            {/* Document Upload Section */}
            {needsDocument && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <Label className="text-amber-800 font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Supporting Document (Required)
                </Label>
                <p className="text-xs text-amber-600">
                  {form.leave_type === 'maternity'
                    ? "Maternity leave requires a medical certificate or relevant document."
                    : "Sick leave requires a medical certificate."}
                  &nbsp;Upload JPG, PNG, GIF or PDF (max 5MB).
                </p>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {!uploadedFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-amber-300 bg-white rounded-xl p-6 flex flex-col items-center gap-2 hover:border-amber-400 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileImage className="h-8 w-8 text-amber-400" />
                    )}
                    <span className="text-sm font-medium text-amber-700">
                      {uploading ? "Reading file..." : "Click to upload a file"}
                    </span>
                    <span className="text-xs text-amber-500">JPG, PNG, GIF or PDF · Max 5MB</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-white border border-amber-200 rounded-xl">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <FileImage className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {uploadedFile.type.startsWith('image/') ? 'Image' : 'PDF'} · Ready to submit
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Preview for images */}
                {uploadedFile && uploadedFile.type.startsWith('image/') && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-amber-200 max-h-48">
                    <img src={uploadedFile.base64} alt="Preview" className="w-full object-contain max-h-48 bg-white" />
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Reason</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Describe your reason for leave..."
                className="h-24"
              />
            </div>

            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={
                createMutation.isPending ||
                !form.leave_type ||
                !form.start_date ||
                !form.end_date ||
                !form.reason ||
                (needsDocument && !uploadedFile)
              }
            >
              <Send className="h-4 w-4 mr-2" /> Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Leave History */}
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
                      {leave.remarks && (
                        <p className="text-xs text-slate-500 mt-1 italic">Admin: {leave.remarks}</p>
                      )}
                      {/* Show document indicator */}
                      {leave.document_url && (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-500 mt-1">
                          <FileImage className="h-3 w-3" /> Document attached
                        </span>
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

      {/* Policy Violation Pop Message */}
      <Dialog open={showPolicyError} onOpenChange={setShowPolicyError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              Policy Validation Failed
            </DialogTitle>
            <DialogDescription>
              Your leave request does not comply with the company leave policy for the following reasons:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            {policyErrors.map((err, idx) => (
              <div key={idx} className="flex gap-2 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100">
                <div className="flex-shrink-0 font-bold">•</div>
                <p>{err}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPolicyError(false)} className="bg-slate-900 hover:bg-slate-800">
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
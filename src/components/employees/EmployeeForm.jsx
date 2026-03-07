import React, { useState, useEffect } from "react";
import { appClient } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmployeeForm({ open, onClose, onSave, employee }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", department: "",
    designation: "", date_of_joining: "", base_salary: "", status: "active", leave_balance: 24,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => appClient.entities.Department.list(),
  });

  useEffect(() => {
    if (employee) {
      setForm({ ...employee, base_salary: employee.base_salary?.toString() || "" });
    } else {
      setForm({ full_name: "", email: "", phone: "", department: "", designation: "", date_of_joining: "", base_salary: "", status: "active", leave_balance: 24 });
    }
  }, [employee, open]);

  const handleSubmit = () => {
    onSave({ ...form, base_salary: parseFloat(form.base_salary) || 0, leave_balance: parseInt(form.leave_balance) || 24 });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" />
          </div>
          <div>
            <Label>Department</Label>
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Designation</Label>
            <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Software Engineer" />
          </div>
          <div>
            <Label>Date of Joining</Label>
            <Input type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} />
          </div>
          <div>
            <Label>Base Salary (₹)</Label>
            <Input type="number" value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} placeholder="5000" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Leave Balance (days)</Label>
            <Input type="number" value={form.leave_balance} onChange={(e) => setForm({ ...form, leave_balance: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">{employee ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
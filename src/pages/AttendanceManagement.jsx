import React, { useState } from "react";
import { appClient } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, Clock, CheckCircle2, XCircle, Timer } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
    present: "bg-emerald-100 text-emerald-700",
    half_day: "bg-amber-100 text-amber-700",
    on_leave: "bg-blue-100 text-blue-700",
    holiday: "bg-purple-100 text-purple-700",
};

export default function AttendanceManagement() {
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
    const [statusFilter, setStatusFilter] = useState("all");
    const qc = useQueryClient();

    const { data: attendance = [], isLoading } = useQuery({
        queryKey: ["attendance"],
        queryFn: () => appClient.entities.Attendance.list("-date"),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ["employees"],
        queryFn: () => appClient.entities.Employee.list(),
    });

    const [form, setForm] = useState({
        employee_email: "", date: format(new Date(), "yyyy-MM-dd"),
        status: "present", check_in: "09:00", check_out: "18:00", overtime_hours: 0, notes: "",
    });

    const createMutation = useMutation({
        mutationFn: (data) => appClient.entities.Attendance.create(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); setFormOpen(false); },
    });

    const handleSubmit = () => {
        const emp = employees.find(e => e.email === form.employee_email);
        if (!emp) return;
        const checkIn = form.check_in ? new Date(`2000-01-01T${form.check_in}`) : null;
        const checkOut = form.check_out ? new Date(`2000-01-01T${form.check_out}`) : null;
        let workedHours = 0;
        if (checkIn && checkOut) {
            workedHours = Math.max(0, (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
        }
        const overtime = Math.max(0, workedHours - 8);

        createMutation.mutate({
            employee_name: emp.full_name,
            employee_email: emp.email,
            department: emp.department,
            date: form.date,
            status: form.status,
            check_in: form.check_in,
            check_out: form.check_out,
            worked_hours: Math.round(workedHours * 10) / 10,
            overtime_hours: Math.round(overtime * 10) / 10,
            notes: form.notes,
        });
    };

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => appClient.entities.Attendance.update(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); },
    });

    const [selectedRec, setSelectedRec] = useState(null);

    const handleAction = (rec, newStatus) => {
        updateMutation.mutate({ id: rec.id, data: { status: newStatus, notes: rec.notes } });
        setSelectedRec(null);
    };

    const filtered = attendance.filter(a => {
        const matchSearch = a.employee_name?.toLowerCase().includes(search.toLowerCase());
        const matchDate = !dateFilter || a.date === dateFilter;
        const matchStatus = statusFilter === "all" || a.status === statusFilter;
        return matchSearch && matchDate && matchStatus;
    });

    const todayPresent = attendance.filter(a => a.date === format(new Date(), "yyyy-MM-dd") && a.status === "present").length;

    const totalOvertime = filtered.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Attendance Management</h1>
                    <p className="text-slate-500 mt-1">Track employee attendance and working hours</p>
                </div>
                <Button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" /> Mark Attendance
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Present Today</p>
                            <p className="text-xl font-bold text-slate-900">{todayPresent}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Total Records</p>
                            <p className="text-xl font-bold text-slate-900">{attendance.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Timer className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Total Overtime</p>
                            <p className="text-xl font-bold text-slate-900">{totalOvertime}h</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-sm">
                <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                         <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                         <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="present">Present</SelectItem>

                              <SelectItem value="on_leave">On Leave</SelectItem>
                              <SelectItem value="half_day">Half Day</SelectItem>
                              <SelectItem value="holiday">Holiday</SelectItem>
                         </SelectContent>
                    </Select>
                    <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Check In</TableHead>
                                <TableHead>Check Out</TableHead>
                                <TableHead>Worked</TableHead>
                                <TableHead>Overtime</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">Loading...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">No attendance records found</TableCell></TableRow>
                            ) : (
                                filtered.map(rec => (
                                    <TableRow key={rec.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-slate-900">{rec.employee_name}</p>
                                                <p className="text-xs text-slate-400">{rec.department}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">{rec.date}</TableCell>
                                        <TableCell className="text-slate-600">{rec.check_in || "—"}</TableCell>
                                        <TableCell className="text-slate-600">{rec.check_out || "—"}</TableCell>
                                        <TableCell className="font-medium">{rec.worked_hours || 0}h</TableCell>
                                        <TableCell className={rec.overtime_hours > 0 ? "text-purple-600 font-medium" : "text-slate-400"}>
                                            {rec.overtime_hours > 0 ? `${rec.overtime_hours}h` : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${statusColors[rec.status] || "bg-slate-100 text-slate-600"} border-0 text-xs`}>
                                                {rec.status?.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {rec.status === 'pending' && (
                                                <div className="flex gap-1 justify-end">

                                                    <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => handleAction(rec, 'present')}>Approve</Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Employee</Label>
                            <Select value={form.employee_email} onValueChange={v => setForm({ ...form, employee_email: v })}>
                                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                                <SelectContent>
                                    {employees.map(e => <SelectItem key={e.id} value={e.email}>{e.full_name} — {e.department}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Date</Label>
                                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="present">Present</SelectItem>

                                        <SelectItem value="half_day">Half Day</SelectItem>
                                        <SelectItem value="on_leave">On Leave</SelectItem>
                                        <SelectItem value="holiday">Holiday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Check In</Label>
                                <Input type="time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} />
                            </div>
                            <div>
                                <Label>Check Out</Label>
                                <Input type="time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

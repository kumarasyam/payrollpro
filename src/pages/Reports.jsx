import React, { useState } from "react";
import { appClient } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building2, IndianRupee, CalendarDays, FileText, Download, TrendingUp, Clock } from "lucide-react";

export default function Reports() {
    const [tab, setTab] = useState("salary");

    const { data: employees = [] } = useQuery({
        queryKey: ["employees"],
        queryFn: () => appClient.entities.Employee.list(),
    });
    const { data: departments = [] } = useQuery({
        queryKey: ["departments"],
        queryFn: () => appClient.entities.Department.list(),
    });
    const { data: payslips = [] } = useQuery({
        queryKey: ["payslips"],
        queryFn: () => appClient.entities.Payslip.list("-created_date"),
    });
    const { data: leaves = [] } = useQuery({
        queryKey: ["leaves"],
        queryFn: () => appClient.entities.LeaveApplication.list("-created_date"),
    });
    const { data: attendance = [] } = useQuery({
        queryKey: ["attendance"],
        queryFn: () => appClient.entities.Attendance.list("-date"),
    });

    const totalPayroll = payslips.filter(p => p.status === "paid").reduce((s, p) => s + (p.net_salary || 0), 0);
    const totalDeductions = payslips.reduce((s, p) => s + (p.total_deductions || 0), 0);
    const avgSalary = employees.length > 0 ? employees.reduce((s, e) => s + (e.base_salary || 0), 0) / employees.length : 0;

    const downloadCSV = (headers, rows, filename) => {
        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportSalaryReport = () => {
        const headers = ["Employee", "Department", "Month", "Gross", "Deductions", "Net Salary", "Status"];
        const rows = payslips.map(p => [
            p.employee_name, p.department, p.month,
            p.gross_salary, p.total_deductions, p.net_salary, p.status,
        ]);
        downloadCSV(headers, rows, "salary_report.csv");
    };

    const exportEmployeeReport = () => {
        const headers = ["Name", "Email", "Department", "Designation", "Salary", "Status", "Leave Balance"];
        const rows = employees.map(e => [
            e.full_name, e.email, e.department, e.designation,
            e.base_salary, e.status, e.leave_balance ?? 24,
        ]);
        downloadCSV(headers, rows, "employee_report.csv");
    };

    const exportAttendanceReport = () => {
        const headers = ["Employee", "Department", "Date", "Status", "Check In", "Check Out", "Worked Hours", "Overtime"];
        const rows = attendance.map(a => [
            a.employee_name, a.department, a.date, a.status,
            a.check_in, a.check_out, a.worked_hours, a.overtime_hours,
        ]);
        downloadCSV(headers, rows, "attendance_report.csv");
    };

    const exportDepartmentReport = () => {
        const headers = ["Department", "Head", "Employees", "Total Salary Budget"];
        const rows = departments.map(d => {
            const deptEmps = employees.filter(e => e.department === d.name);
            const total = deptEmps.reduce((s, e) => s + (e.base_salary || 0), 0);
            return [d.name, d.head || "—", deptEmps.length, total];
        });
        downloadCSV(headers, rows, "department_report.csv");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                <p className="text-slate-500 mt-1">View and export payroll system reports</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Total Paid</p>
                            <p className="text-2xl font-bold text-slate-900">₹{totalPayroll.toLocaleString()}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <IndianRupee className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Total Deductions</p>
                            <p className="text-2xl font-bold text-rose-600">₹{totalDeductions.toLocaleString()}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-rose-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Avg Salary</p>
                            <p className="text-2xl font-bold text-slate-900">₹{Math.round(avgSalary).toLocaleString()}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Leave Requests</p>
                            <p className="text-2xl font-bold text-slate-900">{leaves.length}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <CalendarDays className="h-5 w-5 text-amber-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Tabs */}
            <div>
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList>
                        <TabsTrigger value="salary">Salary Report</TabsTrigger>
                        <TabsTrigger value="employee">Employee Report</TabsTrigger>
                        <TabsTrigger value="department">Department Report</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Salary Report */}
            {tab === "salary" && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-lg">Monthly Payroll Report</CardTitle>
                        <Button variant="outline" size="sm" onClick={exportSalaryReport}>
                            <Download className="h-4 w-4 mr-1" /> Export CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Gross</TableHead>
                                        <TableHead>Deductions</TableHead>
                                        <TableHead>Net Salary</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payslips.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No payslips</TableCell></TableRow>
                                    ) : payslips.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div><p className="font-medium">{p.employee_name}</p><p className="text-xs text-slate-400">{p.department}</p></div>
                                            </TableCell>
                                            <TableCell>{p.month}</TableCell>
                                            <TableCell className="font-medium">₹{p.gross_salary?.toLocaleString()}</TableCell>
                                            <TableCell className="text-rose-600">₹{p.total_deductions?.toLocaleString()}</TableCell>
                                            <TableCell className="font-bold">₹{p.net_salary?.toLocaleString()}</TableCell>
                                            <TableCell><Badge className="border-0 text-xs bg-emerald-100 text-emerald-700">{p.status}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Employee Report */}
            {tab === "employee" && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-lg">Employee Report</CardTitle>
                        <Button variant="outline" size="sm" onClick={exportEmployeeReport}>
                            <Download className="h-4 w-4 mr-1" /> Export CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Designation</TableHead>
                                        <TableHead>Salary</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Leave Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No employees</TableCell></TableRow>
                                    ) : employees.map(e => (
                                        <TableRow key={e.id}>
                                            <TableCell className="font-medium">{e.full_name}</TableCell>
                                            <TableCell className="text-slate-500">{e.email}</TableCell>
                                            <TableCell>{e.department}</TableCell>
                                            <TableCell>{e.designation}</TableCell>
                                            <TableCell className="font-medium">₹{e.base_salary?.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge className={`border-0 text-xs ${e.status === "active" ? "bg-emerald-100 text-emerald-700" :
                                                        e.status === "on_leave" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                                    }`}>{e.status?.replace("_", " ")}</Badge>
                                            </TableCell>
                                            <TableCell>{e.leave_balance ?? 24} days</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Department Report */}
            {tab === "department" && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-lg">Department Report</CardTitle>
                        <Button variant="outline" size="sm" onClick={exportDepartmentReport}>
                            <Download className="h-4 w-4 mr-1" /> Export CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {departments.length === 0 ? (
                                <p className="col-span-full text-center py-8 text-slate-400">No departments</p>
                            ) : departments.map(d => {
                                const deptEmps = employees.filter(e => e.department === d.name);
                                const totalBudget = deptEmps.reduce((s, e) => s + (e.base_salary || 0), 0);
                                const activeCount = deptEmps.filter(e => e.status === "active").length;
                                return (
                                    <Card key={d.id} className="border shadow-none">
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{d.name}</p>
                                                    <p className="text-xs text-slate-400">Head: {d.head || "—"}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between"><span className="text-slate-500">Total Employees</span><span className="font-medium">{deptEmps.length}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Active</span><span className="font-medium text-emerald-600">{activeCount}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Salary Budget</span><span className="font-bold">₹{totalBudget.toLocaleString()}</span></div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Attendance Report */}
            {tab === "attendance" && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-lg">Attendance Summary</CardTitle>
                        <Button variant="outline" size="sm" onClick={exportAttendanceReport}>
                            <Download className="h-4 w-4 mr-1" /> Export CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Present Days</TableHead>

                                        <TableHead>Half Days</TableHead>
                                        <TableHead>Total Overtime</TableHead>
                                        <TableHead>Avg Hours/Day</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No employees</TableCell></TableRow>
                                    ) : employees.map(e => {
                                        const empAtt = attendance.filter(a => a.employee_email === e.email);
                                        const present = empAtt.filter(a => a.status === "present").length;

                                        const halfDay = empAtt.filter(a => a.status === "half_day").length;
                                        const totalOT = empAtt.reduce((s, a) => s + (a.overtime_hours || 0), 0);
                                        const avgHrs = empAtt.length > 0 ? empAtt.reduce((s, a) => s + (a.worked_hours || 0), 0) / empAtt.length : 0;
                                        return (
                                            <TableRow key={e.id}>
                                                <TableCell>
                                                    <div><p className="font-medium">{e.full_name}</p><p className="text-xs text-slate-400">{e.department}</p></div>
                                                </TableCell>
                                                <TableCell className="text-emerald-600 font-medium">{present}</TableCell>

                                                <TableCell className="text-amber-600 font-medium">{halfDay}</TableCell>
                                                <TableCell className="text-purple-600 font-medium">{totalOT}h</TableCell>
                                                <TableCell className="font-medium">{Math.round(avgHrs * 10) / 10}h</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

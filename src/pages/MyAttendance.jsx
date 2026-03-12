import React, { useState } from "react";
import { appClient } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, CheckCircle2, XCircle, Timer, AlertCircle } from "lucide-react";

const statusColors = {
    pending: "bg-slate-100 text-slate-600",
    present: "bg-emerald-100 text-emerald-700",
    absent: "bg-rose-100 text-rose-700",
    half_day: "bg-amber-100 text-amber-700",
    on_leave: "bg-blue-100 text-blue-700",
    holiday: "bg-purple-100 text-purple-700",
};

const statusIcons = {
    pending: <Clock className="h-4 w-4 text-slate-600" />,
    present: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    absent: <XCircle className="h-4 w-4 text-rose-600" />,
    half_day: <AlertCircle className="h-4 w-4 text-amber-600" />,
    on_leave: <Calendar className="h-4 w-4 text-blue-600" />,
    holiday: <Calendar className="h-4 w-4 text-purple-600" />,
};

export default function MyAttendance() {
    const { user } = useAuth();
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

    const { data: attendance = [], isLoading } = useQuery({
        queryKey: ["my-attendance", user?.email],
        queryFn: () => appClient.entities.Attendance.filter({ employee_email: user.email }, "-date"),
        enabled: !!user?.email,
    });

    const filtered = monthFilter
        ? attendance.filter(a => a.date?.startsWith(monthFilter))
        : attendance;

    const presentDays = attendance.filter(a => a.status === "present").length;
    const absentDays = attendance.filter(a => a.status === "absent").length;
    const halfDays = attendance.filter(a => a.status === "half_day").length;
    const totalOvertime = attendance.reduce((s, a) => s + (a.overtime_hours || 0), 0);
    const avgHours = attendance.length > 0
        ? Math.round(attendance.reduce((s, a) => s + (a.worked_hours || 0), 0) / attendance.length * 10) / 10
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Attendance History</h1>
                    <p className="text-slate-500 mt-1">Official attendance logs for all previous dates</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                        <p className="text-2xl font-bold text-slate-900 mt-2">{presentDays}</p>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Present</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <XCircle className="h-6 w-6 text-rose-500 mx-auto" />
                        <p className="text-2xl font-bold text-slate-900 mt-2">{absentDays}</p>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Absent</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <AlertCircle className="h-6 w-6 text-amber-500 mx-auto" />
                        <p className="text-2xl font-bold text-slate-900 mt-2">{halfDays}</p>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Half Days</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <Timer className="h-6 w-6 text-purple-500 mx-auto" />
                        <p className="text-2xl font-bold text-slate-900 mt-2">{totalOvertime}h</p>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Overtime</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 text-center">
                        <Clock className="h-6 w-6 text-blue-500 mx-auto" />
                        <p className="text-2xl font-bold text-slate-900 mt-2">{avgHours}h</p>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Avg/Day</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Records */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg">Monthly Records</CardTitle>
                    <Input
                        type="month"
                        value={monthFilter}
                        onChange={e => setMonthFilter(e.target.value)}
                        className="w-44"
                    />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-12 text-slate-400">Loading records...</p>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No attendance records for this period</p>
                            <p className="text-sm text-slate-400 mt-1">Attendance logs are updated by the HR/Admin team.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(rec => (
                                <div key={rec.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                        {statusIcons[rec.status] || statusIcons.present}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-900">{rec.date}</p>
                                            <Badge className={`${statusColors[rec.status] || "bg-slate-100 text-slate-600"} border-0 text-xs`}>
                                                {rec.status?.replace("_", " ")}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {rec.check_in && rec.check_out ? `${rec.check_in} — ${rec.check_out}` : "Attendance recorded without time logs"}
                                            {rec.worked_hours ? ` · ${rec.worked_hours}h worked` : ""}
                                            {rec.overtime_hours > 0 ? ` · ${rec.overtime_hours}h overtime` : ""}
                                        </p>
                                    </div>
                                    {rec.notes && (
                                        <p className="text-xs text-slate-400 max-w-xs truncate hidden sm:block italic font-medium">"{rec.notes}"</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

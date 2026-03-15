import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle2 } from "lucide-react";

// ── Fixed Company Leave Policy ─────────────────────────────────────────────────
const FIXED_POLICY = {
    max_sick: 4,
    max_casual: 6,
    max_earned: 14,
    max_maternity: 168,   // 24 weeks
    max_paternity: 60,
    advance_days_required: 2,
    admin_action_days: 3,
};

export default function LeavePolicy() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Company Leave Policy</h1>
                    <p className="text-slate-500 mt-1">Official leave entitlements and application rules</p>
                </div>
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-0">
                    Version 2026.1
                </Badge>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Leave Entitlements & Rules</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <ul className="list-disc pl-5 space-y-3 text-slate-700">
                        <li><strong>Sick Leave:</strong> {FIXED_POLICY.max_sick} Days per year. Supporting medical document is required for ALL sick leave applications.</li>
                        <li><strong>Casual Leave:</strong> {FIXED_POLICY.max_casual} Days per year for personal/urgent work.</li>
                        <li><strong>Earned Leave (EL):</strong> {FIXED_POLICY.max_earned} Days per year for planned vacations.</li>
                        <li><strong>Maternity Leave:</strong> {FIXED_POLICY.max_maternity} Days (24 Weeks) for female employees.</li>
                        <li><strong>Paternity Leave:</strong> {FIXED_POLICY.max_paternity} Days for male employees.</li>
                        <li className="pt-2"><strong>Advance Notice:</strong> Minimum {FIXED_POLICY.advance_days_required} days advance application required for Casual and Earned leave.</li>
                        <li><strong>Admin Processing:</strong> Requests are processed by admin within {FIXED_POLICY.admin_action_days} days.</li>
                        <li><strong>Attendance Sync:</strong> Approved leaves are marked as "On Leave" in attendance. Rejected leaves are marked as "Absent".</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

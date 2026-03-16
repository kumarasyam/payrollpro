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

            <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-900 text-white">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5 text-indigo-400" />
                        Annual Leave Entitlements
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900">Sick Leave: {FIXED_POLICY.max_sick} Days</p>
                                <p className="text-sm text-slate-500">Applicable for genuine illness. Supporting medical document is <strong>required for all sick leave applications</strong> regardless of duration.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900">Casual Leave: {FIXED_POLICY.max_casual} Days</p>
                                <p className="text-sm text-slate-500">Can be used for personal work or urgent errands.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900">Earned Leave (EL): {FIXED_POLICY.max_earned} Days</p>
                                <p className="text-sm text-slate-500">Accumulated leave for planned vacations and longer breaks.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900">Maternity Leave: {FIXED_POLICY.max_maternity} Days (24 Weeks)</p>
                                <p className="text-sm text-slate-500">Statutory leave for female employees. Medical documentation required.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-slate-900">Paternity Leave: {FIXED_POLICY.max_paternity} Days</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3 border-t pt-4">
                            <CheckCircle2 className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-indigo-900 text-lg">Total Annual Leave: 24 Days</p>
                                <p className="text-sm text-indigo-700">The sum of Sick, Casual, and Earned leaves capped at 24 days per year.</p>
                            </div>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Application Rules</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <p className="text-sm font-semibold text-indigo-900">Advance Notice Requirement</p>
                            <p className="text-sm text-indigo-700 mt-1">Employees must apply at least <strong>{FIXED_POLICY.advance_days_required} days in advance</strong> for Casual and Earned leaves. Sick leave does not require advance notice but requires documentation upon return.</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-sm font-semibold text-slate-900">Approval Deadline</p>
                            <p className="text-sm text-slate-600 mt-1">Admins must act on leave applications within <strong>{FIXED_POLICY.admin_action_days} days</strong>. If no action is taken, the system will automatically process the request (typically rejection with a default reason).</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

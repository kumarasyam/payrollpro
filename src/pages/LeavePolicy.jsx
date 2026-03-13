import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Calendar, Clock, Users, Baby, UserCheck } from "lucide-react";

// ── Fixed Company Leave Policy ─────────────────────────────────────────────────
// These values are company-defined and cannot be changed by any user.
const FIXED_POLICY = {
    max_sick: 10,
    max_casual: 10,
    max_maternity: 168,   // 24 weeks
    max_paternity: 60,
    advance_days_required: 2,
    admin_action_days: 3,
};

const policyItems = [
    {
        key: "max_sick",
        label: "Sick Leave",
        icon: Clock,
        color: "bg-rose-50 text-rose-600",
        iconColor: "text-rose-500",
        description: "Flexible for genuine illness",
        unit: "days/year",
    },
    {
        key: "max_casual",
        label: "Casual Leave",
        icon: Calendar,
        color: "bg-amber-50 text-amber-600",
        iconColor: "text-amber-500",
        description: "Personal or urgent errands",
        unit: "days/year",
    },
    {
        key: "max_maternity",
        label: "Maternity Leave",
        icon: Baby,
        color: "bg-pink-50 text-pink-600",
        iconColor: "text-pink-500",
        description: "For new mothers (24 weeks)",
        unit: "days",
    },
    {
        key: "max_paternity",
        label: "Paternity Leave",
        icon: Users,
        color: "bg-blue-50 text-blue-600",
        iconColor: "text-blue-500",
        description: "For new fathers (Baby Bonding)",
        unit: "days",
    },
];

const ruleItems = [
    {
        label: "Advance Application Required",
        value: `${FIXED_POLICY.advance_days_required} days`,
        description: "Apply this many days before the leave start date.",
    },
    {
        label: "Auto-Rejection Time Limit",
        value: `${FIXED_POLICY.admin_action_days} days`,
        description: "Pending requests auto-rejected if admin doesn't act within this limit.",
    },
];

export default function LeavePolicy() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leave Policy</h1>
                    <p className="text-slate-500 mt-1">Company-defined leave entitlements and rules</p>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs px-3 py-1">
                    Company Fixed Policy
                </Badge>
            </div>

            {/* Annual Leave Limits */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-indigo-500" />
                        Annual Leave Entitlements
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {policyItems.map(({ key, label, icon: Icon, color, iconColor, description, unit }) => (
                            <div key={key} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                                <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                    <Icon className={`h-5 w-5 ${iconColor}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{label}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">
                                        {FIXED_POLICY[key]}
                                        <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Time-Bound Rules */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        Time-Bound Rules
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {ruleItems.map((rule) => (
                        <div key={rule.label} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">{rule.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{rule.description}</p>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-700 border-0 text-sm font-bold px-3 ml-4 flex-shrink-0">
                                {rule.value}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Policy Note */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                <Settings className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-amber-800">Policy Note</p>
                    <p className="text-xs text-amber-700 mt-1">
                        Leave entitlements are set by company policy and apply equally to all employees.
                        Unpaid leave may be granted at the discretion of HR for cases exceeding the above limits.
                        Maternity leave of <strong>168 days (24 weeks)</strong> is as per statutory requirements.
                    </p>
                </div>
            </div>
        </div>
    );
}

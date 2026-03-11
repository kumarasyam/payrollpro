import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/base44Client";

export default function LeavePolicy() {
    const { data: policy = { max_sick: 12, max_casual: 12, max_earned: 15, advance_days_required: 3, admin_action_days: 7 }, isLoading } = useQuery({
        queryKey: ["leave-policy"],
        queryFn: async () => {
            const list = await appClient.entities.LeavePolicy.list();
            return list?.[0] || { max_sick: 12, max_casual: 12, max_earned: 15, advance_days_required: 3, admin_action_days: 7 };
        }
    });

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading policy...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Leave Policy Settings</h1>
                <p className="text-slate-500 mt-1">Define company rules and limits for employee leaves</p>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-indigo-500" />
                        Annual Leave Limits
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Max Sick Leaves (Days/Year)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={policy.max_sick}
                                readOnly
                                className="bg-slate-50 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Casual Leaves (Days/Year)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={policy.max_casual}
                                readOnly
                                className="bg-slate-50 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Earned Leaves (Days/Year)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={policy.max_earned}
                                readOnly
                                className="bg-slate-50 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-indigo-500" />
                        Time-Bound Rules
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Advance Application Required (Days)</Label>
                            <p className="text-xs text-slate-500 mb-2">Employees must apply this many days before the leave start date (0 = can apply same day).</p>
                            <Input
                                type="number"
                                min="0"
                                value={policy.advance_days_required}
                                readOnly
                                className="bg-slate-50 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Admin Action Time Limit (Days)</Label>
                            <p className="text-xs text-slate-500 mb-2">Admin must approve or reject within this many days after application.</p>
                            <Input
                                type="number"
                                min="1"
                                value={policy.admin_action_days}
                                readOnly
                                className="bg-slate-50 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

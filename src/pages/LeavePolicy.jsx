import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";

export const DEFAULT_LEAVE_POLICY = {
    max_sick: 12,
    max_casual: 12,
    max_earned: 15,
    advance_days_required: 3,
    admin_action_days: 7,
};

export function getLeavePolicy() {
    const data = localStorage.getItem("payrollpro_leave_policy");
    return data ? JSON.parse(data) : DEFAULT_LEAVE_POLICY;
}

export default function LeavePolicy() {
    const [policy, setPolicy] = useState(DEFAULT_LEAVE_POLICY);

    useEffect(() => {
        setPolicy(getLeavePolicy());
    }, []);

    const handleChange = (key, value) => {
        setPolicy((prev) => ({ ...prev, [key]: parseInt(value) || 0 }));
    };

    const handleSave = () => {
        localStorage.setItem("payrollpro_leave_policy", JSON.stringify(policy));
        toast.success("Leave policy updated successfully");
    };

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
                                onChange={(e) => handleChange("max_sick", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Casual Leaves (Days/Year)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={policy.max_casual}
                                onChange={(e) => handleChange("max_casual", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Earned Leaves (Days/Year)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={policy.max_earned}
                                onChange={(e) => handleChange("max_earned", e.target.value)}
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
                                onChange={(e) => handleChange("advance_days_required", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Admin Action Time Limit (Days)</Label>
                            <p className="text-xs text-slate-500 mb-2">Admin must approve or reject within this many days after application.</p>
                            <Input
                                type="number"
                                min="1"
                                value={policy.admin_action_days}
                                onChange={(e) => handleChange("admin_action_days", e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Policy
                </Button>
            </div>
        </div>
    );
}

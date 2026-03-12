import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function LeavePolicy() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'admin';

    const { data: policy, isLoading } = useQuery({
        queryKey: ["leave-policy"],
        queryFn: async () => {
            const list = await appClient.entities.LeavePolicy.list();
            return list?.[0] || { 
                max_sick: 15, 
                max_casual: 12, 
                max_earned: 20, 
                max_maternity: 90, 
                max_paternity: 15, 
                advance_days_required: 2, 
                admin_action_days: 5 
            };
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (newData) => {
            if (policy?.id) {
                return await appClient.entities.LeavePolicy.update(policy.id, newData);
            } else {
                return await appClient.entities.LeavePolicy.create(newData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-policy"] });
            toast({ title: "Success", description: "Leave policy updated successfully" });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        const formData = new FormData(e.target);
        const data = {
            max_sick: parseInt(formData.get("max_sick")),
            max_casual: parseInt(formData.get("max_casual")),
            max_earned: parseInt(formData.get("max_earned")),
            max_maternity: parseInt(formData.get("max_maternity")),
            max_paternity: parseInt(formData.get("max_paternity")),
            advance_days_required: parseInt(formData.get("advance_days_required")),
            admin_action_days: parseInt(formData.get("admin_action_days")),
        };
        updateMutation.mutate(data);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading policy...</div>;

    const currentPolicy = policy || {
        max_sick: 15, 
        max_casual: 12, 
        max_earned: 20, 
        max_maternity: 90, 
        max_paternity: 15, 
        advance_days_required: 2, 
        admin_action_days: 5
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leave Policy Settings</h1>
                    <p className="text-slate-500 mt-1">Define company rules and limits for employee leaves</p>
                </div>
                {isAdmin && (
                    <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                    </Button>
                )}
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
                            <Label>Max Sick Leaves</Label>
                            <Input
                                name="max_sick"
                                type="number"
                                min="0"
                                defaultValue={currentPolicy.max_sick}
                                readOnly={!isAdmin}
                                className={!isAdmin ? "bg-slate-50 cursor-not-allowed" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Casual Leaves</Label>
                            <Input
                                name="max_casual"
                                type="number"
                                min="0"
                                defaultValue={currentPolicy.max_casual}
                                readOnly={!isAdmin}
                                className={!isAdmin ? "bg-slate-50 cursor-not-allowed" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Earned Leaves</Label>
                            <Input
                                name="max_earned"
                                type="number"
                                min="0"
                                defaultValue={currentPolicy.max_earned}
                                readOnly={!isAdmin}
                                className={!isAdmin ? "bg-slate-50 cursor-not-allowed" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Maternity Leaves</Label>
                            <Input
                                name="max_maternity"
                                type="number"
                                min="0"
                                defaultValue={currentPolicy.max_maternity}
                                readOnly={!isAdmin}
                                className={!isAdmin ? "bg-slate-50 cursor-not-allowed" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Paternity Leaves</Label>
                            <Input
                                name="max_paternity"
                                type="number"
                                min="0"
                                defaultValue={currentPolicy.max_paternity}
                                readOnly={!isAdmin}
                                className={!isAdmin ? "bg-slate-50 cursor-not-allowed" : ""}
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
                            <p className="text-xs text-slate-500 mb-2">Days before the leave start date.</p>
                            <Input
                                name="advance_days_required"
                                type="number"
                                min="0"
                                defaultValue={currentPolicy.advance_days_required}
                                readOnly={!isAdmin}
                                className={!isAdmin ? "bg-slate-50 cursor-not-allowed" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Admin Action Time Limit (Days)</Label>
                            <p className="text-xs text-slate-500 mb-2">Auto-reject limit for pending requests.</p>
                            <Input
                                name="admin_action_days"
                                type="number"
                                min="1"
                                defaultValue={currentPolicy.admin_action_days}
                                readOnly={!isAdmin}
                                className={!isAdmin ? "bg-slate-50 cursor-not-allowed" : ""}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

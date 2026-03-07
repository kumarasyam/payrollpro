import React, { useState } from "react";
import { appClient } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Mail, Phone, Building2, Briefcase, Calendar, IndianRupee, Shield, Lock, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function MyProfile() {
    const { user, login } = useAuth();
    const qc = useQueryClient();
    const [editMode, setEditMode] = useState(false);
    const [pwDialog, setPwDialog] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [pwError, setPwError] = useState("");

    const { data: employee } = useQuery({
        queryKey: ["my-employee", user?.email],
        queryFn: () => appClient.entities.Employee.filter({ email: user.email }),
        enabled: !!user?.email,
        select: (data) => data?.[0],
    });

    const [contactForm, setContactForm] = useState({
        phone: "", email: "",
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => appClient.entities.Employee.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["my-employee"] });
            setEditMode(false);
            toast.success("Contact details updated!");
        },
    });

    const handleEditStart = () => {
        setContactForm({
            phone: employee?.phone || "",
            email: employee?.email || user?.email || "",
        });
        setEditMode(true);
    };

    const handleSaveContact = () => {
        if (employee?.id) {
            updateMutation.mutate({ id: employee.id, data: { phone: contactForm.phone } });
        } else {
            toast.error("No employee record found. Ask admin to add your employee record.");
            setEditMode(false);
        }
    };

    const handleChangePassword = () => {
        setPwError("");
        if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
            setPwError("All fields are required.");
            return;
        }
        if (pwForm.newPassword.length < 6) {
            setPwError("New password must be at least 6 characters.");
            return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwError("New passwords do not match.");
            return;
        }

        // Verify old password and update
        const users = JSON.parse(localStorage.getItem("payrollpro_users") || "[]");
        const idx = users.findIndex(u => u.email === user.email);
        if (idx === -1) {
            setPwError("User not found.");
            return;
        }
        if (users[idx].password !== pwForm.oldPassword) {
            setPwError("Current password is incorrect.");
            return;
        }
        users[idx].password = pwForm.newPassword;
        localStorage.setItem("payrollpro_users", JSON.stringify(users));
        setPwDialog(false);
        setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        toast.success("Password changed successfully!");
    };

    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{value || "—"}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 mt-1">View and manage your personal information</p>
            </div>

            {/* Profile Header */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />
                <CardContent className="p-6 -mt-12">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                            <User className="h-10 w-10 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-900">{user?.full_name || employee?.full_name || "Employee"}</h2>
                            <p className="text-sm text-slate-500">{employee?.designation || "Employee"} · {employee?.department || "Unassigned"}</p>
                            <div className="flex gap-2 mt-2">
                                <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">{user?.role || "employee"}</Badge>
                                <Badge className={`border-0 text-xs ${employee?.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                    }`}>{employee?.status?.replace("_", " ") || "N/A"}</Badge>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPwDialog(true)}>
                                <Lock className="h-4 w-4 mr-1" /> Change Password
                            </Button>
                            {!editMode ? (
                                <Button size="sm" onClick={handleEditStart} className="bg-indigo-600 hover:bg-indigo-700">
                                    Edit Profile
                                </Button>
                            ) : (
                                <Button size="sm" onClick={handleSaveContact} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Save className="h-4 w-4 mr-1" /> Save
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow icon={User} label="Full Name" value={employee?.full_name || user?.full_name} />
                        <InfoRow icon={Mail} label="Email" value={employee?.email || user?.email} />
                        {editMode ? (
                            <div className="p-3 bg-indigo-50 rounded-xl space-y-2">
                                <Label className="text-xs text-indigo-600 font-medium">Phone Number</Label>
                                <Input
                                    value={contactForm.phone}
                                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                                    placeholder="+1 234 567 890"
                                    className="bg-white"
                                />
                            </div>
                        ) : (
                            <InfoRow icon={Phone} label="Phone" value={employee?.phone} />
                        )}
                        <InfoRow icon={Shield} label="Role" value={user?.role} />
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow icon={Building2} label="Department" value={employee?.department} />
                        <InfoRow icon={Briefcase} label="Designation" value={employee?.designation} />
                        <InfoRow icon={Calendar} label="Date of Joining" value={employee?.date_of_joining} />
                        <InfoRow icon={IndianRupee} label="Base Salary" value={employee?.base_salary ? `₹${employee.base_salary.toLocaleString()}` : "—"} />
                    </CardContent>
                </Card>
            </div>

            {/* Leave Stats */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Leave Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 text-center p-4 bg-indigo-50 rounded-xl">
                            <p className="text-3xl font-bold text-indigo-600">{employee?.leave_balance ?? 24}</p>
                            <p className="text-xs text-slate-500 mt-1">Days Available</p>
                        </div>
                        <div className="flex-1 text-center p-4 bg-amber-50 rounded-xl">
                            <p className="text-3xl font-bold text-amber-600">{24 - (employee?.leave_balance ?? 24)}</p>
                            <p className="text-xs text-slate-500 mt-1">Days Used</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password Dialog */}
            <Dialog open={pwDialog} onOpenChange={setPwDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {pwError && (
                            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{pwError}</div>
                        )}
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showOld ? "text" : "password"}
                                    value={pwForm.oldPassword}
                                    onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                                    placeholder="Enter current password"
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    onClick={() => setShowOld(!showOld)}>
                                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showNew ? "text" : "password"}
                                    value={pwForm.newPassword}
                                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                    placeholder="Enter new password (min 6 chars)"
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    onClick={() => setShowNew(!showNew)}>
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input
                                type="password"
                                value={pwForm.confirmPassword}
                                onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                placeholder="Re-enter new password"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPwDialog(false)}>Cancel</Button>
                        <Button onClick={handleChangePassword} className="bg-indigo-600 hover:bg-indigo-700">
                            <Lock className="h-4 w-4 mr-1" /> Update Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

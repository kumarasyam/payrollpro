import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, Mail, Lock, User, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from "lucide-react";

export default function LoginPage() {
    const { login, register, authError } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "employee",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isRegister) {
                if (!form.full_name.trim()) {
                    setError("Full name is required");
                    setLoading(false);
                    return;
                }
                if (form.password.length < 4) {
                    setError("Password must be at least 4 characters");
                    setLoading(false);
                    return;
                }
                await register({
                    email: form.email,
                    password: form.password,
                    full_name: form.full_name,
                    role: form.role,
                });
            } else {
                await login(form.email, form.password);
            }
        } catch (err) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const fillAdmin = () => {
        setForm({ ...form, email: "admin@payrollpro.com", password: "admin123" });
        setIsRegister(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30 mb-4">
                        <IndianRupee className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">PayrollPro</h1>
                    <p className="text-slate-400 mt-1">Payroll Management System</p>
                </div>

                {/* Login Card */}
                <Card className="border-0 shadow-2xl shadow-black/20 bg-white/95 backdrop-blur-xl">
                    <CardContent className="p-8">
                        {/* Tab Switcher */}
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
                            <button
                                type="button"
                                onClick={() => { setIsRegister(false); setError(""); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${!isRegister
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                <LogIn className="h-4 w-4" />
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsRegister(true); setError(""); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${isRegister
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                <UserPlus className="h-4 w-4" />
                                Register
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name (Register only) */}
                            {isRegister && (
                                <div className="space-y-2">
                                    <Label className="text-slate-700 text-sm font-medium">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="text"
                                            placeholder="John Doe"
                                            value={form.full_name}
                                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 text-sm font-medium">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label className="text-slate-700 text-sm font-medium">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Role (Register only) */}
                            {isRegister && (
                                <div className="space-y-2">
                                    <Label className="text-slate-700 text-sm font-medium">Role</Label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, role: "employee" })}
                                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${form.role === "employee"
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                                }`}
                                        >
                                            <User className="h-5 w-5 mx-auto mb-1" />
                                            Employee
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, role: "admin" })}
                                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${form.role === "admin"
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                                }`}
                                        >
                                            <IndianRupee className="h-5 w-5 mx-auto mb-1" />
                                            Admin
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {(error || authError) && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                                    <p className="text-sm text-rose-600 font-medium">{error || authError}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {isRegister ? "Create Account" : "Sign In"}
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>


                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    © 2026 PayrollPro. Payroll Management System.
                </p>
            </div>
        </div>
    );
}

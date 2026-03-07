import React, { useState, useRef } from "react";
import { appClient } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, Eye, IndianRupee } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  approved: "bg-emerald-100 text-emerald-700",
  paid: "bg-indigo-100 text-indigo-700",
};

export default function MyPayslips() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const printRef = useRef();

  const { data: payslips = [] } = useQuery({
    queryKey: ["my-payslips", user?.email],
    queryFn: () => appClient.entities.Payslip.filter({ employee_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const handleDownload = (slip) => {
    const content = `
PAYSLIP - ${slip.month}
================================
Employee: ${slip.employee_name}
Department: ${slip.department}
Status: ${slip.status}

EARNINGS
--------
Base Salary:        ₹${slip.base_salary?.toLocaleString()}
HRA:                ₹${slip.hra?.toLocaleString()}
Transport:          ₹${slip.transport_allowance?.toLocaleString()}
Medical:            ₹${slip.medical_allowance?.toLocaleString()}
${slip.bonus > 0 ? `Bonus:              ₹${slip.bonus?.toLocaleString()}\n` : ""}
Gross Salary:       ₹${slip.gross_salary?.toLocaleString()}

DEDUCTIONS
----------
Tax:                ₹${slip.tax_deduction?.toLocaleString()}
Provident Fund:     ₹${slip.provident_fund?.toLocaleString()}
${slip.other_deductions > 0 ? `Other:              ₹${slip.other_deductions?.toLocaleString()}\n` : ""}
Total Deductions:   ₹${slip.total_deductions?.toLocaleString()}

================================
NET SALARY:         ₹${slip.net_salary?.toLocaleString()}
================================
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslip-${slip.month?.replace(/\s/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Payslips</h1>
        <p className="text-slate-500 mt-1">View and download your salary slips</p>
      </div>

      {payslips.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No payslips available yet</p>
            <p className="text-sm text-slate-400 mt-1">Your payslips will appear here once generated</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payslips.map((slip) => (
            <Card key={slip.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <IndianRupee className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{slip.month}</h3>
                      <p className="text-sm text-slate-400">{slip.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">₹{slip.net_salary?.toLocaleString()}</p>
                      <Badge className={`${statusColors[slip.status]} border-0 text-xs mt-1`}>{slip.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => setSelected(slip)} className="h-10 w-10">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" onClick={() => handleDownload(slip)} className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payslip Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText className="h-5 w-5" /> Payslip — {selected?.month}</span>
              <Button size="sm" onClick={() => handleDownload(selected)} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2" ref={printRef}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-400">Employee</p><p className="font-medium">{selected.employee_name}</p></div>
                <div><p className="text-slate-400">Department</p><p className="font-medium">{selected.department}</p></div>
              </div>
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-semibold text-sm text-emerald-700">Earnings</h4>
                <div className="text-sm space-y-1.5 bg-emerald-50/50 rounded-lg p-3">
                  <div className="flex justify-between"><span className="text-slate-500">Base Salary</span><span>₹{selected.base_salary?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">HRA</span><span>₹{selected.hra?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Transport Allowance</span><span>₹{selected.transport_allowance?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Medical Allowance</span><span>₹{selected.medical_allowance?.toLocaleString()}</span></div>
                  {selected.bonus > 0 && <div className="flex justify-between"><span className="text-slate-500">Bonus</span><span className="text-emerald-600 font-medium">₹{selected.bonus?.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-semibold pt-2 border-t border-emerald-200"><span>Gross Salary</span><span>₹{selected.gross_salary?.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-rose-700">Deductions</h4>
                <div className="text-sm space-y-1.5 bg-rose-50/50 rounded-lg p-3">
                  <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="text-rose-600">₹{selected.tax_deduction?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Provident Fund</span><span className="text-rose-600">₹{selected.provident_fund?.toLocaleString()}</span></div>
                  {selected.other_deductions > 0 && <div className="flex justify-between"><span className="text-slate-500">Other</span><span className="text-rose-600">₹{selected.other_deductions?.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-semibold pt-2 border-t border-rose-200"><span>Total Deductions</span><span className="text-rose-600">₹{selected.total_deductions?.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-5 flex justify-between items-center">
                <span className="font-bold text-indigo-900 text-lg">Net Salary</span>
                <span className="text-3xl font-bold text-indigo-600">₹{selected.net_salary?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
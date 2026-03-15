import React, { useState } from "react";
import { appClient } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PayslipDocument from "@/components/PayslipDocument";
import { toast } from "sonner";
import { format, startOfMonth, addMonths, isAfter, parseISO } from "date-fns";

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  approved: "bg-emerald-100 text-emerald-700",
  paid: "bg-indigo-100 text-indigo-700",
};

// Standard salary calculation logic as per user request
const calculateSalary = (annualSalary) => {
    const monthlySalary = annualSalary / 12;
    const basic = monthlySalary * 0.40;
    const hra = basic * 0.50;
    const conveyance = 2000;
    const specialAllowance = monthlySalary - (basic + hra + conveyance);
    const grossSalary = basic + hra + conveyance + specialAllowance;
    const pf = basic * 0.12;
    const professionalTax = 200;

    let annualTax = 0;
    if (annualSalary > 400000) {
        const firstSlab = 400000 * 0.10;
        const remaining = annualSalary - 400000;
        const secondSlab = remaining * 0.15;
        annualTax = firstSlab + secondSlab;
    } else {
        annualTax = annualSalary * 0.10;
    }

    const monthlyTax = annualTax / 12;
    const totalDeductions = pf + professionalTax + monthlyTax;
    const netSalary = grossSalary - totalDeductions;

    return {
        basic, hra, conveyance, specialAllowance, grossSalary,
        pf, professionalTax, monthlyTax, totalDeductions, netSalary
    };
};

export default function PayslipManagement() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [downloadingSlip, setDownloadingSlip] = useState(null);
  const hiddenRef = React.useRef(null);
  const qc = useQueryClient();

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ["payslips"],
    queryFn: () => appClient.entities.Payslip.list("-created_date"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => appClient.entities.Employee.list(),
  });

  const [form, setForm] = useState({
    employee_email: "", month: "", bonus: 0, other_deductions: 0, status: "generated",
  });

  const createMutation = useMutation({
    mutationFn: (data) => appClient.entities.Payslip.create(data),
    onSuccess: (data) => { 
      qc.invalidateQueries({ queryKey: ["payslips"] }); 
      setFormOpen(false); 
      toast.success(`Payslip generated successfully for ${data.month}`);
    },
    onError: (err) => toast.error(err.message || "Failed to generate payslip"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.Payslip.update(id, data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["payslips"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(err.message || "Update failed"),
  });

  const handleGenerate = () => {
    const emp = employees.find((e) => e.email === form.employee_email);
    if (!emp || !form.month) {
      toast.error("Please select an employee and an eligible month");
      return;
    }
    
    // Calculate using the new logic
    // We assume emp.base_salary is the targeted monthly gross for the employee
    const annualSalary = (emp.base_salary || 0) * 12;
    const calc = calculateSalary(annualSalary);
    
    const bonus = parseFloat(form.bonus) || 0;
    const otherDed = form.other_deductions || 0;
    
    const finalGross = calc.grossSalary + bonus;
    const finalTotalDed = calc.totalDeductions + otherDed;
    const finalNet = finalGross - finalTotalDed;

    createMutation.mutate({
      employee_name: emp.full_name,
      employee_email: emp.email,
      department: emp.department,
      month: form.month,
      base_salary: calc.basic,
      hra: calc.hra, 
      transport_allowance: calc.conveyance, 
      medical_allowance: 0,
      special_allowance: calc.specialAllowance,
      bonus, 
      tax_deduction: Math.round(calc.monthlyTax * 100) / 100,
      provident_fund: Math.round(calc.pf * 100) / 100,
      professional_tax: calc.professionalTax,
      other_deductions: otherDed,
      gross_salary: Math.round(finalGross * 100) / 100,
      total_deductions: Math.round(finalTotalDed * 100) / 100,
      net_salary: Math.round(finalNet * 100) / 100,
      status: form.status,
    });
  };

  const handleDownload = (slip) => {
    setDownloadingSlip(slip);
    const toastId = toast.loading("Generating PDF...");
    setTimeout(async () => {
      if (!hiddenRef.current) return;
      try {
        const canvas = await html2canvas(hiddenRef.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Payslip_${slip.month}_${slip.employee_name}.pdf`);
        toast.success("PDF Downloaded successfully", { id: toastId });
      } catch (err) {
        toast.error("Failed to generate PDF", { id: toastId });
      } finally {
        setDownloadingSlip(null);
      }
    }, 500);
  };

  const filtered = payslips.filter((p) =>
    p.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.month?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payslips</h1>
          <p className="text-slate-500 mt-1">Generate and manage employee payslips</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Generate Payslip
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search payslips..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">No payslips found</TableCell></TableRow>
              ) : (
                filtered.map((slip) => (
                  <TableRow key={slip.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{slip.employee_name}</p>
                        <p className="text-xs text-slate-400">{slip.department}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{slip.month}</TableCell>
                    <TableCell className="font-medium">₹{slip.gross_salary?.toLocaleString()}</TableCell>
                    <TableCell className="text-rose-600">₹{slip.total_deductions?.toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-slate-900">₹{slip.net_salary?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${statusColors[slip.status]} border-0 text-xs`}>{slip.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(slip)}>
                        <Download className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(slip); setViewOpen(true); }}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      {slip.status === "draft" && (
                        <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => updateMutation.mutate({ id: slip.id, data: { status: "approved" } })}>
                          Approve
                        </Button>
                      )}
                      {slip.status === "approved" && (
                        <Button variant="ghost" size="sm" className="text-indigo-600" onClick={() => updateMutation.mutate({ id: slip.id, data: { status: "paid" } })}>
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Generate Payslip Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Payslip</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Employee</Label>
              <Select value={form.employee_email} onValueChange={(v) => {
                const emp = employees.find(e => e.email === v);
                let defaultMonth = "";
                if (emp) {
                  const joiningDateStr = emp.date_of_joining || emp.created_date;
                  if (joiningDateStr) {
                    const joiningDate = parseISO(joiningDateStr);
                    const firstMonth = addMonths(startOfMonth(joiningDate), 1);
                    const currentMonth = startOfMonth(new Date()); 
                    
                    const eligibleMonths = [];
                    let temp = firstMonth;
                    while (!isAfter(temp, currentMonth)) {
                      eligibleMonths.push(format(temp, "MMMM yyyy"));
                      temp = addMonths(temp, 1);
                    }
                    if (eligibleMonths.length > 0) {
                      defaultMonth = eligibleMonths[eligibleMonths.length - 1]; // Pick most recent
                    }
                  }
                }
                setForm({ ...form, employee_email: v, month: defaultMonth, bonus: 0, other_deductions: 0 });
              }}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.email}>{e.full_name} — {e.department}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month</Label>
              {(() => {
                const emp = employees.find((e) => e.email === form.employee_email);
                if (!emp) return <Input disabled placeholder="Select employee first" />;
                
                const joiningDateStr = emp.date_of_joining || emp.created_date;
                if (!joiningDateStr) return <p className="text-xs text-rose-500">Error: Joining date missing for employee</p>;

                // Calculate eligible months: Starting from Month AFTER joining, up to current month
                const joiningDate = parseISO(joiningDateStr);
                const firstMonth = addMonths(startOfMonth(joiningDate), 1);
                const currentMonth = startOfMonth(new Date()); 
                
                const eligibleMonths = [];
                let temp = firstMonth;
                while (!isAfter(temp, currentMonth)) {
                  eligibleMonths.push(format(temp, "MMMM yyyy"));
                  temp = addMonths(temp, 1);
                }
                eligibleMonths.reverse();

                if (eligibleMonths.length === 0) {
                  return <p className="text-xs text-amber-600 mt-1">No eligible months yet (payslips start 1 month after joining)</p>;
                }

                return (
                  <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}>
                    <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                    <SelectContent>
                      {eligibleMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>
            {(() => {
              const emp = employees.find((e) => e.email === form.employee_email);
              if (!emp) return null;
              
              const annualSalary = (emp.base_salary || 0) * 12;
              const calc = calculateSalary(annualSalary);
              
              return (
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm border">
                  <h4 className="font-semibold text-slate-700 mb-2 border-b pb-2">Calculated Breakdown</h4>
                  <div className="flex justify-between text-slate-600"><span>Basic (40%):</span> <span>₹{Math.round(calc.basic).toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>HRA (50% of Basic):</span> <span>₹{Math.round(calc.hra).toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Conveyance:</span> <span>₹{Math.round(calc.conveyance).toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Special Allowance:</span> <span>₹{Math.round(calc.specialAllowance).toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t"><span>Gross Monthly:</span> <span>₹{Math.round(calc.grossSalary).toLocaleString()}</span></div>
                  
                  <div className="flex justify-between text-rose-600 mt-2"><span>Monthly Tax:</span> <span>-₹{Math.round(calc.monthlyTax).toLocaleString()}</span></div>
                  <div className="flex justify-between text-rose-600"><span>PF (12% of Basic):</span> <span>-₹{Math.round(calc.pf).toLocaleString()}</span></div>
                  <div className="flex justify-between text-rose-600"><span>Prof. Tax:</span> <span>-₹{calc.professionalTax}</span></div>
                  <div className="flex justify-between font-bold pt-2 border-t text-indigo-700">
                    <span>Estimated Net:</span> 
                    <span>₹{Math.round(calc.netSalary).toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bonus (₹)</Label>
                <Input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: parseFloat(e.target.value) || 0 })} placeholder="0" />
              </div>
              <div>
                <Label>Other Deductions (₹)</Label>
                <Input type="number" value={form.other_deductions} onChange={(e) => setForm({ ...form, other_deductions: parseFloat(e.target.value) || 0 })} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} className="bg-indigo-600 hover:bg-indigo-700">Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payslip Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Payslip Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-400">Employee</p><p className="font-medium">{selected.employee_name}</p></div>
                <div><p className="text-slate-400">Department</p><p className="font-medium">{selected.department}</p></div>
                <div><p className="text-slate-400">Month</p><p className="font-medium">{selected.month}</p></div>
                <div><p className="text-slate-400">Status</p><Badge variant="outline" className={`${statusColors[selected.status]} border-0`}>{selected.status}</Badge></div>
              </div>
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-semibold text-sm text-slate-700">Earnings</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Base Salary</span><span>₹{selected.base_salary?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">HRA</span><span>₹{selected.hra?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Transport</span><span>₹{selected.transport_allowance?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Medical</span><span>₹{selected.medical_allowance?.toLocaleString()}</span></div>
                  {selected.bonus > 0 && <div className="flex justify-between"><span className="text-slate-500">Bonus</span><span className="text-emerald-600">₹{selected.bonus?.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-medium pt-1 border-t"><span>Gross Salary</span><span>₹{selected.gross_salary?.toLocaleString()}</span></div>
                  {selected.special_allowance > 0 && <div className="flex justify-between"><span className="text-slate-500">Special Allowance</span><span>₹{selected.special_allowance?.toLocaleString()}</span></div>}
                </div>
              </div>
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-semibold text-sm text-slate-700">Deductions</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="text-rose-600">₹{selected.tax_deduction?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Provident Fund</span><span className="text-rose-600">₹{selected.provident_fund?.toLocaleString()}</span></div>
                  {selected.professional_tax > 0 && <div className="flex justify-between"><span className="text-slate-500">Prof. Tax</span><span className="text-rose-600">₹{selected.professional_tax?.toLocaleString()}</span></div>}
                  {selected.other_deductions > 0 && <div className="flex justify-between"><span className="text-slate-500">Other</span><span className="text-rose-600">₹{selected.other_deductions?.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-medium pt-1 border-t"><span>Total Deductions</span><span className="text-rose-600">₹{selected.total_deductions?.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 flex justify-between items-center">
                <span className="font-semibold text-indigo-900">Net Salary</span>
                <span className="text-2xl font-bold text-indigo-600">₹{selected.net_salary?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden container for PDF rendering */}
      {downloadingSlip && (
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
            <PayslipDocument ref={hiddenRef} slip={downloadingSlip} />
        </div>
      )}
    </div>
  );
}
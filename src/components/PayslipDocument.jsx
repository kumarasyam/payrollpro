import React, { forwardRef } from 'react';

// Simple number to Indian Rupees words converter
const numberToWords = (num) => {
    if (!num) return "Zero";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Night", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    const inWords = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + inWords(n % 100) : "");
        if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
        return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
    };

    return "Rupees " + inWords(Math.floor(num)) + " Only";
};

const PayslipDocument = forwardRef(({ slip }, ref) => {
    if (!slip) return null;

    // Mapping our features to the format
    const formatAmount = (val) => (val ? Number(val).toFixed(2) : "-");

    const earnings = [
        { label: "BASIC", amount: slip.base_salary },
        { label: "DA", amount: 0 },
        { label: "HRA", amount: slip.hra },
        { label: "MEDICAL ALLOWANCE", amount: slip.medical_allowance },
        { label: "CONVEYANCE / TRANSPORT", amount: slip.transport_allowance },
        { label: "OTHER ALLOWANCE", amount: 0 },
        { label: "GROSS TOTAL", amount: slip.gross_salary - (slip.bonus || 0), isBold: true },
        { label: "BONUS", amount: slip.bonus },
        { label: "SPECIAL ALLOWANCE", amount: slip.special_allowance || 0 },
        { label: "SUB TOTAL", amount: slip.gross_salary, isBold: true },
        { label: "ALLOWANCE", amount: 0 }
    ];

    const deductions = [
        { label: "PF (12% of Basic)", amount: slip.provident_fund },
        { label: "ESI", amount: 0 },
        { label: "TDS / TAX", amount: slip.tax_deduction },
        { label: "PROFESSIONAL TAX", amount: slip.professional_tax || 0 },
        { label: "CUG", amount: 0 },
        { label: "CANTEEN CHARGES", amount: 0 },
        { label: "LWF", amount: 0 },
        { label: "OTHER DEDUCTION", amount: slip.other_deductions },
        { label: "", amount: 0 },
        { label: "", amount: 0 },
        { label: "TOTAL DEDUCTION", amount: slip.total_deductions, isBold: true }
    ];

    // Ensure both arrays have the same length for table rendering
    const maxRows = Math.max(earnings.length, deductions.length);

    return (
        <div ref={ref} className="bg-white p-8 w-full mx-auto" style={{ width: "210mm", minHeight: "297mm", color: "black", fontFamily: "serif" }}>
            {/* Header info */}
            <div className="text-center pb-6 border-b-2 border-black mb-6">
                <h1 className="text-2xl font-bold uppercase tracking-wider">Salary Slip</h1>
                <p className="mt-1 font-semibold uppercase">{slip.month}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
                <div>
                    <div className="grid grid-cols-3 gap-2 py-1"><span className="font-bold text-gray-700">Name</span><span className="col-span-2 uppercase">: {slip.employee_name}</span></div>
                    <div className="grid grid-cols-3 gap-2 py-1"><span className="font-bold text-gray-700">Department</span><span className="col-span-2 uppercase">: {slip.department}</span></div>
                    <div className="grid grid-cols-3 gap-2 py-1"><span className="font-bold text-gray-700">Email</span><span className="col-span-2">: {slip.employee_email}</span></div>
                </div>
                <div>
                    <div className="grid grid-cols-3 gap-2 py-1"><span className="font-bold text-gray-700">Status</span><span className="col-span-2 uppercase">: {slip.status}</span></div>
                    <div className="grid grid-cols-3 gap-2 py-1"><span className="font-bold text-gray-700">Generated</span><span className="col-span-2">: {new Date().toLocaleDateString('en-GB')}</span></div>
                </div>
            </div>

            {/* Table layout matching the image exactly */}
            <table className="w-full border-collapse border border-black text-sm">
                <thead>
                    <tr className="border-b border-black text-center font-bold">
                        <th className="border-r border-black p-2 py-3 w-1/4">COMPONENTS</th>
                        <th className="border-r border-black p-2 py-3 w-1/5">EARNED SALARY<br/><span className="text-xs font-normal">(in Rs.)</span></th>
                        <th className="border-r border-black p-2 py-3 w-1/4">DEDUCTIONS</th>
                        <th className="border-r border-black p-2 py-3 w-1/5">AMOUNT<br/><span className="text-xs font-normal">(in Rs.)</span></th>
                        <th className="p-2 py-3">NET PAY<br/><span className="text-xs font-normal">(in Rs.)</span></th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: maxRows }).map((_, i) => (
                        <tr key={i} className="border-b border-black">
                            {/* Earnings column */}
                            <td className="border-r border-black px-3 py-2 font-bold text-[13px]">
                                {earnings[i] ? earnings[i].label : ""}
                            </td>
                            <td className={`border-r border-black px-3 py-2 text-right ${earnings[i]?.isBold ? 'font-bold' : ''}`}>
                                {earnings[i] ? formatAmount(earnings[i].amount) : ""}
                            </td>
                            
                            {/* Deductions column */}
                            <td className="border-r border-black px-3 py-2 font-bold text-[13px]">
                                {deductions[i] ? deductions[i].label : ""}
                            </td>
                            <td className={`border-r border-black px-3 py-2 text-right ${deductions[i]?.isBold ? 'font-bold' : ''}`}>
                                {deductions[i] ? formatAmount(deductions[i].amount) : ""}
                            </td>

                            {/* Net Pay column (merged vertically across all rows) */}
                            {i === 0 ? (
                                <td rowSpan={maxRows} className="px-3 py-2 text-center align-middle relative h-full">
                                    <span className="text-xl font-bold tracking-wider">{formatAmount(slip.net_salary)}</span>
                                </td>
                            ) : null}
                        </tr>
                    ))}
                    
                    {/* Amount in Words Footer Row */}
                    <tr className="border-b border-black">
                        <td className="border-r border-black px-3 py-3 font-bold text-[13px] bg-gray-50 align-top" rowSpan={2}>
                            AMOUNT IN WORDS
                        </td>
                        <td colSpan={3} className="border-r border-black px-3 py-2 text-center font-medium border-b border-black">
                            {numberToWords(slip.net_salary)}
                        </td>
                        {/* Net pay column continues merging or is left blank. But we shouldn't have conflicts. Wait. 
                            Since we used rowSpan={maxRows} on the first row of Net Pay, let's keep it clean. 
                            We will explicitly leave the 5th column out here so rowSpan={maxRows} falls naturally. Wait, we need to span the remaining column.
                        */}
                    </tr>
                    <tr className="border-b border-black">
                        <td colSpan={4} className="px-3 py-2 text-center text-xs text-gray-600 bg-gray-50 border-r border-black">
                            *This is a computer generated copy, Signature not required*
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
});

PayslipDocument.displayName = 'PayslipDocument';

export default PayslipDocument;

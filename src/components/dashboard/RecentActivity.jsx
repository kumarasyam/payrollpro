import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  draft: "bg-slate-100 text-slate-700",
  paid: "bg-indigo-100 text-indigo-700",
};

export default function RecentActivity({ title, items, type }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {type === "leave" ? item.employee_name : item.employee_name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {type === "leave"
                      ? `${item.leave_type?.replace(/_/g, " ")} · ${item.days || "—"} days`
                      : `${item.month} · ₹${item.net_salary?.toLocaleString() || "—"}`}
                  </p>
                </div>
                <Badge className={`${statusColors[item.status]} border-0 text-xs font-medium`}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React from "react";

export default function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const gradientMap = {
    indigo: "from-indigo-500 to-blue-600 shadow-indigo-500/30",
    emerald: "from-emerald-400 to-teal-500 shadow-emerald-500/30",
    amber: "from-amber-400 to-orange-500 shadow-orange-500/30",
    rose: "from-rose-400 to-pink-600 shadow-rose-500/30",
    blue: "from-blue-400 to-cyan-500 shadow-blue-500/30",
    purple: "from-purple-500 to-fuchsia-600 shadow-fuchsia-500/30",
  };

  const bgGrad = gradientMap[color] || gradientMap.indigo;

  return (
    <div className="glass-card relative overflow-hidden p-6 rounded-2xl group border-white/60">
      {/* Decorative blurred background blob */}
      <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br ${bgGrad} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-500/80 uppercase tracking-widest mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-foreground tracking-tight drop-shadow-sm">{value}</h3>
          </div>
          {subtitle && <p className="text-sm font-medium text-slate-500/70 mt-2">{subtitle}</p>}
        </div>

        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${bgGrad} shadow-lg transform group-hover:scale-110 transition-transform duration-300 ease-out`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </div>
  );
}
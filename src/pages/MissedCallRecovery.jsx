import { useState } from "react";
import { MISSED_CALLS_RECOVERY } from "../data/mockLeads";

const missedCallsData = MISSED_CALLS_RECOVERY;

const workflowStages = [
  { id: "missed_call", label: "Missed Call", icon: "📵", color: "#f87171" },
  { id: "ai_intake", label: "AI Intake", icon: "🤖", color: "#fb923c" },
  { id: "lead_created", label: "Lead Created", icon: "🧾", color: "#facc15" },
  { id: "quote_generated", label: "Quote Generated", icon: "💰", color: "#34d399" },
];

const urgencyConfig = {
  critical: { label: "Critical", bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40", dot: "bg-red-400" },
  high: { label: "High", bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40", dot: "bg-orange-400" },
  medium: { label: "Medium", bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-500/40", dot: "bg-yellow-300" },
  low: { label: "Low", bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/40", dot: "bg-slate-400" },
};

const statusConfig = {
  pending: { label: "Pending", bg: "bg-red-500/10", text: "text-red-400" },
  scheduled: { label: "Scheduled", bg: "bg-blue-500/10", text: "text-blue-400" },
  converted: { label: "Converted", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  recovered: { label: "Recovered", bg: "bg-teal-500/10", text: "text-teal-400" },
};

function KPICard({ icon, label, value, sub, subColor = "text-emerald-400" }) {
  return (
    <div className="bg-[#131c2e] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className={`text-xs font-medium ${subColor}`}>{sub}</div>}
    </div>
  );
}

function WorkflowBar({ activeStage }) {
  const stageIndex = workflowStages.findIndex((s) => s.id === activeStage);
  return (
    <div className="flex items-center gap-0">
      {workflowStages.map((stage, i) => {
        const isActive = i === stageIndex;
        const isPast = i < stageIndex;
        return (
          <div key={stage.id} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? "text-white border border-white/20"
                  : isPast
                  ? "text-emerald-400 border border-emerald-500/30"
                  : "text-slate-600 border border-white/5"
              }`}
              style={isActive ? { background: stage.color + "30", borderColor: stage.color + "60" } : {}}
            >
              <span>{stage.icon}</span>
              <span className="hidden sm:inline">{stage.label}</span>
            </div>
            {i < workflowStages.length - 1 && (
              <div className={`w-6 h-px mx-1 ${isPast || isActive ? "bg-emerald-500/40" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MissedCallRow({ call, isExpanded, onToggle }) {
  const urgency = urgencyConfig[call.urgency];
  const status = statusConfig[call.status];

  return (
    <>
      <tr
        className={`border-b border-white/[0.04] cursor-pointer transition-colors ${
          isExpanded ? "bg-[#1a2540]" : "hover:bg-white/[0.02]"
        }`}
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${urgency.dot} ${call.urgency === "critical" ? "animate-pulse" : ""}`} />
            <div>
              <div className="text-sm font-semibold text-white">{call.caller}</div>
              <div className="text-xs text-slate-500">{call.phone}</div>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-xs text-slate-400">
          <div>{call.time}</div>
          <div className="text-slate-600">{call.location}</div>
        </td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${urgency.bg} ${urgency.text} ${urgency.border}`}>
            {call.urgency === "critical" && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
            {urgency.label}
          </span>
        </td>
        <td className="py-3 px-4">
          <div className="text-xs font-medium text-slate-300">{call.projectType}</div>
          <div className="text-xs text-orange-400 font-bold">${call.estimatedValue.toLocaleString()}</div>
        </td>
        <td className="py-3 px-4 hidden md:table-cell">
          <WorkflowBar activeStage={call.leadStage} />
        </td>
        <td className="py-3 px-4">
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <button
              className="text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-lg font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Call Back
            </button>
            <span className="text-slate-600 text-xs">{isExpanded ? "▲" : "▼"}</span>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-[#0f1829] border-b border-white/[0.04]">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* AI Summary */}
              <div className="lg:col-span-2 bg-[#131c2e] rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-orange-400 text-sm">🤖</span>
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">AI Intake Summary</span>
                  <span className="ml-auto text-xs text-slate-500 font-mono">{call.id}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{call.aiSummary}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {call.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-white/5 text-slate-400 border border-white/10 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <div className="bg-[#131c2e] rounded-xl p-4 border border-white/[0.07]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Call Details</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Attempts</span>
                      <span className="text-white font-medium">{call.attempts}×</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration</span>
                      <span className="text-white font-medium">{call.duration}</span>
                    </div>
                    {call.callbackScheduled && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Scheduled</span>
                        <span className="text-blue-400 font-medium">{call.callbackScheduled}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-[#131c2e] hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/40 text-slate-300 hover:text-orange-400 text-xs py-2 rounded-lg transition-all font-medium">
                    + Schedule Reminder
                  </button>
                  <button className="flex-1 bg-orange-500 hover:bg-orange-400 text-black text-xs py-2 rounded-lg transition-all font-bold">
                    Create Lead →
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function MissedCallRecovery() {
  const [expandedId, setExpandedId] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const totalValue = missedCallsData.reduce((s, c) => s + c.estimatedValue, 0);
  const pendingCount = missedCallsData.filter((c) => c.status === "pending").length;
  const criticalCount = missedCallsData.filter((c) => c.urgency === "critical").length;
  const recoveredCount = missedCallsData.filter((c) => c.status === "recovered" || c.status === "converted").length;

  const filtered = missedCallsData.filter((c) => {
    if (filterUrgency !== "all" && c.urgency !== filterUrgency) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-full w-full bg-[#0a1120] text-white font-sans p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <span className="text-base">📵</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Missed Call Recovery</h1>
            {criticalCount > 0 && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {criticalCount} Critical
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">AI-powered intake summaries · Automated lead conversion · Follow-up reminders</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs bg-[#131c2e] hover:bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-lg transition-colors font-medium">
            Export CSV
          </button>
          <button className="text-xs bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg transition-colors">
            + Log Manual Call
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard icon="📵" label="Missed Calls" value={missedCallsData.length} sub="+3 since yesterday" />
        <KPICard icon="🚨" label="Pending Action" value={pendingCount} sub={`${criticalCount} critical`} subColor="text-red-400" />
        <KPICard icon="💰" label="Pipeline at Risk" value={`$${(totalValue / 1000).toFixed(0)}k`} sub="Unrecovered value" subColor="text-orange-400" />
        <KPICard icon="✅" label="Recovered" value={`${recoveredCount}/${missedCallsData.length}`} sub="This week" subColor="text-emerald-400" />
      </div>

      {/* Workflow Pipeline Banner */}
      <div className="bg-[#131c2e] border border-white/[0.07] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Recovery Workflow</div>
            <div className="text-sm text-slate-300">Every missed call is automatically analysed and routed through the AI intake pipeline.</div>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {workflowStages.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-1">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={{ background: stage.color + "18", borderColor: stage.color + "50", color: stage.color }}
                >
                  <span>{stage.icon}</span>
                  <span>{stage.label}</span>
                </div>
                {i < workflowStages.length - 1 && (
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Filter:</span>
        <div className="flex gap-1">
          {["all", "critical", "high", "medium", "low"].map((u) => (
            <button
              key={u}
              onClick={() => setFilterUrgency(u)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium capitalize transition-colors border ${
                filterUrgency === u
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                  : "bg-transparent text-slate-500 border-white/10 hover:text-slate-300"
              }`}
            >
              {u === "all" ? "All Urgency" : u}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "pending", "scheduled", "recovered", "converted"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium capitalize transition-colors border ${
                filterStatus === s
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                  : "bg-transparent text-slate-500 border-white/10 hover:text-slate-300"
              }`}
            >
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-[#131c2e] border border-white/[0.07] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Caller", "Time / Location", "Urgency", "Project / Value", "Recovery Stage", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className={`py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest ${
                    h === "Recovery Stage" ? "hidden md:table-cell" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((call) => (
              <MissedCallRow
                key={call.id}
                call={call}
                isExpanded={expandedId === call.id}
                onToggle={() => setExpandedId(expandedId === call.id ? null : call.id)}
              />
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-500 text-sm">No missed calls match the current filters.</div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        AI intake summaries are generated automatically within 60 seconds of a missed call. Estimated values are indicative only.
      </div>
    </div>
  );
}

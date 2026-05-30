import { useState, useEffect, useCallback } from "react";
import { BRAND } from "../theme/brand";
import { formatDisplayHeaderDate } from "../utils/displayDate";
import {
  postQuoteWebhook,
  buildDashboardQuotePayload,
  extractProposalFromResponse,
} from "../utils/quoteWebhook";
import {
  DASHBOARD_LEADS,
  DASHBOARD_MISSED_CALLS,
  QUOTE_TEMPLATES,
  LOGGED_IN_USER,
} from "../data/mockLeads";

/* ─── Design tokens ──────────────────────────────────────── */
const C = {
  ...BRAND,
  navyMid:     BRAND.navyLight,
  navyLight:   BRAND.navyCard,
  accent:      BRAND.orange,
  accentLight: BRAND.orangeLight,
  accentPale:  BRAND.orangePale,
  borderAccent:BRAND.orangeBorder,
  slate:       "#3A5068",
  slateLight:  "#6B8FA8",
  text:        "#E8EDF2",
  textMuted:   "#8AACBF",
  textDim:     "#4F6E84",
};

/* ─── Static data ────────────────────────────────────────── */
const KPI_DATA = [
  { label: "Monthly Revenue",  value: "$84,320", delta: "+18.4%",   up: true,  sub: "vs last month",  icon: "💰" },
  { label: "Active Leads",     value: "47",       delta: "+12",      up: true,  sub: "this week",      icon: "📋" },
  { label: "Jobs in Progress", value: "11",       delta: "-2",       up: false, sub: "from last week", icon: "🔨" },
  { label: "Quote Conversion", value: "68%",      delta: "+5.2%",    up: true,  sub: "30-day avg",     icon: "📈" },
  { label: "Avg Job Value",    value: "$7,665",   delta: "+$420",    up: true,  sub: "this quarter",   icon: "🏷️" },
  { label: "Missed Calls",     value: "9",        delta: "3 recovered", up: true, sub: "this week",   icon: "📞" },
];

const PIPELINE_STAGES = [
  { label: "New Lead",    count: 12, color: "#6B8FA8" },
  { label: "Site Inspect",count: 7,  color: C.blue },
  { label: "Quote Sent",  count: 11, color: BRAND.orange },
  { label: "Negotiating", count: 5,  color: "#E87A20" },
  { label: "Won",         count: 8,  color: C.green },
  { label: "Lost",        count: 4,  color: C.red },
];

const STAGE_COLORS = {
  "New Lead":    { bg: "rgba(74,158,232,0.15)",   text: C.blue },
  "Site Inspect":{ bg: "rgba(138,172,191,0.15)",  text: "#6B8FA8" },
  "Quote Sent":  { bg: BRAND.orangePale,           text: BRAND.orange },
  "Negotiating": { bg: "rgba(232,122,32,0.15)",   text: "#E87A20" },
  "Won":         { bg: "rgba(45,191,138,0.15)",   text: C.green },
  "Lost":        { bg: "rgba(232,80,80,0.15)",    text: C.red },
};

const PRIORITY_DOT = { hot: C.red, warm: BRAND.orange, cold: "#6B8FA8" };

const EMPTY_CONTACT = { name: "", phone: "", email: "", suburb: "" };

/* ─── Shared input styles ────────────────────────────────── */
const inputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.25)",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12,
  color: C.text,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const labelStyle = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: C.textMuted,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 5,
};

/* ─── Toast ──────────────────────────────────────────────── */
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [message]);

  const colors = {
    success: { bg: "rgba(45,191,138,0.12)", border: "rgba(45,191,138,0.35)", text: C.green },
    error:   { bg: "rgba(232,80,80,0.12)",  border: "rgba(232,80,80,0.35)",  text: C.red },
    info:    { bg: "rgba(74,158,232,0.12)", border: "rgba(74,158,232,0.35)", text: C.blue },
  };
  const s = colors[type] || colors.info;

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        background: C.navyMid, border: `1px solid ${s.border}`,
        borderLeft: `3px solid ${s.text}`,
        borderRadius: 10, padding: "12px 18px",
        fontSize: 13, fontWeight: 600, color: s.text,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        cursor: "pointer", maxWidth: 340,
        animation: "slideUp 0.25s ease",
      }}
    >
      {message}
    </div>
  );
}

/* ─── useToast ───────────────────────────────────────────── */
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, type = "info") => setToast({ message, type }), []);
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, show, dismiss };
}

/* ─── Proposal renderer ──────────────────────────────────── */
function renderProposalText(proposal) {
  if (!proposal) return "";
  const lines = [];
  const scope = proposal.scopeOfWork;
  const reco  = proposal.recommendations;
  const mats  = proposal.materials;
  const warr  = proposal.warranty;
  const summ  = proposal.summary;

  if (scope?.overview) {
    lines.push("**Scope of Works**", scope.overview, "");
    scope.steps?.forEach(s => lines.push(`• ${s}`));
    lines.push("");
  }
  if (reco?.system) {
    lines.push(`**Recommended System:** ${reco.system}`, reco.rationale || "", "");
    reco.items?.forEach(r => lines.push(`• ${r}`));
    lines.push("");
  }
  if (mats?.items?.length) {
    lines.push("**Materials:**");
    mats.items.forEach(m => lines.push(`• ${m.product} — ${m.qty} ${m.unit}`));
    lines.push("");
  }
  if (warr?.duration) {
    lines.push(`**Warranty:** ${warr.duration}`, warr.statement || "", "");
  }
  if (summ?.lowEstimate) {
    lines.push(`**Investment: $${summ.lowEstimate.toLocaleString()} – $${summ.highEstimate.toLocaleString()} + GST**`);
  }
  return lines.join("\n");
}

/* ─── Fallback template text ─────────────────────────────── */
function getLocalTemplate(lead) {
  const job = lead?.job?.toLowerCase() || "";
  if (job.includes("bathroom") || job.includes("shower")) return QUOTE_TEMPLATES.bathroom;
  if (job.includes("roof")) return QUOTE_TEMPLATES.roof;
  return QUOTE_TEMPLATES.epoxy;
}

/* ─── Typewriter stream ──────────────────────────────────── */
function streamText(text, onTick, onDone, speed = 12) {
  let i = 0;
  const iv = setInterval(() => {
    i += 3;
    onTick(text.slice(0, i));
    if (i >= text.length) {
      clearInterval(iv);
      onTick(text);
      onDone();
    }
  }, speed);
  return () => clearInterval(iv);
}

/* ─── AIQuotePanel ───────────────────────────────────────── */
function AIQuotePanel({ lead, showToast }) {
  const [status, setStatus]   = useState("idle"); // idle | sending | streaming | done | error
  const [aiText, setAiText]   = useState("");
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync contact fields when lead changes
  useEffect(() => {
    setContact(
      lead
        ? { name: lead.name || "", phone: lead.phone || "", email: "", suburb: lead.suburb || "" }
        : EMPTY_CONTACT
    );
    setStatus("idle");
    setAiText("");
    setErrorMsg("");
  }, [lead?.id]);

  const setField = (key) => (e) => setContact(c => ({ ...c, [key]: e.target.value }));

  const canGenerate = Boolean(lead && contact.name.trim() && status !== "sending" && status !== "streaming");

  const generate = async () => {
    if (!canGenerate) return;

    setStatus("sending");
    setAiText("");
    setErrorMsg("");

    const action = status === "done" ? "regenerate" : "generate";
    const payload = buildDashboardQuotePayload(lead, contact, action);

    try {
      const data = await postQuoteWebhook(payload);
      const proposal = extractProposalFromResponse(data);

      // Use webhook response if it contains a valid proposal, else fall back to template
      const text = proposal ? renderProposalText(proposal) : getLocalTemplate(lead);

      setStatus("streaming");
      streamText(
        text,
        (chunk) => setAiText(chunk),
        ()      => setStatus("done"),
      );

      showToast(`Quote generated for ${contact.name}`, "success");
    } catch (err) {
      // Fallback: stream local template so the user always sees output
      const text = getLocalTemplate(lead);
      setStatus("streaming");
      streamText(
        text,
        (chunk) => setAiText(chunk),
        ()      => {
          setStatus("done");
          setErrorMsg("Webhook unavailable — showing template quote.");
          showToast("Webhook unavailable — showing template quote", "error");
        },
      );
    }
  };

  const handleCopy = () => {
    if (!aiText) return;
    navigator.clipboard.writeText(aiText).then(() => showToast("Quote copied to clipboard", "success"));
  };

  const btnLabel = { idle: "Generate Quote", sending: "Contacting AI…", streaming: "Writing…", done: "Regenerate", error: "Retry" }[status] ?? "Generate Quote";

  return (
    <div style={{ background: C.navyMid, border: `1px solid ${C.borderAccent}`, borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ✦ AI Quote Generator
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {lead ? `${lead.name} · ${lead.job}` : "Select a lead to generate"}
          </div>
        </div>
        <button
          onClick={generate}
          disabled={!canGenerate}
          style={{
            background: canGenerate ? C.accent : "rgba(249,115,22,0.1)",
            color:      canGenerate ? C.navy  : C.accent,
            border: `1px solid ${C.accent}`,
            borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700,
            cursor: canGenerate ? "pointer" : "not-allowed",
            transition: "all 0.2s", letterSpacing: "0.04em", whiteSpace: "nowrap",
          }}
        >
          {btnLabel}
        </button>
      </div>

      {/* Contact fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Name *</label>
          <input
            type="text" value={contact.name} onChange={setField("name")}
            placeholder="Contact name" disabled={!lead}
            style={{ ...inputStyle, borderColor: lead && !contact.name.trim() ? "rgba(232,80,80,0.5)" : C.border }}
          />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input type="tel" value={contact.phone} onChange={setField("phone")} placeholder="0412 000 000" disabled={!lead} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={contact.email} onChange={setField("email")} placeholder="name@email.com" disabled={!lead} style={inputStyle} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Suburb</label>
          <input type="text" value={contact.suburb} onChange={setField("suburb")} placeholder="e.g. Bondi" disabled={!lead} style={inputStyle} />
        </div>
      </div>

      {/* Validation hint */}
      {lead && !contact.name.trim() && (
        <p style={{ fontSize: 11, color: C.textDim, marginTop: -6 }}>
          Enter a contact name to enable quote generation
        </p>
      )}

      {/* Output area */}
      <div style={{
        background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "14px 16px",
        minHeight: 240, maxHeight: 320, overflowY: "auto",
        border: `1px solid ${C.border}`, fontFamily: "monospace",
        fontSize: 12, lineHeight: 1.7, color: C.text, whiteSpace: "pre-wrap",
      }}>
        {status === "idle" && !aiText && (
          <div style={{ color: C.textDim, fontFamily: "sans-serif", fontSize: 13, padding: "60px 0", textAlign: "center" }}>
            {lead ? "Fill in the name and click Generate Quote" : "← Select a lead from the table"}
          </div>
        )}

        {status === "sending" && (
          <div style={{ color: C.textDim, fontFamily: "sans-serif", fontSize: 13, padding: "60px 0", textAlign: "center" }}>
            <div style={{ marginBottom: 12, fontSize: 24, animation: "pulse 1s infinite" }}>⚙</div>
            Sending to AI generator…
          </div>
        )}

        {aiText && aiText.split("\n").map((line, i) => {
          const isBold   = line.startsWith("**") && line.endsWith("**");
          const isBullet = line.startsWith("•");
          const content  = line.replace(/\*\*/g, "");
          return (
            <div key={i} style={{
              color:       isBold ? C.accentLight : C.text,
              fontWeight:  isBold ? 700 : 400,
              marginBottom: line === "" ? 8 : 0,
              paddingLeft:  isBullet ? 8 : 0,
            }}>
              {content}
            </div>
          );
        })}

        {status === "streaming" && (
          <span style={{ color: C.accent, animation: "pulse 0.8s infinite" }}>▋</span>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <p style={{ fontSize: 11, color: C.red, marginTop: -6 }}>{errorMsg}</p>
      )}

      {/* Action buttons */}
      {status === "done" && (
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "📋 Copy",       action: handleCopy },
            { label: "📧 Email",      action: () => showToast("Email feature coming soon", "info") },
            { label: "💾 Save as PDF",action: () => showToast("PDF export coming soon", "info") },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                flex: 1, background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "7px 0", fontSize: 11, color: C.textMuted,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── MissedCallPanel ────────────────────────────────────── */
function MissedCallPanel({ calls, setCalls }) {
  const recover = (id, type) => setCalls(prev => prev.map(c => c.id === id ? { ...c, status: type } : c));

  const badge = (status) => ({
    pending:     { label: "Pending",     color: C.red,   bg: "rgba(232,80,80,0.12)" },
    sms_sent:    { label: "SMS Sent",    color: C.accent,bg: "rgba(249,115,22,0.12)" },
    called_back: { label: "Called Back", color: C.green, bg: "rgba(45,191,138,0.12)" },
  }[status]);

  const pendingCount = calls.filter(c => c.status === "pending").length;

  return (
    <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Missed Call Recovery</span>
            {pendingCount > 0 && (
              <span style={{ background: C.red, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "2px 7px" }}>
                {pendingCount}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            Estimated pipeline at risk: <span style={{ color: C.accent, fontWeight: 600 }}>~$20K</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {calls.map(call => {
          const b = badge(call.status);
          return (
            <div key={call.id} style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${call.status === "pending" ? "rgba(232,80,80,0.25)" : C.border}`,
              borderRadius: 10, padding: "12px 14px", transition: "border-color 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{call.name}</span>
                    <span style={{ background: b.bg, color: b.color, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>
                      {b.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{call.number} · {call.ago} · Est. {call.value}</div>
                </div>

                <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                  {call.status === "pending" && (
                    <>
                      <ActionBtn onClick={() => recover(call.id, "sms_sent")}  color={C.accent} bg="rgba(249,115,22,0.12)" border={C.borderAccent}>SMS</ActionBtn>
                      <ActionBtn onClick={() => recover(call.id, "called_back")} color={C.green}  bg="rgba(45,191,138,0.12)" border="rgba(45,191,138,0.3)">Call</ActionBtn>
                    </>
                  )}
                  {call.status === "sms_sent" && (
                    <ActionBtn onClick={() => recover(call.id, "called_back")} color={C.green} bg="rgba(45,191,138,0.12)" border="rgba(45,191,138,0.3)">Follow Up</ActionBtn>
                  )}
                  {call.status === "called_back" && (
                    <span style={{ fontSize: 11, color: C.green }}>✓ Done</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, color, bg, border, children }) {
  return (
    <button
      onClick={onClick}
      style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

/* ─── PipelineBar ────────────────────────────────────────── */
function PipelineBar() {
  const total = PIPELINE_STAGES.reduce((s, st) => s + st.count, 0);
  return (
    <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>
        Pipeline Overview · {total} leads
      </div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 10, gap: 2, marginBottom: 14 }}>
        {PIPELINE_STAGES.map(st => (
          <div key={st.label} style={{ flex: st.count, background: st.color, transition: "flex 0.4s ease" }} title={`${st.label}: ${st.count}`} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
        {PIPELINE_STAGES.map(st => (
          <div key={st.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: st.color }} />
            <span style={{ fontSize: 11, color: C.textMuted }}>{st.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{st.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── RevenueSparkline ───────────────────────────────────── */
function RevenueSparkline() {
  const data = [38, 52, 47, 61, 55, 70, 63, 79, 84];
  const max = Math.max(...data), min = Math.min(...data);
  const norm = v => 100 - ((v - min) / (max - min)) * 80;
  const w = 100 / (data.length - 1);
  const points = data.map((v, i) => `${i * w},${norm(v)}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 48 }}>
      <defs>
        <linearGradient id="rsg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${norm(data[0])} ${points} 100,100 0,100`} fill="url(#rsg)" />
      <polyline points={points} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={100} cy={norm(data[data.length - 1])} r="3" fill={C.accent} />
    </svg>
  );
}

/* ─── CrmDashboard (main export) ─────────────────────────── */
export default function CrmDashboard() {
  const [selectedLead, setSelectedLead]   = useState(null);
  const [missedCalls,  setMissedCalls]    = useState(DASHBOARD_MISSED_CALLS);
  const [searchQuery,  setSearchQuery]    = useState("");
  const [filterStage,  setFilterStage]    = useState("All");
  const [rowLoading,   setRowLoading]     = useState(null); // lead.id | null
  const { toast, show: showToast, dismiss } = useToast();

  const handleRowQuote = async (e, lead) => {
    e.stopPropagation();
    setSelectedLead(lead);
    setRowLoading(lead.id);
    try {
      await postQuoteWebhook(
        buildDashboardQuotePayload(lead, { name: lead.name, phone: lead.phone, email: "", suburb: lead.suburb }, "generate")
      );
      showToast(`Quote request sent for ${lead.name}`, "success");
    } catch {
      showToast(`Webhook unavailable for ${lead.name} — check n8n`, "error");
    } finally {
      setRowLoading(null);
    }
  };

  const filteredLeads = DASHBOARD_LEADS.filter(l =>
    (filterStage === "All" || l.stage === filterStage) &&
    [l.name, l.job, l.suburb].some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      className="crm-page"
      style={{ minHeight: "100%", width: "100%", background: C.navy, color: C.text, fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: "28px 28px 48px" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .crm-page, .crm-page * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .kpi-card:hover  { border-color: rgba(249,115,22,0.25) !important; background: rgba(255,255,255,0.06) !important; }
        .lead-row:hover  { background: rgba(255,255,255,0.05) !important; cursor: pointer; }
        .lead-row.active { background: rgba(249,115,22,0.07) !important; border-left: 2px solid ${C.accent} !important; }
        .crm-page input:focus, .crm-page select:focus { border-color: rgba(249,115,22,0.5) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
            Good morning, {LOGGED_IN_USER.name.split(" ")[0]} 👋
          </h1>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
            {formatDisplayHeaderDate()} · Sydney, NSW ·{" "}
            <span style={{ color: C.green, fontWeight: 600 }}>3 jobs on-site today</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 16px", fontSize: 13, color: C.textMuted, cursor: "pointer" }}>
            📊 Reports
          </button>
          <button style={{ background: C.accent, border: "none", borderRadius: 9, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: C.navy, cursor: "pointer" }}>
            + New Lead
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
        {KPI_DATA.map((kpi, i) => (
          <div
            key={kpi.label}
            className="kpi-card"
            style={{
              background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "16px 14px", transition: "all 0.2s",
              animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
              position: "relative", overflow: "hidden",
            }}
          >
            {i === 0 && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, opacity: 0.6 }}>
                <RevenueSparkline />
              </div>
            )}
            <div style={{ fontSize: 20, marginBottom: 6 }}>{kpi.icon}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, marginTop: 5, color: kpi.up ? C.green : C.red, fontWeight: 600 }}>
              {kpi.delta}{" "}
              <span style={{ color: C.textDim, fontWeight: 400 }}>{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pipeline ── */}
      <div style={{ marginBottom: 20 }}>
        <PipelineBar />
      </div>

      {/* ── Leads + Quote ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, marginBottom: 20 }}>

        {/* Leads table */}
        <div style={{ background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1 }}>Lead Tracker</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search leads…"
              style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 12, color: C.text, width: 160, outline: "none" }}
            />
            <select
              value={filterStage}
              onChange={e => setFilterStage(e.target.value)}
              style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 10px", fontSize: 12, color: C.textMuted, outline: "none", cursor: "pointer" }}
            >
              <option>All</option>
              {PIPELINE_STAGES.map(s => <option key={s.label}>{s.label}</option>)}
            </select>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["", "Client", "Job Type", "Suburb", "Value", "Stage", "Days", ""].map((h, i) => (
                    <th key={i} style={{ padding: "9px 14px", textAlign: "left", color: C.textDim, fontWeight: 600, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => {
                  const s = STAGE_COLORS[lead.stage] || {};
                  const isActive = selectedLead?.id === lead.id;
                  return (
                    <tr
                      key={lead.id}
                      className={`lead-row${isActive ? " active" : ""}`}
                      onClick={() => setSelectedLead(isActive ? null : lead)}
                      style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
                    >
                      <td style={{ padding: "10px 14px", width: 28 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_DOT[lead.priority] }} />
                      </td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, color: C.text }}>{lead.name}</div>
                        <div style={{ fontSize: 10, color: C.textDim }}>{lead.phone}</div>
                      </td>
                      <td style={{ padding: "10px 14px", color: C.textMuted, maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.job}</td>
                      <td style={{ padding: "10px 14px", color: C.textMuted }}>{lead.suburb}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: C.accentLight, fontFamily: "DM Mono, monospace" }}>{lead.value}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: s.bg, color: s.text, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "3px 9px", whiteSpace: "nowrap" }}>{lead.stage}</span>
                      </td>
                      <td style={{ padding: "10px 14px", color: C.textMuted }}>{lead.days === 0 ? "Today" : `${lead.days}d`}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <button
                          onClick={e => handleRowQuote(e, lead)}
                          disabled={rowLoading === lead.id}
                          style={{
                            background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6,
                            padding: "4px 10px", fontSize: 10, color: C.accent,
                            cursor: rowLoading === lead.id ? "wait" : "pointer",
                            fontWeight: 600, whiteSpace: "nowrap",
                            opacity: rowLoading === lead.id ? 0.6 : 1,
                            transition: "opacity 0.2s",
                          }}
                        >
                          {rowLoading === lead.id ? "Sending…" : "✦ Quote"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Quote Panel */}
        <AIQuotePanel lead={selectedLead} showToast={showToast} />
      </div>

      {/* ── Missed calls ── */}
      <MissedCallPanel calls={missedCalls} setCalls={setMissedCalls} />

      {/* ── Footer ── */}
      <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: C.textDim }}>
        StructureSeal CRM · Sydney, NSW · Data refreshed 2 min ago ·{" "}
        <span style={{ color: C.accent }}>✦ AI-powered</span>
      </div>

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
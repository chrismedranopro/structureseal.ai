import { useState, useRef, useCallback, useEffect } from "react";
import { BRAND } from "../theme/brand";
import { getDisplayToday } from "../utils/displayDate";
import { MOCK_LEADS } from "../data/mockLeads";

/* ─── Fonts ─── */
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`;

/* ─── Brand tokens ─── */
const T = {
  navy: BRAND.blue,
  navyMid: "#1A3550",
  accent: BRAND.orange,
  accentLight: BRAND.orangeLight,
  accentPale: "#FFF7ED",
  accentBorder: BRAND.orangeBorder,
  bg:         "#F0F3F7",
  surface:    "#FFFFFF",
  border:     "#E2E8F0",
  borderDark: "#CBD5E1",
  text:       "#0F2336",
  textMid:    "#4A6580",
  textMuted:  "#8BA0B5",
  green:      "#16A34A",
  greenBg:    "#F0FDF4",
  greenBorder:"#BBF7D0",
  red:        "#DC2626",
  redBg:      "#FEF2F2",
  redBorder:  "#FECACA",
  orange: BRAND.orange,
  orangeBg: "#FFF7ED",
  orangeBorder: "#FED7AA",
  blue:       "#2563EB",
  blueBg:     "#EFF6FF",
  blueBorder: "#BFDBFE",
  slate:      "#64748B",
  slateBg:    "#F8FAFC",
  slateBorder:"#E2E8F0",
  purpleBg:   "#FAF5FF",
  purpleBorder:"#E9D5FF",
  purple:     "#7C3AED",
};

/* ─── Stage config ─── */
const STAGES = [
  {
    id: "new_lead",
    label: "New Lead",
    color: T.blue,
    bg: T.blueBg,
    border: T.blueBorder,
    dot: "#3B82F6",
    icon: "★",
  },
  {
    id: "site_inspection",
    label: "Site Inspection",
    color: T.purple,
    bg: T.purpleBg,
    border: T.purpleBorder,
    dot: "#8B5CF6",
    icon: "◎",
  },
  {
    id: "quote_drafted",
    label: "Quote Drafted",
    color: T.orange,
    bg: T.orangeBg,
    border: T.orangeBorder,
    dot: "#F97316",
    icon: "✎",
  },
  {
    id: "quote_sent",
    label: "Quote Sent",
    color: T.accent,
    bg: T.accentPale,
    border: T.accentBorder,
    dot: T.accentLight,
    icon: "◈",
  },
  {
    id: "won",
    label: "Won",
    color: T.green,
    bg: T.greenBg,
    border: T.greenBorder,
    dot: "#22C55E",
    icon: "✓",
  },
  {
    id: "lost",
    label: "Lost",
    color: T.red,
    bg: T.redBg,
    border: T.redBorder,
    dot: "#EF4444",
    icon: "✕",
  },
];

const URGENCY = {
  critical: { label: "Critical",  color: T.red,    bg: T.redBg,    border: T.redBorder },
  urgent:   { label: "Urgent",    color: T.orange,  bg: T.orangeBg,  border: T.orangeBorder },
  moderate: { label: "Moderate", color: T.accent, bg: T.accentPale, border: T.accentBorder },
  routine:  { label: "Routine",   color: T.slate,   bg: T.slateBg,   border: T.slateBorder },
};

/* ─── Seed data (canonical — see src/data/mockLeads.js) ─── */
const SEED_LEADS = MOCK_LEADS;

/* ─── Helpers ─── */
const fmt$ = (n) => "$" + n.toLocaleString("en-AU");
const fmtDate = (d) => {
  const dt = new Date(d + "T00:00:00");
  const today = getDisplayToday();
  const diff = Math.round((dt - today) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Today", today: true };
  if (diff === 1) return { label: "Tomorrow", soon: true };
  return { label: dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }), ok: true };
};

const initials = (name) => name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
const avatarColor = (name) => {
  const palette = ["#3B82F6","#8B5CF6","#F97316","#16A34A","#DC2626","#0891B2",BRAND.orange,"#DB2777"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % palette.length;
  return palette[Math.abs(h)];
};

/* ─── Avatar ─── */
const Avatar = ({ name, size = 32 }) => {
  const bg = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, flexShrink: 0,
      letterSpacing: "-0.02em",
    }}>{initials(name)}</div>
  );
};

/* ─── Lead Card ─── */
const LeadCard = ({ lead, stage, onDragStart, onClick, dragging }) => {
  const urg = URGENCY[lead.urgency];
  const due = fmtDate(lead.followUp);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={() => onClick(lead)}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "14px 15px",
        cursor: "grab",
        opacity: dragging ? 0.35 : 1,
        transition: "box-shadow 0.18s, transform 0.18s, opacity 0.15s",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(11,30,51,0.12)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Stage accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: stage.dot, borderRadius: "12px 12px 0 0",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 4, marginBottom: 11 }}>
        <Avatar name={lead.name} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {lead.name}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{lead.suburb} · {lead.phone}</div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.navy, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
          {fmt$(lead.value)}
        </div>
      </div>

      {/* Issue chip */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: T.bg, border: `1px solid ${T.border}`,
        borderRadius: 6, padding: "4px 9px", marginBottom: 10,
      }}>
        <span style={{ fontSize: 11, color: T.textMid, fontWeight: 500 }}>{lead.issue}</span>
      </div>

      {/* Footer row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        {/* Urgency */}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
          color: urg.color, background: urg.bg,
          border: `1px solid ${urg.border}`,
          borderRadius: 20, padding: "3px 8px",
        }}>{urg.label.toUpperCase()}</span>

        {/* Follow-up date */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={due.overdue ? T.red : due.today || due.soon ? T.orange : T.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: due.overdue ? T.red : due.today ? T.orange : due.soon ? T.accent : T.textMuted,
          }}>{due.label}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Column ─── */
const Column = ({ stage, leads, onDragStart, onDrop, onDragOver, onDragLeave, dragOver, draggingId, onCardClick }) => {
  const total = leads.reduce((s, l) => s + l.value, 0);

  return (
    <div
      style={{
        width: 260, flexShrink: 0,
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Column header */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "12px 12px 0 0",
        borderBottom: `3px solid ${stage.dot}`,
        padding: "12px 14px",
        marginBottom: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 26, height: 26, borderRadius: 7,
              background: stage.bg, border: `1px solid ${stage.border}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: stage.color, fontWeight: 700,
            }}>{stage.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{stage.label}</span>
          </div>
          <span style={{
            background: stage.bg, color: stage.color,
            border: `1px solid ${stage.border}`,
            borderRadius: 20, fontSize: 11, fontWeight: 700,
            padding: "2px 9px",
          }}>{leads.length}</span>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
          {fmt$(total)}
          <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "Sora", marginLeft: 4 }}>pipeline</span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragLeave={onDragLeave}
        style={{
          flex: 1,
          minHeight: 120,
          padding: "8px 0",
          display: "flex", flexDirection: "column", gap: 8,
          background: dragOver ? `${stage.bg}CC` : "transparent",
          border: dragOver ? `2px dashed ${stage.dot}` : "2px dashed transparent",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          transition: "background 0.15s, border-color 0.15s",
          paddingLeft: dragOver ? 6 : 0,
          paddingRight: dragOver ? 6 : 0,
        }}
      >
        {leads.length === 0 && !dragOver && (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "32px 0",
          }}>
            <span style={{ fontSize: 12, color: T.textMuted, fontStyle: "italic" }}>No leads</span>
          </div>
        )}
        {leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            stage={stage}
            onDragStart={onDragStart}
            onClick={onCardClick}
            dragging={draggingId === lead.id}
          />
        ))}
        {dragOver && (
          <div style={{
            border: `2px dashed ${stage.dot}`,
            borderRadius: 10, height: 80,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 12, color: stage.color, fontWeight: 600 }}>Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Detail Drawer ─── */
const Drawer = ({ lead, stages, onClose, onMove, onUpdate }) => {
  const stage = stages.find(s => s.id === lead.stage);
  const urg = URGENCY[lead.urgency];
  const due = fmtDate(lead.followUp);
  const [notes, setNotes] = useState(lead.notes);
  const [editNotes, setEditNotes] = useState(false);

  useEffect(() => { setNotes(lead.notes); setEditNotes(false); }, [lead.id]);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(11,30,51,0.35)",
        zIndex: 100, backdropFilter: "blur(2px)",
        animation: "fadeIn 0.2s ease",
      }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
        background: T.surface, borderLeft: `1px solid ${T.border}`,
        zIndex: 101, overflowY: "auto",
        animation: "slideInRight 0.25s ease",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 22px 16px",
          borderBottom: `1px solid ${T.border}`,
          background: stage.bg,
          position: "sticky", top: 0, zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={lead.name} size={44} />
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0 }}>{lead.name}</h2>
                <p style={{ fontSize: 12, color: T.textMuted, margin: "3px 0 0" }}>{lead.suburb} · {lead.phone}</p>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 20, color: T.textMuted, lineHeight: 1, padding: "2px 6px",
              borderRadius: 6,
            }}>×</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <span style={{
              background: stage.bg, color: stage.color,
              border: `1px solid ${stage.border}`,
              borderRadius: 20, fontSize: 11, fontWeight: 700,
              padding: "4px 12px",
            }}>{stage.icon} {stage.label}</span>
            <span style={{
              background: urg.bg, color: urg.color,
              border: `1px solid ${urg.border}`,
              borderRadius: 20, fontSize: 11, fontWeight: 700,
              padding: "4px 12px",
            }}>{urg.label}</span>
            <span style={{
              background: T.accentPale, color: T.accent,
              border: `1px solid ${T.accentBorder}`,
              borderRadius: 20, fontSize: 11, fontWeight: 700,
              padding: "4px 12px", fontFamily: "'JetBrains Mono', monospace",
            }}>{fmt$(lead.value)}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px", flex: 1 }}>
          {/* Info grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20,
          }}>
            {[
              { label: "Issue Type", value: lead.issue },
              { label: "Follow-up", value: due.label, warn: due.overdue || due.today },
              { label: "Suburb", value: lead.suburb },
              { label: "Contact", value: lead.phone },
            ].map(({ label, value, warn }) => (
              <div key={label} style={{
                background: T.bg, borderRadius: 9, padding: "11px 13px",
                border: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: warn ? T.red : T.text }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" }}>Notes</span>
              <button onClick={() => { if (editNotes) { onUpdate(lead.id, { notes }); } setEditNotes(!editNotes); }} style={{
                fontSize: 11, fontWeight: 600, color: T.accent, background: "none",
                border: "none", cursor: "pointer", padding: "2px 0",
              }}>{editNotes ? "Save" : "Edit"}</button>
            </div>
            {editNotes ? (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{
                  width: "100%", borderRadius: 9, border: `1px solid ${T.accentBorder}`,
                  padding: "11px 13px", fontSize: 13, color: T.text, lineHeight: 1.65,
                  fontFamily: "Sora, sans-serif", resize: "vertical", minHeight: 100,
                  outline: "none", background: T.accentPale,
                }}
              />
            ) : (
              <div style={{
                background: T.bg, borderRadius: 9, padding: "11px 13px",
                border: `1px solid ${T.border}`,
                fontSize: 13, color: T.textMid, lineHeight: 1.65,
              }}>{notes || <em style={{ color: T.textMuted }}>No notes</em>}</div>
            )}
          </div>

          {/* Move stage */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Move to Stage</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stages.filter(s => s.id !== lead.stage).map(s => (
                <button key={s.id} onClick={() => onMove(lead.id, s.id)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 9, padding: "10px 14px", cursor: "pointer",
                  transition: "filter 0.15s",
                  width: "100%", textAlign: "left",
                }}
                  onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.96)"}
                  onMouseLeave={e => e.currentTarget.style.filter = "none"}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: T.surface, border: `1px solid ${s.border}`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: s.color,
                  }}>{s.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</span>
                  <svg style={{ marginLeft: "auto" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Main App ─── */
export default function App() {
  const [leads, setLeads] = useState(SEED_LEADS);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [search, setSearch] = useState("");

  const handleDragStart = useCallback((e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  }, []);

  const handleDrop = useCallback((e, stageId) => {
    e.preventDefault();
    setLeads(prev => prev.map(l => l.id === draggingId ? { ...l, stage: stageId } : l));
    setDraggingId(null);
    setDragOverStage(null);
  }, [draggingId]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverStage(null);
  }, []);

  const handleMove = (id, stageId) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: stageId } : l));
    setSelectedLead(prev => prev ? { ...prev, stage: stageId } : null);
  };

  const handleUpdate = (id, updates) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
  };

  const filteredLeads = leads.filter(l => {
    const matchU = filterUrgency === "all" || l.urgency === filterUrgency;
    const matchS = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.issue.toLowerCase().includes(search.toLowerCase()) || l.suburb.toLowerCase().includes(search.toLowerCase());
    return matchU && matchS;
  });

  const totalPipeline = leads.filter(l => l.stage !== "lost").reduce((s, l) => s + l.value, 0);
  const wonValue = leads.filter(l => l.stage === "won").reduce((s, l) => s + l.value, 0);
  const overdueCount = leads.filter(l => { const d = new Date(l.followUp + "T00:00:00"); const t = getDisplayToday(); return d < t; }).length;

  return (
    <div className="leads-page" style={{ minHeight: "100%", width: "100%", background: T.bg, fontFamily: "Sora, sans-serif", color: T.text }}>
      <style>{`
        ${FONT_IMPORT}
        .leads-page,.leads-page *{box-sizing:border-box}
        .leads-page *{margin:0;padding:0}
        ::selection{background:rgba(208,138,0,0.2)}
        ::-webkit-scrollbar{width:5px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#94A3B8}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideInRight{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Page header ── */}
      <div style={{
        background: T.navy,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 24px",
        borderBottom: `1px solid ${T.border}`,
        position: "sticky", top: 0, zIndex: 50,
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>Leads Pipeline</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>Drag cards between stages to update lead status</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {[
            { label: "Pipeline", value: fmt$(totalPipeline), color: T.accentLight },
            { label: "Won", value: fmt$(wonValue), color: "#4ADE80" },
            { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "#FCA5A5" : "rgba(255,255,255,0.45)" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sub-header / Toolbar ── */}
      <div style={{
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: "12px 24px",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
          <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads, issues, suburbs…"
            style={{
              width: "100%", height: 36, borderRadius: 9,
              border: `1px solid ${T.border}`, background: T.bg,
              padding: "0 14px 0 34px", fontSize: 13, color: T.text,
              fontFamily: "Sora, sans-serif", outline: "none",
            }}
          />
        </div>

        {/* Urgency filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {[{ value: "all", label: "All" }, ...Object.entries(URGENCY).map(([k, v]) => ({ value: k, label: v.label }))].map(opt => (
            <button key={opt.value} onClick={() => setFilterUrgency(opt.value)} style={{
              padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${filterUrgency === opt.value ? T.accent : T.border}`,
              background: filterUrgency === opt.value ? T.accentPale : T.surface,
              color: filterUrgency === opt.value ? T.accent : T.textMuted,
              cursor: "pointer", transition: "all 0.15s",
            }}>{opt.label}</button>
          ))}
        </div>

        <button style={{
          height: 36, padding: "0 16px", borderRadius: 9,
          background: T.navy, border: "none",
          color: "#fff", fontSize: 12, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
          fontFamily: "Sora, sans-serif",
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Lead
        </button>
      </div>

      {/* ── Board ── */}
      <div
        style={{
          display: "flex", gap: 14,
          padding: "20px 24px 40px",
          overflowX: "auto", overflowY: "visible",
          minHeight: "calc(100% - 120px)",
          alignItems: "flex-start",
        }}
        onDragEnd={handleDragEnd}
      >
        {STAGES.map((stage, si) => {
          const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
          return (
            <div key={stage.id} style={{ animation: `fadeUp 0.35s ease ${si * 0.06}s both` }}>
              <Column
                stage={stage}
                leads={stageLeads}
                draggingId={draggingId}
                dragOver={dragOverStage === stage.id}
                onDragStart={handleDragStart}
                onDragOver={e => handleDragOver(e, stage.id)}
                onDrop={e => handleDrop(e, stage.id)}
                onDragLeave={() => setDragOverStage(null)}
                onCardClick={setSelectedLead}
              />
            </div>
          );
        })}
      </div>

      {/* ── Detail Drawer ── */}
      {selectedLead && (
        <Drawer
          lead={selectedLead}
          stages={STAGES}
          onClose={() => setSelectedLead(null)}
          onMove={(id, stageId) => handleMove(id, stageId)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

import { useState, useRef } from "react";
import {
  postQuoteWebhook,
  buildQuoteAssistantPayload,
  extractProposalFromResponse,
} from "../utils/quoteWebhook";

// ─── Real helpers from your project ──────────────────────────────────────────
// Inline these since we don't know your exact paths — swap if you have them:
const BRAND = {
  navy: "#091420", navyMid: "#0D1B2A", navyLight: "#132234",
  border: "rgba(255,255,255,0.07)", orangeBorder: "rgba(249,115,22,0.3)",
  orange: "#F97316", orangeLight: "#FB923C", orangePale: "rgba(249,115,22,0.08)",
  blue: "#3B82C4", bluePale: "rgba(59,130,196,0.08)",
};
const formatDisplayDateLong  = () => new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long",  year: "numeric" });
const formatDisplayDateShort = () => new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
const RECENT_QUOTE_CLIENTS = [
  { name: "Derek Hartmann", phone: "+61 412 883 221", email: "d.hartmann@email.com", suburb: "Parramatta", issue: "Basement Waterproofing" },
  { name: "Sunita Patel",   phone: "+61 438 774 109", email: "s.patel@email.com",    suburb: "Chatswood",  issue: "Roof Membrane" },
  { name: "Marcus Obi",     phone: "+61 407 552 388", email: "m.obi@email.com",      suburb: "Homebush",   issue: "Bathroom Waterproofing" },
];

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: BRAND.navy, bgPanel: BRAND.navyMid, bgCard: BRAND.navyLight, bgInput: "#0A1624",
  border: BRAND.border, borderFocus: "rgba(249,115,22,0.55)", borderAccent: BRAND.orangeBorder,
  accent: BRAND.orange, accentLight: BRAND.orangeLight, accentPale: BRAND.orangePale,
  text: "#E2EAF0", textMuted: "#7A97AE", textDim: "#3E5A72",
  green: "#38A169", greenBg: "rgba(56,161,105,0.1)", red: "#E05252",
  blue: BRAND.blue, blueBg: BRAND.bluePale,
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = C.accent }) => {
  const icons = {
    scope:    <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></>,
    material: <><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></>,
    warranty: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    exclude:  <><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></>,
    summary:  <><path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18"/></>,
    reco:     <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    spark:    <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>,
    copy:     <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    check:    <><polyline points="20 6 9 17 4 12"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────
const URGENCY_OPTIONS = [
  { value: "routine",  label: "Routine",   desc: "2–4 weeks",     color: C.green },
  { value: "moderate", label: "Moderate",  desc: "Within 1 week", color: C.accent },
  { value: "urgent",   label: "Urgent",    desc: "1–3 days",      color: "#E07A30" },
  { value: "critical", label: "Emergency", desc: "Same day",       color: C.red },
];
const PROPERTY_TYPES = [
  "Residential – House","Residential – Apartment","Residential – Townhouse",
  "Commercial – Office","Commercial – Warehouse","Commercial – Retail",
  "Industrial","Strata Complex","Government / Public","Other",
];
const ISSUE_TYPES = [
  "Balcony / Deck Waterproofing","Bathroom / Wet Area","Basement / Below Ground",
  "Roof Membrane","Retaining Wall","Planter Box","Carpark Deck",
  "Swimming Pool / Surrounds","Epoxy Flooring","Concrete Crack Repair","Other / Custom",
];
const ISSUE_LABEL_MAP = {
  "Bathroom Waterproofing": "Bathroom / Wet Area",
  "Basement Waterproofing": "Basement / Below Ground",
  "Roof Membrane Seal":     "Roof Membrane",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const ProposalSection = ({ icon, title, delay = 0, children }) => (
  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", animation: `slideUp 0.5s ease ${delay}s both` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: "linear-gradient(90deg, rgba(249,115,22,0.06) 0%, transparent 60%)" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentPale, border: `1px solid ${C.borderAccent}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={14} color={C.accent} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{title}</span>
    </div>
    <div style={{ padding: "18px 20px" }}>{children}</div>
  </div>
);

const Pill = ({ children, color = C.accent }) => (
  <span style={{ display: "inline-flex", alignItems: "center", background: `${color}18`, color, border: `1px solid ${color}33`, borderRadius: 20, fontSize: 11, fontWeight: 600, padding: "3px 10px", letterSpacing: "0.03em" }}>{children}</span>
);

const ListItem = ({ children, bullet = "◆" }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 9 }}>
    <span style={{ color: C.accent, fontSize: 8, marginTop: 5, flexShrink: 0 }}>{bullet}</span>
    <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}>{children}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuoteAssistant() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", suburb: "",
    issue: "", propertyType: "", areaSize: "", urgency: "", notes: "",
  });
  const [state, setState]       = useState("idle");
  const [proposal, setProposal] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied]     = useState(false);
  const resultsRef = useRef(null);
  const refNum     = useRef(Math.floor(Math.random() * 90000) + 10000);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const loadRecentClient = (client) =>
    setForm((f) => ({
      ...f,
      name:   client.name,
      phone:  client.phone,
      email:  client.email,
      suburb: client.suburb,
      issue:  ISSUE_LABEL_MAP[client.issue] ?? client.issue,
    }));

  const isValid = form.name.trim() && form.issue && form.propertyType && form.areaSize && form.urgency;

  const generate = async (action = "generate") => {
    if (!isValid || state === "loading") return;
    setState("loading");
    setProposal(null);
    setErrorMsg("");
    try {
      const payload = buildQuoteAssistantPayload(form, action);
      const data    = await postQuoteWebhook(payload);
      const parsed  = extractProposalFromResponse(data);
      if (!parsed) throw new Error("Unexpected response from server. Please try again.");
      setProposal(parsed);
      setState("done");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (e) {
      setErrorMsg(e.message || "Failed to generate proposal. Please check your inputs.");
      setState("error");
    }
  };

  const handleCopy = () => {
    if (!proposal) return;
    const text = [
      "STRUCTURESEAL — AI QUOTE PROPOSAL",
      `Generated: ${formatDisplayDateLong()}`,
      `Project: ${form.issue} | ${form.propertyType} | ${form.areaSize}m²`,
      "", "SCOPE OF WORKS",
      proposal.scopeOfWork?.overview ?? "",
      ...(proposal.scopeOfWork?.steps ?? []).map((s, i) => `${i + 1}. ${s}`),
      "", "RECOMMENDATIONS",
      `System: ${proposal.recommendations?.system ?? ""}`,
      proposal.recommendations?.rationale ?? "",
      ...(proposal.recommendations?.items ?? []).map((r) => `• ${r}`),
      "", "WARRANTY",
      `Duration: ${proposal.warranty?.duration ?? ""}`,
      proposal.warranty?.statement ?? "",
      "", "COST ESTIMATE",
      `$${(proposal.summary?.lowEstimate ?? 0).toLocaleString()} – $${(proposal.summary?.highEstimate ?? 0).toLocaleString()} AUD (ex GST)`,
      `Duration: ${proposal.summary?.duration ?? ""}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const urgency = URGENCY_OPTIONS.find((u) => u.value === form.urgency);

  return (
    <div className="quotes-page" style={{ minHeight: "100%", width: "100%", background: C.bg, color: C.text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        .quotes-page,.quotes-page *{box-sizing:border-box}
        .quotes-page *{margin:0;padding:0}
        ::selection{background:rgba(249,115,22,0.25);color:#F6C94E}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:6px}
        input,select,textarea{color-scheme:dark}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .form-input{width:100%;background:${C.bgInput};border:1px solid ${C.border};border-radius:9px;padding:11px 14px;font-size:13px;color:${C.text};font-family:'DM Sans',sans-serif;outline:none;transition:border 0.2s,box-shadow 0.2s;appearance:none}
        .form-input:focus{border-color:${C.borderFocus};box-shadow:0 0 0 3px rgba(249,115,22,0.1)}
        .form-input::placeholder{color:${C.textDim}}
        .form-input option{background:#132234;color:${C.text}}
        .urgency-btn{flex:1;padding:10px 8px;border-radius:9px;border:1px solid ${C.border};background:${C.bgInput};cursor:pointer;text-align:center;transition:all 0.18s}
        .urgency-btn:hover{border-color:rgba(255,255,255,0.15);background:rgba(255,255,255,0.04)}
        .urgency-btn.active{background:rgba(249,115,22,0.08);border-color:${C.borderFocus}}
        .generate-btn{width:100%;padding:15px;border-radius:11px;border:none;background:linear-gradient(135deg,#C8911A 0%,#E8A820 50%,#D4961E 100%);color:#0C1B2A;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:0.04em;transition:all 0.2s;position:relative;overflow:hidden}
        .generate-btn:disabled{opacity:0.45;cursor:not-allowed}
        .generate-btn:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(249,115,22,0.35)}
        .generate-btn:not(:disabled):active{transform:translateY(0)}
        .mat-row:nth-child(even){background:rgba(255,255,255,0.025)}
        .action-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:9px;border:1px solid ${C.border};background:${C.bgCard};color:${C.textMuted};font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.18s}
        .action-btn:hover{border-color:rgba(249,115,22,0.4);color:${C.accent};background:${C.accentPale}}
        .skeleton{background:linear-gradient(90deg,${C.bgCard} 25%,rgba(255,255,255,0.04) 50%,${C.bgCard} 75%);background-size:600px 100%;animation:shimmer 1.5s infinite;border-radius:6px}
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", minHeight: "100%", width: "100%", maxWidth: 1440, margin: "0 auto" }}>

        {/* ── Left: Form Panel ── */}
        <div style={{ background: C.bgPanel, borderRight: `1px solid ${C.border}`, padding: "32px 28px", display: "flex", flexDirection: "column", overflowY: "auto", position: "sticky", top: 0, height: "100%", maxHeight: "100vh" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: C.accent }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Project Brief</span>
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", lineHeight: 1.25 }}>Generate AI Quote</h1>
            <p style={{ fontSize: 13, color: C.textMuted, marginTop: 6, lineHeight: 1.6 }}>
              Fill in the project details to generate a fully scoped proposal with materials, warranty and cost estimate.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>Recent clients</span>
              {RECENT_QUOTE_CLIENTS.map((client) => (
                <button key={client.name} type="button" onClick={() => loadRecentClient(client)}
                  style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, border: `1px solid ${C.border}`, background: C.bgCard, color: C.textMuted, cursor: "pointer" }}>
                  {client.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Contact Name *</label>
              <input type="text" className="form-input" placeholder="Full name" value={form.name} onChange={(e) => set("name")(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Phone</label>
                <input type="tel" className="form-input" placeholder="0412 000 000" value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Email</label>
                <input type="email" className="form-input" placeholder="name@email.com" value={form.email} onChange={(e) => set("email")(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Suburb</label>
              <input type="text" className="form-input" placeholder="e.g. Bondi" value={form.suburb} onChange={(e) => set("suburb")(e.target.value)} />
            </div>
            <div style={{ height: 1, background: C.border }} />
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Waterproofing Issue *</label>
              <select className="form-input" value={form.issue} onChange={(e) => set("issue")(e.target.value)}>
                <option value="">Select issue type…</option>
                {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Property Type *</label>
              <select className="form-input" value={form.propertyType} onChange={(e) => set("propertyType")(e.target.value)}>
                <option value="">Select property type…</option>
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Approximate Area (m²) *</label>
              <div style={{ position: "relative" }}>
                <input type="number" min="1" max="10000" className="form-input" placeholder="e.g. 45" value={form.areaSize} onChange={(e) => set("areaSize")(e.target.value)} style={{ paddingRight: 44 }} />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.textDim, fontFamily: "'DM Mono', monospace" }}>m²</span>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 9 }}>Urgency Level *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {URGENCY_OPTIONS.map((opt) => (
                  <button key={opt.value} className={`urgency-btn${form.urgency === opt.value ? " active" : ""}`} onClick={() => set("urgency")(opt.value)}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: opt.color, margin: "0 auto 5px", boxShadow: form.urgency === opt.value ? `0 0 8px ${opt.color}` : "none" }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: form.urgency === opt.value ? opt.color : C.textMuted }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Additional Notes</label>
              <textarea className="form-input" rows={4} placeholder="Access issues, existing failures, special requirements…" value={form.notes} onChange={(e) => set("notes")(e.target.value)} style={{ resize: "vertical", minHeight: 90, lineHeight: 1.6 }} />
            </div>
            <div style={{ height: 1, background: C.border }} />
            {isValid && (
              <div style={{ background: C.accentPale, border: `1px solid ${C.borderAccent}`, borderRadius: 9, padding: "11px 14px", display: "flex", flexWrap: "wrap", gap: 6, animation: "slideUp 0.3s ease" }}>
                <Pill>{form.name}</Pill>
                {form.suburb && <Pill>{form.suburb}</Pill>}
                <Pill>{form.issue}</Pill>
                <Pill>{form.propertyType}</Pill>
                <Pill>{form.areaSize} m²</Pill>
                {urgency && <Pill color={urgency.color}>{urgency.label}</Pill>}
              </div>
            )}
            <button className="generate-btn" onClick={() => generate("generate")} disabled={!isValid || state === "loading"}>
              {state === "loading" ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#0C1B2A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Generating Proposal…
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon name="spark" size={15} color="#0C1B2A" />
                  Generate Proposal
                </span>
              )}
            </button>
            {!isValid && state === "idle" && (
              <p style={{ fontSize: 11, color: C.textDim, textAlign: "center" }}>Complete all required fields (*) to continue</p>
            )}
          </div>
        </div>

        {/* ── Right: Output Panel ── */}
        <div style={{ padding: "36px 36px 60px", overflowY: "auto" }} ref={resultsRef}>

          {state === "idle" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 16, opacity: 0.5 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, border: `1px dashed ${C.textDim}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="scope" size={30} color={C.textDim} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: C.textMuted }}>No proposal yet</p>
                <p style={{ fontSize: 13, color: C.textDim, marginTop: 5 }}>Fill in the form and click Generate Proposal</p>
              </div>
            </div>
          )}

          {state === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.accent, animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 13, color: C.accent, fontFamily: "'DM Mono', monospace" }}>Generating your proposal…</span>
              </div>
              {[140, 180, 160, 120, 100, 200].map((h, i) => (
                <div key={i} style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  <div style={{ height: 48, background: C.bgCard, borderBottom: `1px solid ${C.border}` }} className="skeleton" />
                  <div style={{ padding: 20, background: C.bgCard, display: "flex", flexDirection: "column", gap: 10 }}>
                    {[1, 0.8, 0.9, 0.6].slice(0, Math.ceil(h / 50)).map((w, j) => (
                      <div key={j} style={{ height: 13, width: `${w * 100}%`, borderRadius: 4 }} className="skeleton" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {state === "error" && (
            <div style={{ background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.25)", borderRadius: 12, padding: "20px 24px", color: C.red, fontSize: 14 }}>
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          {state === "done" && proposal && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 20, borderBottom: `1px solid ${C.border}`, animation: "slideUp 0.4s ease" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Pill color={C.green}>✓ Proposal Ready</Pill>
                    <span style={{ fontSize: 11, color: C.textDim, fontFamily: "'DM Mono', monospace" }}>
                      {formatDisplayDateShort()} · REF-{refNum.current}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>{form.issue}</h2>
                  <p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                    {form.propertyType} · {form.areaSize} m² · {urgency?.label} priority
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="action-btn" onClick={handleCopy}>
                    <Icon name={copied ? "check" : "copy"} size={13} color={copied ? C.green : C.textMuted} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button className="action-btn">
                    <Icon name="download" size={13} color={C.textMuted} />
                    Export PDF
                  </button>
                </div>
              </div>

              <ProposalSection icon="scope" title="Scope of Works" delay={0.05}>
                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, marginBottom: 16 }}>{proposal.scopeOfWork?.overview ?? "—"}</p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(proposal.scopeOfWork?.steps ?? []).map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: C.accentPale, border: `1px solid ${C.borderAccent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65, paddingTop: 3 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </ProposalSection>

              <ProposalSection icon="reco" title="Waterproofing Recommendations" delay={0.1}>
                <div style={{ background: C.accentPale, border: `1px solid ${C.borderAccent}`, borderRadius: 9, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3, fontFamily: "'DM Mono', monospace" }}>RECOMMENDED SYSTEM</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{proposal.recommendations?.system ?? "—"}</div>
                  </div>
                  <Pill color={C.accent}>Primary</Pill>
                </div>
                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, marginBottom: 14 }}>{proposal.recommendations?.rationale ?? "—"}</p>
                {(proposal.recommendations?.items ?? []).map((item, i) => <ListItem key={i}>{item}</ListItem>)}
              </ProposalSection>

              <ProposalSection icon="material" title="Materials List" delay={0.15}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        {["Product", "Specification", "Qty", "Unit", "Note"].map((h) => (
                          <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: C.textDim, fontWeight: 700, fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(proposal.materials?.items ?? []).map((mat, i) => (
                        <tr key={i} className="mat-row" style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: C.text, fontSize: 12 }}>{mat.product ?? "—"}</td>
                          <td style={{ padding: "10px 12px", color: C.textMuted, fontSize: 11 }}>{mat.spec ?? "—"}</td>
                          <td style={{ padding: "10px 12px", color: C.accentLight, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{mat.qty ?? "—"}</td>
                          <td style={{ padding: "10px 12px", color: C.textDim, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{mat.unit ?? "—"}</td>
                          <td style={{ padding: "10px 12px", color: C.textDim, fontSize: 11 }}>{mat.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ProposalSection>

              <ProposalSection icon="exclude" title="Exclusions & Provisional Items" delay={0.2}>
                <div style={{ background: "rgba(224,82,82,0.05)", border: "1px solid rgba(224,82,82,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>⚠ The following items are not included in this proposal unless otherwise stated in writing.</span>
                </div>
                {(proposal.exclusions?.items ?? []).map((item, i) => <ListItem key={i} bullet="✕">{item}</ListItem>)}
              </ProposalSection>

              <ProposalSection icon="warranty" title="Warranty & Guarantee" delay={0.25}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                  <div style={{ background: C.greenBg, border: "1px solid rgba(56,161,105,0.25)", borderRadius: 9, padding: "10px 16px", flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 10, color: C.green, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>DURATION</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{proposal.warranty?.duration ?? "—"}</div>
                  </div>
                  <div style={{ background: C.blueBg, border: "1px solid rgba(59,130,196,0.25)", borderRadius: 9, padding: "10px 16px", flex: 2, minWidth: 200 }}>
                    <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>COVERAGE</div>
                    <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{proposal.warranty?.coverage ?? "—"}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: C.textDim, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>CONDITIONS</div>
                  {(proposal.warranty?.conditions ?? []).map((c, i) => <ListItem key={i}>{c}</ListItem>)}
                </div>
                <div style={{ background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 9, padding: "14px 16px", borderLeft: `3px solid ${C.accent}` }}>
                  <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>WARRANTY STATEMENT</div>
                  <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.75, fontStyle: "italic" }}>{proposal.warranty?.statement ?? "—"}</p>
                </div>
              </ProposalSection>

              <ProposalSection icon="summary" title="Project Summary" delay={0.3}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Est. Duration", value: proposal.summary?.duration     ?? "—", color: C.blue   },
                    { label: "Mobilisation",  value: proposal.summary?.mobilisation ?? "—", color: C.accent },
                    { label: "Crew Size",     value: proposal.summary?.crew         ?? "—", color: C.green  },
                  ].map((m) => (
                    <div key={m.label} style={{ background: C.bgInput, borderRadius: 9, border: `1px solid ${C.border}`, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 5, fontFamily: "'DM Mono', monospace" }}>{m.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.03) 100%)", border: `1px solid ${C.borderAccent}`, borderRadius: 11, padding: "20px 22px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>ESTIMATED INVESTMENT (AUD, ex GST)</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", fontFamily: "'DM Mono', monospace" }}>
                      ${(proposal.summary?.lowEstimate ?? 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: 20, color: C.textDim, fontWeight: 400 }}>–</span>
                    <span style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", fontFamily: "'DM Mono', monospace" }}>
                      ${(proposal.summary?.highEstimate ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <Pill color={C.green}>
                      {proposal.summary?.confidence
                        ? proposal.summary.confidence.charAt(0).toUpperCase() + proposal.summary.confidence.slice(1) + " Confidence"
                        : "Confidence TBC"}
                    </Pill>
                    <span style={{ fontSize: 11, color: C.textDim }}>Final price confirmed after site inspection</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textDim, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>NEXT STEPS</div>
                  {(proposal.summary?.nextSteps ?? []).map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.greenBg, border: "1px solid rgba(56,161,105,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.green, flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontSize: 13, color: C.textMuted }}>{step}</span>
                    </div>
                  ))}
                </div>
              </ProposalSection>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 8, animation: "slideUp 0.5s ease 0.35s both" }}>
                <button className="action-btn" onClick={handleCopy}>
                  <Icon name={copied ? "check" : "copy"} size={13} color={copied ? C.green : C.textMuted} />
                  {copied ? "Copied to clipboard" : "Copy full proposal"}
                </button>
                <button className="action-btn">
                  <Icon name="download" size={13} color={C.textMuted} />
                  Export as PDF
                </button>
                <button onClick={() => generate("regenerate")} disabled={state === "loading"}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 9, border: "none", background: C.accent, color: "#0C1B2A", fontSize: 12, fontWeight: 700, cursor: state === "loading" ? "wait" : "pointer", opacity: state === "loading" ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif" }}>
                  <Icon name="spark" size={13} color="#0C1B2A" />
                  {state === "loading" ? "Regenerating…" : "Regenerate"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
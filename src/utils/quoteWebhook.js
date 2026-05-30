const QUOTE_WEBHOOK_URL =
  "https://n8n.srv1419578.hstgr.cloud/webhook/structure-seal/quote_generator";

export async function postQuoteWebhook(payload) {
  const res = await fetch(QUOTE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Quote webhook failed (${res.status})`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return { ok: true };
}

export function buildDashboardQuotePayload(lead, contact = {}, action = "generate") {
  const name   = (contact.name   ?? lead?.name   ?? "").trim();
  const phone  = (contact.phone  ?? lead?.phone  ?? "").trim();
  const email  = (contact.email  ?? "").trim();
  const suburb = (contact.suburb ?? lead?.suburb ?? "").trim();
  return {
    source: "crm-dashboard", action, timestamp: new Date().toISOString(),
    name, phone, email, suburb,
    ...(lead ? { lead: { id: lead.id, name: lead.name, job: lead.job, value: lead.value, stage: lead.stage, priority: lead.priority, phone: lead.phone, suburb: lead.suburb, days: lead.days } } : {}),
  };
}

export function buildQuoteAssistantPayload(form, action = "generate") {
  return {
    source: "quote-assistant", action, timestamp: new Date().toISOString(),
    name:         (form.name        || "").trim(),
    phone:        (form.phone       || "").trim(),
    email:        (form.email       || "").trim(),
    suburb:       (form.suburb      || "").trim(),
    issue:        form.issue        || "",
    propertyType: form.propertyType || "",
    areaSize:     form.areaSize     || "",
    urgency:      form.urgency      || "",
    notes:        form.notes        || "",
  };
}

/**
 * Normalise any response shape from n8n into the internal proposal object.
 * Handles array-wrapped responses, nested keys, and your actual n8n shape.
 */
export function extractProposalFromResponse(data) {
  if (!data || typeof data !== "object") return null;

  // Unwrap array — n8n wraps output in [ … ]
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw || typeof raw !== "object") return null;

  // Already fully normalised (has recommendations object)
  if (raw.scopeOfWork && raw.recommendations && typeof raw.recommendations === "object") return raw;

  // Nested under common envelope keys
  if (raw.proposal) return normaliseN8n(raw.proposal);
  if (raw.json)     return normaliseN8n(raw.json);

  // Your actual n8n shape — normalise it
  return normaliseN8n(raw);
}

/**
 * Convert the actual n8n payload into the UI proposal shape.
 *
 * Actual n8n shape:
 * {
 *   companyName, clientName, clientSuburb, job, propertyType, areaSize, urgency,
 *   executiveSummary,
 *   scopeOfWork:  { description, steps: string[] }
 *   materials:    { description, items: string[] }   ← flat strings
 *   exclusions:   { description, items: string[] }
 *   pricing:      { subtotal, urgencySurcharge, totalEstimate, lowEstimate, highEstimate }
 *   warranty:     string   ← e.g. "7 years workmanship"
 *   confidence:   string
 *   disclaimer:   string
 * }
 */
function normaliseN8n(raw) {
  const scope    = raw.scopeOfWork || {};
  const mats     = raw.materials   || {};
  const excl     = raw.exclusions  || {};
  const pricing  = raw.pricing     || {};

  /* ── scopeOfWork ── */
  const scopeOfWork = {
    title:    "Scope of Works",
    overview: raw.executiveSummary || scope.description || "",
    steps:    Array.isArray(scope.steps) ? scope.steps : [],
  };

  /* ── recommendations ── */
  // Derive from job/issue type since n8n doesn't return this block
  const jobType =
  typeof raw.job === "string"
    ? raw.job
    : typeof raw.issue === "string"
      ? raw.issue
      : typeof raw.project?.type === "string"
        ? raw.project.type
        : "";
  const recommendations = {
    title:     "Waterproofing Recommendations",
    system:    deriveSystem(jobType),
    rationale: `Based on the project type (${jobType || "waterproofing"}) and property (${raw.propertyType || "residential"}), this system provides the best long-term performance.`,
    items:     deriveRecommendationItems(jobType),
  };

  /* ── materials ── */
  // n8n returns flat strings — parse into table rows
  const materialItems = Array.isArray(mats.items)
    ? mats.items.map(parseMaterialString)
    : [];

  const materials = {
    title: "Materials List",
    items: materialItems,
  };

  /* ── exclusions ── */
  const exclusions = {
    title: "Exclusions & Provisional Items",
    items: Array.isArray(excl.items) ? excl.items : [],
  };

  /* ── warranty ── */
  // n8n returns warranty as a plain string — convert to object
  const warrantyRaw = raw.warranty || "";
  const warranty = typeof warrantyRaw === "object"
    ? warrantyRaw  // already an object, pass through
    : deriveWarrantyFromString(warrantyRaw, jobType);

  /* ── summary ── */
  // Estimates live inside pricing in the n8n shape
  const summary = {
    title:        "Project Summary",
    duration:     deriveDuration(raw.areaSize || 0),
    mobilisation: "3–5 business days",
    crew:         "2–3 technicians",
    lowEstimate:  pricing.lowEstimate  || pricing.subtotal      || 0,
    highEstimate: pricing.highEstimate || pricing.totalEstimate || 0,
    confidence:   raw.confidence || "medium",
    nextSteps: [
      "Confirm appointment for site inspection",
      "Review and sign proposal",
      "Schedule mobilisation date",
    ],
  };

  /* ── pricing passthrough ── */
  const pricingOut = {
    lineItems:        [],
    subtotal:         pricing.subtotal         || 0,
    urgencySurcharge: pricing.urgencySurcharge || 0,
    totalEstimate:    pricing.totalEstimate    || 0,
    notes:            raw.notes               || "",
    disclaimer:       raw.disclaimer          || "",
  };

  return {
    client:          { name: raw.clientName || "", suburb: raw.clientSuburb || "" },
    project:         { type: jobType, propertyType: raw.propertyType || "", areaSizeSqm: raw.areaSize || 0, urgency: raw.urgency || "" },
    scopeOfWork,
    recommendations,
    materials,
    exclusions,
    warranty,
    summary,
    pricing: pricingOut,
  };
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Parse a flat material string like:
 * "Epoxy primer."  or  "Epoxy primer (Sika 500) – 2 kg"
 * into { product, spec, unit, qty, note }
 */
function parseMaterialString(str) {
  if (typeof str !== "string") return { product: String(str), spec: "", unit: "unit", qty: 1, note: "" };

  // Clean trailing period
  const clean = str.replace(/\.\s*$/, "").trim();

  // Try qty + unit from end: "– 2 kg", "- 500 ml"
  const qtyMatch = clean.match(/[–\-]\s*([\d.]+)\s*([a-zA-Z]+)\s*$/);
  const qty  = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
  const unit = qtyMatch ? qtyMatch[2] : "unit";

  // Extract spec from parentheses
  const specMatch = clean.match(/\(([^)]+)\)/);
  const spec = specMatch ? specMatch[1] : "";

  // Product = everything before parenthesis or dash
  const productMatch = clean.match(/^([^(–\-]+)/);
  const product = (productMatch ? productMatch[1] : clean).replace(/\.\s*$/, "").trim();

  // Anything in parentheses after the spec (e.g. "if requested")
  const noteMatch = clean.match(/\(([^)]+)\)\s*$/);
  const note = noteMatch && noteMatch[1] !== spec ? noteMatch[1] : "";

  return { product, spec, unit, qty, note };
}

/**
 * Convert a warranty string like "7 years workmanship" into the warranty object shape.
 */
function deriveWarrantyFromString(warrantyStr, jobType) {
  // Try to extract years from the string
  const yearsMatch = warrantyStr.match(/(\d+)\s*year/i);
  const duration = yearsMatch ? `${yearsMatch[1]} years` : warrantyStr || "10 years";
  const years = yearsMatch ? yearsMatch[1] : "10";

  return {
    title:    "Warranty & Guarantee",
    duration,
    coverage: "Full system warranty covering workmanship defects and material failure",
    conditions: [
      "Warranty is valid from the date of practical completion",
      "Annual inspection by StructureSeal required to maintain warranty",
      "Warranty void if substrate modified without written consent",
    ],
    statement: `StructureSeal Pty Ltd warrants all waterproofing and flooring works against defects in materials and workmanship for a period of ${duration} from the date of practical completion. This warranty is subject to the property being maintained in accordance with StructureSeal's maintenance guidelines and all annual inspection requirements being met. Works are carried out in compliance with AS 3740 and relevant NCC/BCA provisions.`,
  };
}

function deriveSystem(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("epoxy"))                            return "StructureSeal Pro Epoxy System";
  if (t.includes("roof"))                             return "Sika Sarnafil TPO Membrane";
  if (t.includes("bathroom") || t.includes("shower")) return "Mapei Aquadefense Membrane";
  if (t.includes("basement"))                         return "Tremco Paraseal GM Membrane";
  if (t.includes("balcony"))                          return "Ardex WPM 300 Membrane";
  if (t.includes("pool"))                             return "Parchem Nitoseal MS600";
  if (t.includes("retaining"))                        return "Tremco Volclay Panel System";
  if (t.includes("crack"))                            return "Sika Injection System";
  return "StructureSeal Premium Waterproofing System";
}

function deriveRecommendationItems(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("epoxy")) return [
    "Diamond grind substrate for maximum adhesion",
    "Moisture barrier primer before epoxy application",
    "Anti-slip broadcast aggregate for safety compliance",
    "UV-stable topcoat to prevent yellowing",
  ];
  return [
    "Full substrate preparation prior to membrane application",
    "Primer coat to maximise bond strength",
    "Minimum 2 coats of selected membrane system",
    "Flash all junctions, upstands and penetrations",
  ];
}

function deriveDuration(areaSqm) {
  const a = parseFloat(areaSqm) || 0;
  if (a <= 20)  return "1–2 days";
  if (a <= 60)  return "2–3 days";
  if (a <= 150) return "3–5 days";
  return "1–2 weeks";
}
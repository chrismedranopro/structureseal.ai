/**
 * Canonical mock people & leads for StructureSeal AI demo data.
 * Import from pages instead of duplicating names, phones, or suburbs.
 */

/** Logged-in CRM user (Sidebar + dashboard greeting) */
export const LOGGED_IN_USER = {
  name: "Chris Medrano",
  initials: "CM",
  role: "Admin",
  location: "Sydney",
};

/** ~14 Sydney-area leads/clients — single source of truth */
export const MOCK_LEADS = [
  {
    id: "l1",
    name: "Marcus Delgado",
    phone: "0412 881 234",
    suburb: "Bondi",
    email: "marcus.delgado@gmail.com",
    stage: "new_lead",
    issue: "Bathroom Waterproofing",
    value: 3200,
    urgency: "moderate",
    followUp: "2026-06-02",
    notes: "Tiles cracking near shower base. Tenant moving out end of month.",
  },
  {
    id: "l2",
    name: "Priya Nambiar",
    phone: "0438 772 991",
    suburb: "Parramatta",
    email: "priya.nambiar@outlook.com",
    stage: "new_lead",
    issue: "Roof Membrane Seal",
    value: 11500,
    urgency: "urgent",
    followUp: "2026-05-31",
    notes: "Flat roof leaking into living room during heavy rain.",
  },
  {
    id: "l3",
    name: "Steve Harrington",
    phone: "0401 334 551",
    suburb: "Cronulla",
    email: "steve.harrington@icloud.com",
    stage: "new_lead",
    issue: "Epoxy Garage Floor",
    value: 4800,
    urgency: "routine",
    followUp: "2026-06-10",
    notes: "New build garage. Wants charcoal flake finish.",
  },
  {
    id: "l4",
    name: "Linda Tran",
    phone: "0455 209 887",
    suburb: "Strathfield",
    email: "linda.tran@yahoo.com.au",
    stage: "site_inspection",
    issue: "Basement Waterproofing",
    value: 18900,
    urgency: "critical",
    followUp: "2026-05-30",
    notes: "Basement flooding after last storm. Structural concern flagged.",
  },
  {
    id: "l5",
    name: "Graham Whitfield",
    phone: "0421 667 003",
    suburb: "Manly",
    email: "g.whitfield@bigpond.com",
    stage: "site_inspection",
    issue: "Balcony Recoat",
    value: 2100,
    urgency: "moderate",
    followUp: "2026-06-03",
    notes: "Existing membrane bubbling. 3rd floor unit.",
  },
  {
    id: "l6",
    name: "Anna Petrov",
    phone: "0412 334 778",
    suburb: "Chatswood",
    email: "anna.petrov@gmail.com",
    stage: "quote_drafted",
    issue: "Shower Regrouting",
    value: 1400,
    urgency: "routine",
    followUp: "2026-06-05",
    notes: "Complete regrout + silicone. Small ensuite ~4m².",
  },
  {
    id: "l7",
    name: "David Chen",
    phone: "0499 221 554",
    suburb: "Castle Hill",
    email: "david.chen@hotmail.com",
    stage: "quote_drafted",
    issue: "Retaining Wall Seal",
    value: 7600,
    urgency: "moderate",
    followUp: "2026-06-01",
    notes: "12m retaining wall, damp coming through. Render cracking.",
  },
  {
    id: "l8",
    name: "Mia Kowalski",
    phone: "0418 003 229",
    suburb: "CBD",
    email: "mia.kowalski@strata.com.au",
    stage: "quote_drafted",
    issue: "Carpark Deck",
    value: 34000,
    urgency: "urgent",
    followUp: "2026-05-31",
    notes: "Strata carpark, 450m². Multiple areas delaminating.",
  },
  {
    id: "l9",
    name: "Raj Mehta",
    phone: "0432 118 776",
    suburb: "Pyrmont",
    email: "raj.mehta@gmail.com",
    stage: "quote_sent",
    issue: "Planter Box Waterproofing",
    value: 5200,
    urgency: "moderate",
    followUp: "2026-06-04",
    notes: "Rooftop planter boxes leaking into ceiling below.",
  },
  {
    id: "l10",
    name: "Sarah O'Brien",
    phone: "0411 559 002",
    suburb: "Vaucluse",
    email: "sarah.obrien@icloud.com",
    stage: "quote_sent",
    issue: "Pool Surrounds",
    value: 9800,
    urgency: "routine",
    followUp: "2026-06-08",
    notes: "Travertine lifting. Re-bed + waterproof membrane under pavers.",
  },
  {
    id: "l11",
    name: "Sasha Kovacs",
    phone: "0498 113 445",
    suburb: "Liverpool",
    email: "sasha.kovacs@gmail.com",
    stage: "won",
    issue: "Concrete Crack Repair",
    value: 890,
    urgency: "routine",
    followUp: "2026-06-12",
    notes: "Driveway hairline cracks. Polyurethane injection method.",
  },
  {
    id: "l12",
    name: "Tom Elsworth",
    phone: "0438 221 003",
    suburb: "Mosman",
    email: "tom.elsworth@bigpond.com",
    stage: "won",
    issue: "Basement Tanking",
    value: 22000,
    urgency: "urgent",
    followUp: "2026-06-01",
    notes: "Heritage home. Sensitivity around existing finishes.",
  },
  {
    id: "l13",
    name: "Brenda Yu",
    phone: "0461 774 112",
    suburb: "Newtown",
    email: "brenda.yu@gmail.com",
    stage: "won",
    issue: "Bathroom Waterproofing",
    value: 2600,
    urgency: "moderate",
    followUp: "2026-06-09",
    notes: "Full bathroom waterproof. Tiles already removed by client.",
  },
  {
    id: "l14",
    name: "Phil Donovan",
    phone: "0402 883 117",
    suburb: "Leichhardt",
    email: "phil.donovan@outlook.com",
    stage: "lost",
    issue: "Roof Membrane",
    value: 8400,
    urgency: "moderate",
    followUp: "2026-05-28",
    notes: "Went with cheaper quote. May revisit if issues arise.",
  },
];

const leadById = (id) => MOCK_LEADS.find((l) => l.id === id);

const firstName = (name) => name.split(" ")[0];

/** Format 04xx mobile for display with +61 prefix (missed-call recovery page) */
export function toIntlPhone(phone) {
  const digits = phone.replace(/\s/g, "");
  if (digits.startsWith("04") && digits.length === 10) {
    const rest = digits.slice(1);
    return `+61 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }
  return phone;
}

const fmtAud = (n) =>
  "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** CRM dashboard lead table (subset + dashboard-specific stage labels) */
export const DASHBOARD_LEADS = [
  { id: 1, leadId: "l1", ...pickLead("l1"), job: leadById("l1").issue, value: fmtAud(3200), stage: "Quote Sent", priority: "hot", days: 2 },
  { id: 2, leadId: "l2", ...pickLead("l2"), job: leadById("l2").issue, value: fmtAud(11500), stage: "Site Inspect", priority: "hot", days: 1 },
  { id: 3, leadId: "l3", ...pickLead("l3"), job: leadById("l3").issue, value: fmtAud(4800), stage: "New Lead", priority: "warm", days: 0 },
  { id: 4, leadId: "l4", ...pickLead("l4"), job: leadById("l4").issue, value: fmtAud(18900), stage: "Negotiating", priority: "hot", days: 5 },
  { id: 5, leadId: "l5", ...pickLead("l5"), job: leadById("l5").issue, value: fmtAud(2100), stage: "Quote Sent", priority: "warm", days: 3 },
  { id: 6, leadId: "l11", ...pickLead("l11"), job: leadById("l11").issue, value: fmtAud(890), stage: "Won", priority: "cold", days: 8 },
  { id: 7, leadId: "l6", ...pickLead("l6"), job: leadById("l6").issue, value: fmtAud(1400), stage: "New Lead", priority: "warm", days: 0 },
];

function pickLead(id) {
  const l = leadById(id);
  return { name: l.name, phone: l.phone, suburb: l.suburb };
}

/** CRM dashboard missed-calls widget */
export const DASHBOARD_MISSED_CALLS = [
  { id: 1, name: "Unknown Caller", number: "0412 558 990", time: "9:14 AM", ago: "2h ago", status: "pending", value: "~$4K", leadId: null },
  { id: 2, name: leadById("l12").name, number: leadById("l12").phone, time: "11:32 AM", ago: "43m ago", status: "sms_sent", value: "~$22K", leadId: "l12" },
  { id: 3, name: leadById("l13").name, number: leadById("l13").phone, time: "8:05 AM", ago: "3h ago", status: "called_back", value: "~$3K", leadId: "l13" },
  { id: 4, name: "Unknown Caller", number: "0499 003 551", time: "29 May 2026", ago: "1d ago", status: "pending", value: "~$8K", leadId: null },
];

/** Missed Call Recovery page — known leads + unknown callers */
export const MISSED_CALLS_RECOVERY = [
  {
    id: "MC-2841",
    leadId: "l4",
    caller: leadById("l4").name,
    phone: toIntlPhone(leadById("l4").phone),
    time: "30 May 2026, 08:14 AM",
    date: "30 May 2026",
    duration: "0:00",
    attempts: 3,
    urgency: "critical",
    status: "pending",
    location: `${leadById("l4").suburb}, NSW`,
    aiSummary:
      "Caller likely reporting active water ingress — 3 consecutive calls within 40 minutes suggests urgent structural leak. Voicemail mentions basement flooding and can't wait. Matches existing lead Linda Tran (basement waterproofing).",
    projectType: leadById("l4").issue,
    estimatedValue: leadById("l4").value,
    leadStage: "ai_intake",
    callbackScheduled: null,
    tags: ["Flooding", "Urgent", "Residential"],
  },
  {
    id: "MC-2840",
    leadId: "l7",
    caller: leadById("l7").name,
    phone: toIntlPhone(leadById("l7").phone),
    time: "29 May 2026, 4:52 PM",
    date: "29 May 2026",
    duration: "0:22",
    attempts: 1,
    urgency: "high",
    status: "scheduled",
    location: `${leadById("l7").suburb}, NSW`,
    aiSummary:
      "Left voicemail asking for quote on retaining wall sealing after recent storm damage. Mentioned referral from a neighbour on the street. Warm lead — likely comparing 2–3 contractors.",
    projectType: leadById("l7").issue,
    estimatedValue: leadById("l7").value,
    leadStage: "lead_created",
    callbackScheduled: "30 May 2026, 2:00 PM",
    tags: ["Storm Damage", "Referral", "Residential"],
  },
  {
    id: "MC-2839",
    leadId: "l8",
    caller: leadById("l8").name,
    phone: toIntlPhone(leadById("l8").phone),
    time: "29 May 2026, 11:31 AM",
    date: "29 May 2026",
    duration: "0:00",
    attempts: 2,
    urgency: "medium",
    status: "converted",
    location: `${leadById("l8").suburb}, NSW`,
    aiSummary:
      "No voicemail, but called twice from a known strata carpark contact. Site likely requires expansion joint re-sealing or membrane replacement on the CBD deck job already in pipeline.",
    projectType: leadById("l8").issue,
    estimatedValue: leadById("l8").value,
    leadStage: "quote_generated",
    callbackScheduled: null,
    tags: ["Commercial", "Strata", "High Value"],
  },
  {
    id: "MC-2838",
    leadId: null,
    caller: "Unknown Caller",
    phone: "+61 412 558 990",
    time: "28 May 2026",
    date: "28 May 2026",
    duration: "0:45",
    attempts: 1,
    urgency: "low",
    status: "pending",
    location: "Penrith, NSW",
    aiSummary:
      "Voicemail requesting general inspection quote for damp walls in a granny flat conversion. Caller ID not matched to an existing lead — create new contact on callback.",
    projectType: "Internal Tanking",
    estimatedValue: 4200,
    leadStage: "ai_intake",
    callbackScheduled: null,
    tags: ["Granny Flat", "Low Urgency", "Unidentified"],
  },
  {
    id: "MC-2837",
    leadId: "l2",
    caller: leadById("l2").name,
    phone: toIntlPhone(leadById("l2").phone),
    time: "28 May 2026",
    date: "28 May 2026",
    duration: "1:10",
    attempts: 1,
    urgency: "high",
    status: "recovered",
    location: `${leadById("l2").suburb}, NSW`,
    aiSummary:
      "Long voicemail — caller described roof membrane failure and water pooling after rain. Requested written quote for insurance claim. Matches Priya Nambiar (roof membrane, Parramatta).",
    projectType: leadById("l2").issue,
    estimatedValue: leadById("l2").value,
    leadStage: "quote_generated",
    callbackScheduled: null,
    tags: ["Insurance", "Roof", "Residential"],
  },
];

/** AI quote templates keyed by job type (CRM dashboard panel) */
export const QUOTE_TEMPLATES = {
  bathroom: `Hi ${firstName(leadById("l1").name)},\n\nThank you for reaching out to StructureSeal.\n\nBased on our inspection of your ${leadById("l1").suburb} bathroom (12m²), we recommend a full Mapei Aquadefense membrane application with ceramic tile rebed. This system carries our 10-year waterproof guarantee.\n\n**Scope of Works:**\n• Remove existing grout & failed sealant\n• Apply 2x coats waterproof membrane\n• Re-bed & regrout floor tiles\n• Silicone seal all junctions\n\n**Investment: ${fmtAud(3200)} + GST**\n\nWe can mobilise within 5 business days. Please call 1300 699 799 to confirm.\n\nWarm regards,\nStructureSeal Team`,
  roof: `Hi ${firstName(leadById("l2").name)},\n\nThank you for choosing StructureSeal for your ${leadById("l2").suburb} property.\n\nAfter reviewing your roof structure (approx. 85m²), we recommend a Sika Sarnafil TPO membrane system — ideal for flat/low-pitch applications and rated for 20+ years.\n\n**Scope of Works:**\n• Full existing membrane removal & substrate prep\n• Prime & install 1.5mm TPO membrane\n• Flash all penetrations & upstands\n• Drainage point upgrade (x3)\n\n**Investment: ${fmtAud(11500)} + GST**\n\n5-year workmanship warranty included. Happy to arrange a site meeting at your convenience.\n\nStructureSeal Team`,
  epoxy: `Hi ${firstName(leadById("l3").name)},\n\nGreat to connect — here's your tailored quote for the ${leadById("l3").suburb} garage.\n\nFor a 48m² garage floor we recommend our StructureSeal Pro Epoxy System: 2-part high-build epoxy with anti-slip broadcast finish in your choice of colour.\n\n**Scope of Works:**\n• Diamond grind & repair surface cracks\n• Apply moisture barrier primer\n• 2x coats high-build epoxy\n• Broadcast anti-slip aggregate\n• Top coat seal\n\n**Investment: ${fmtAud(4800)} + GST**\n\nTypically a 2-day install. Cured and ready for vehicles in 72 hours.\n\nStructureSeal Team`,
};

/** Quick-fill samples for AI Quotes form */
export const RECENT_QUOTE_CLIENTS = [
  leadById("l1"),
  leadById("l4"),
  leadById("l2"),
].map((l) => ({
  name: l.name,
  phone: l.phone,
  email: l.email,
  suburb: l.suburb,
  issue: l.issue,
}));

/** Canonical name list for docs / debugging */
export const CANONICAL_NAMES = [
  LOGGED_IN_USER.name,
  ...MOCK_LEADS.map((l) => l.name),
  "Unknown Caller",
];

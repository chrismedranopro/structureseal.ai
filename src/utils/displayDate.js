/** Fixed demo "today" for UI — 30 May 2026 */
export function getDisplayToday() {
  const d = new Date(2026, 4, 30);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDisplayHeaderDate() {
  return new Date(2026, 4, 30).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDisplayDateLong() {
  return new Date(2026, 4, 30).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDisplayDateShort() {
  return new Date(2026, 4, 30).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

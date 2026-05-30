import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LOGGED_IN_USER } from "../../data/mockLeads";

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconLeads = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconQuotes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const IconMissedCalls = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.26 9.8a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11l-1.27 1.27z" />
    <line x1="23" y1="1" x2="1" y2="23" />
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconCollapse = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconExpand = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: <IconDashboard />, badge: null },
  { label: "Leads Pipeline", path: "/leads", icon: <IconLeads />, badge: { count: 47, color: "orange" } },
  { label: "AI Quotes", path: "/quotes", icon: <IconQuotes />, badge: null },
  { label: "Missed Calls", path: "/missed-calls", icon: <IconMissedCalls />, badge: { count: 3, color: "red", pulse: true } },
];

const BOTTOM_ITEMS = [
  { label: "Settings", path: "/settings", icon: <IconSettings /> },
];

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ badge, collapsed }) {
  if (!badge) return null;
  const colorMap = {
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    blue: "bg-brand-blue/20 text-brand-blue-light border-brand-blue/30",
  };
  if (collapsed) {
    return (
      <span
        className={`absolute top-1 right-1 w-2 h-2 rounded-full border ${
          badge.color === "red" ? "bg-red-400 border-red-500" : "bg-orange-400 border-orange-500"
        } ${badge.pulse ? "animate-pulse" : ""}`}
      />
    );
  }
  return (
    <span
      className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-md border ${colorMap[badge.color] || colorMap.orange} ${badge.pulse ? "animate-pulse" : ""}`}
    >
      {badge.count}
    </span>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group select-none",
          isActive
            ? "bg-orange-500/10 text-orange-400 border border-orange-500/50"
            : "text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/[0.05]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex-shrink-0 transition-colors ${isActive ? "text-orange-400" : "text-slate-500 group-hover:text-slate-300"}`}
          >
            {item.icon}
          </span>
          {!collapsed && <span className="flex-1 truncate leading-none">{item.label}</span>}
          <Badge badge={item.badge} collapsed={collapsed} />
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sidebar-root flex flex-shrink-0 flex-col bg-brand-navy-mid border-r border-white/[0.06] transition-all duration-300 ease-in-out ${
        collapsed ? "sidebar-root--collapsed" : ""
      }`}
      style={{ minHeight: "100vh" }}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] ${collapsed ? "justify-center px-0" : ""}`}
      >
        <div className="w-8 h-8 flex-shrink-0 rounded-md bg-brand-orange flex items-center justify-center shadow-lg shadow-orange-500/25">
          <span className="text-white font-black text-sm">S</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-white leading-tight tracking-tight">StructureSeal</div>
            <div className="text-[10px] text-brand-orange font-semibold uppercase tracking-widest leading-tight">
              CRM PRO
            </div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <div className="px-3 pb-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.12em]">Main Menu</span>
          </div>
        )}
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}

        {!collapsed && (
          <div className="px-3 pt-4 pb-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.12em]">System</span>
          </div>
        )}
        {collapsed && <div className="my-3 mx-2 border-t border-white/[0.06]" />}
        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User profile */}
      <div className={`border-t border-white/[0.06] p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brand-orange-gradient, linear-gradient(135deg, #f97316 0%, #ea580c 100%))" }}
          >
            <span className="text-white text-xs font-black">{LOGGED_IN_USER.initials}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              <span className="text-white text-xs font-black">{LOGGED_IN_USER.initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{LOGGED_IN_USER.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{LOGGED_IN_USER.role} · {LOGGED_IN_USER.location}</div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Online" />
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`flex items-center justify-center border-t border-white/[0.06] py-3 text-slate-600 hover:text-slate-300 hover:bg-white/[0.03] transition-colors text-xs gap-1.5 ${
          collapsed ? "" : "px-4"
        }`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <IconExpand />
        ) : (
          <>
            <IconCollapse />
            <span className="text-[11px] font-medium">Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}

export function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-brand-navy">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}

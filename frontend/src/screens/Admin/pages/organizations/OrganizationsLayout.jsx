import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { label: "All Organizations", to: "/admin/organizations", end: true },
  { label: "Farmers / Farms", to: "/admin/organizations/farmers" },
  { label: "Slaughterhouses", to: "/admin/organizations/slaughterhouses" },
  { label: "Processors", to: "/admin/organizations/processors" },
  { label: "Distributors", to: "/admin/organizations/distributors" },
  { label: "Other Organizations", to: "/admin/organizations/other" },
];

export function OrganizationsLayout() {
  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          borderBottom: "1.5px solid var(--border-soft)",
          marginBottom: 24,
          paddingBottom: 2,
        }}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: "10px 10px 0 0",
              color: isActive ? "var(--maroon-800)" : "var(--ink-600)",
              background: isActive ? "var(--cream-100)" : "transparent",
              borderBottom: isActive ? "2px solid var(--gold-600)" : "2px solid transparent",
              marginBottom: -2,
              whiteSpace: "nowrap",
            })}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </>
  );
}

export default OrganizationsLayout;
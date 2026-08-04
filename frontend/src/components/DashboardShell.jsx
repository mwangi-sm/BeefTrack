import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon, IconPaths } from "./icons";

// navItems: [{ label, icon, active?, path?, onSelect?, onClick? }]
export function DashboardShell({
  roleLabel,
  actorId,
  name,
  navItems,
  onLogout,
  onToggleTheme,
  onNotificationsToggle,
  onProfileClick,
  notificationsActive = false,
  profileActive = false,
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.onSelect) {
      item.onSelect();
    } else if (item.onClick) {
      item.onClick();
    }
    setDrawerOpen(false);
  };

  // Shared "toggle" behavior for the topbar bell and profile buttons: if
  // you're already on that sub-page, clicking again takes you back to the
  // dashboard home instead of just re-navigating to the same place.
  function toggleTo(subPath) {
    const base = basePathFor(navItems);
    const target = `${base}${subPath}`;
    if (location.pathname === target) {
      navigate(base);
    } else {
      navigate(target);
    }
  }

  return (
    <>
      <div
        className={`drawer-overlay${drawerOpen ? " open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      ></div>

      <aside className={`drawer${drawerOpen ? " open" : ""}`}>
        <div className="drawer-head">
          <div className="drawer-role">
            {roleLabel} · {actorId}
          </div>
          <div className="drawer-name">{name}</div>
        </div>
        <nav>
          {navItems.map((item, i) => {
            const isActive = item.active || (item.path && location.pathname === item.path);
            
            return (
              <a
                href={item.path || "#"}
                key={item.path || i}
                className={isActive ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item);
                }}
              >
                <Icon size={17}>{item.icon}</Icon> {item.label}
              </a>
            );
          })}
        </nav>
        <div className="drawer-footer">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onLogout?.();
            }}
          >
            <Icon size={15}>{IconPaths.logout}</Icon>
            Log out
          </a>
        </div>
      </aside>

      <div className="topbar">
        <div className="topbar-left">
          <button className="icon-btn" onClick={() => setDrawerOpen(true)}>
            <Icon>{IconPaths.menu}</Icon>
          </button>
          <div className="wordmark" style={{ fontSize: 16 }}>
            <span
              className="stampmark"
              style={{ width: 28, height: 28, fontSize: 11 }}
            >
              BT
            </span>
            BeefTrace
          </div>
        </div>
        <div className="topbar-right">
          <button
            className="icon-btn"
            title="Notifications"
            onClick={onNotificationsToggle || (() => toggleTo("/notifications"))}
          >
            <Icon>{IconPaths.bell}</Icon>
            <span
              className={`badge-dot${
                notificationsActive || location.pathname.endsWith("/notifications")
                  ? " active"
                  : ""
              }`}
            ></span>
          </button>
          <button
            className="icon-btn"
            title="Toggle theme"
            onClick={onToggleTheme}
          >
            <Icon>{IconPaths.sun}</Icon>
          </button>
          <button
            className={`icon-btn${
              profileActive || location.pathname.endsWith("/profile") ? " active" : ""
            }`}
            title="Profile"
            onClick={onProfileClick || (() => toggleTo("/profile"))}
          >
            <Icon>{IconPaths.profile}</Icon>
          </button>
        </div>
      </div>

      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        <Icon>{IconPaths.arrowLeft}</Icon>
        Back
      </button>

      <div className="dash-body">{children}</div>
    </>
  );
}

function basePathFor(navItems) {
  return navItems[0]?.path || "";
}
import { useEffect } from "react";
import { Icon } from "./icons";

export function RecordDetailModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: 18,
            border: "1.5px solid var(--border-soft)",
            boxShadow: "0 20px 48px rgba(0,0,0,0.25)",
            width: "100%",
            maxWidth: 560,
            maxHeight: "85vh",
            overflow: "auto",
            padding: "28px 24px 24px",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--cream-100)",
              border: "1px solid var(--border-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 1,
            }}
            onClick={onClose}
          >
            <Icon size={16}>
              <path d="M18 6L6 18M6 6l12 12" />
            </Icon>
          </button>

          {title && (
            <h3
              style={{
                fontSize: 17,
                fontWeight: 600,
                margin: "0 0 18px",
                fontFamily: "'Inter', sans-serif",
                paddingRight: 32,
              }}
            >
              {title}
            </h3>
          )}

          {children}
        </div>
      </div>
    </>
  );
}


export function FormField({ label, as = "input", style, ...props }) {
  const Tag = as;
  const baseStyle = {
    width: "100%",
    padding: "10px 13px",
    borderRadius: 10,
    border: "1.5px solid var(--border-soft)",
    background: "var(--page-bg)",
    color: "var(--ink-900)",
    fontFamily: "inherit",
    fontSize: 13.5,
    ...style,
  };

  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-900)", marginBottom: 6 }}>
        {label}
      </span>
      <Tag style={baseStyle} {...props} />
    </label>
  );
}
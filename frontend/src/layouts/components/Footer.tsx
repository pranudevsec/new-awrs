const Footer = () => (
  <footer
    style={{
      background: "#850b0b",
      padding: "0.25rem 0",
      textAlign: "center",
      // borderTop: "1px solid #bcdff1",
      color: "#fff", // Changed text color to white
      fontSize: "16px",
      fontWeight: 500,
      letterSpacing: 0.5,
      boxShadow: "0 -2px 8px rgba(44,62,80,0.05)",
      zIndex: 20,
      position: "relative",
    }}
  >
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
      <span>© 2025 Developed by <strong style={{ color: "#fff" }}>DGIS</strong></span>
      <span style={{ fontSize: "14px", color: "#fff" }}>
        | <a href="mailto:support@dgis.com" style={{ color: "#fff", textDecoration: "underline" }}>Contact Support</a>
      </span>
      <span style={{ fontSize: "14px", color: "#fff" }}>
        | <a href="/privacy" style={{ color: "#fff", textDecoration: "underline" }}>Privacy Policy</a>
      </span>
    </div>
  </footer>
);

export default Footer;
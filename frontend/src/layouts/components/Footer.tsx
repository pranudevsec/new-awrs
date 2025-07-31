import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="position-relative text-center text-white fw-5"
    style={{
      background: "#850b0b",
      padding: "0.25rem 0",
      fontSize: "16px",
      letterSpacing: 0.5,
      boxShadow: "0 -2px 8px rgba(44,62,80,0.05)",
      zIndex: 20,
    }}
  >
    <div className="d-flex flex-sm-row flex-column align-items-center justify-content-center text-white gap-2">
      <span className="text-white">© 2025 Developed by <strong className="text-white">DGIS</strong></span>
      <span style={{ fontSize: "14px", }} className="text-white">
        | <a href="mailto:support@dgis.com" className="text-decoration-underline text-white">Contact Support</a>
      </span>
      <span style={{ fontSize: "14px", }} className="text-white">
        | <Link to="/privacy" className="text-decoration-underline text-white">Privacy Policy</Link>
      </span>
    </div>
  </footer>
);

export default Footer;
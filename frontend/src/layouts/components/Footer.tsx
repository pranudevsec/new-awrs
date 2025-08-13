import { useState } from "react";

const Footer = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <footer
        className="position-relative text-center text-white fw-5"
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
          <span className="text-white">
            © 2025 Developed by <strong className="text-white">DGIS</strong>
          </span>
          <span style={{ fontSize: "14px" }} className="text-white">
            |{" "}
            <button
              onClick={() => setShowModal(true)}
              className="text-decoration-underline text-white border-0 bg-transparent p-0"
              style={{ cursor: "pointer" }}
            >
              Contact Us
            </button>
          </span>
        </div>
      </footer>

      {/* Modal */}
    {showModal && (
  <div
    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
    style={{
      backgroundColor: "rgba(0,0,0,0.6)",
      zIndex: 1050,
      animation: "fadeIn 0.3s ease-in-out",
    }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modalTitle"
    aria-describedby="modalDescription"
  >
    <div
      className="bg-white rounded-4 p-4 position-relative"
      style={{
        width: "320px",
        textAlign: "center",
        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        transform: "scale(1)",
        animation: "scaleUp 0.3s ease-in-out",
      }}
    >
      {/* Close button */}
      <button
        onClick={() => setShowModal(false)}
        className="position-absolute top-0 end-0 m-2 btn-close"
        aria-label="Close help modal"
      ></button>

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0056b3, #007bff)",
          color: "white",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "15px",
        }}
      >
        <h5 id="modalTitle" className="fw-bold mb-0">
          Need Help?
        </h5>
      </div>

      {/* Body */}
      <h6 className="fw-bold text-secondary mb-2">ASDC (DGIS)</h6>
      <p id="modalDescription" className="text-dark mb-1" style={{ fontSize: "1rem" }}>
        📞 Contact No: <strong>410000-32894</strong>
      </p>
      <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
      </p>
    </div>

    {/* Animations */}
    <style>
      {`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}
    </style>
  </div>
)}

    </>
  );
};

export default Footer;

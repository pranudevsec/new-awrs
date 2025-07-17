const Footer = () => {
  return (
    <footer
      className="text-white py-3 px-4 mt-auto shadow-sm"
      style={{ backgroundColor: '#780000' }}
    >
      <div className="container-fluid d-flex justify-content-between align-items-center flex-wrap">
        <span className="fw-semibold">
          © {new Date().getFullYear()} Indian Army e-Citation Application
        </span>
        <small className="text-white-50">
          Built with dedication for the brave
        </small>
      </div>
    </footer>
  );
};

export default Footer;

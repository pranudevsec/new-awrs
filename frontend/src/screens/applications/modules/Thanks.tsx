import { Link } from "react-router-dom";

const Thanks = () => {
  return (
    <div className="thanks-section text-center">
      <h1 className="font-lexend mb-5 fw-5">
        Thanks! Application submitted <br /> on 22-05-2025
      </h1>
      <Link to="/" className="_btn _btn-lg primary">
        Go Home
      </Link>
    </div>
  );
};

export default Thanks;

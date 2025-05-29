import { Link } from "react-router-dom";

const Thanks = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB");
  return (
    <div className="thanks-section text-center">
      <h1 className="font-lexend mb-5 fw-5">
        Thanks! Application submitted <br /> {formattedDate}
      </h1>
      <Link to="/" className="_btn _btn-lg primary">
        Go Home
      </Link>
    </div>
  );
};

export default Thanks;

import { Link, useLocation } from "react-router-dom";

const Thanks = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB");

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");

  return (
    <div className="thanks-section text-center">
      <h1 className="font-lexend mb-5 fw-5">
        Thanks! Application {id && `ID: ${id} `}submitted <br />
        {formattedDate}
      </h1>
      <Link to="/" className="_btn _btn-lg primary">
        Go Home
      </Link>
    </div>
  );
};

export default Thanks;

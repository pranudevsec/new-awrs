import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "../../../reduxToolkit/hooks";

const Thanks = () => {
  const profile = useAppSelector((state) => state.admin.profile);
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB");

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");

  return (
    <div className="thanks-section text-center">
      <h1 className="font-lexend mb-5 fw-5">
        Thanks! <br /> Application {id && `ID: ${id} `}submitted to {profile?.unit?.bde}<br />
        on {formattedDate}
      </h1>
      <Link to="/" className="_btn _btn-lg primary">
        Go Home
      </Link>
    </div>
  );
};

export default Thanks;

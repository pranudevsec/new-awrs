import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import dgis from '../../assets/dgislogo.png';

const Topbar = () => {

  return (
    <div className="top-bar-content w-100 text-white py-3 px-4 shadow" style={{ background: 'linear-gradient(to right, #850b0bff 30%, #0085fe)'}}>
      <div className="d-flex align-items-center justify-content-between h-100">
        <Link to="/">
          <img
            src={logo}
            alt="Indian Army Logo"
            className="img-fluid logo-img"
          />
        </Link>
        <h1
          className="text-center m-0 flex-grow-1 fw-bold"
          style={{
            background: 'linear-gradient(to top,rgb(4, 106, 56), rgb(255, 255, 255), rgb(255, 103, 31))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '44px',
          }}
        > Indian Army Unit e-Citation Application</h1>
        <Link to="/">
          <img
            src={dgis}
            alt="DGIS Logo"
            className="img-fluid logo-img"
          />
        </Link>
      </div>
    </div>
  );
};

export default Topbar;

import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import dgis from '../../assets/dgislogo.png';

const Topbar = () => {
  return (
    <div className="top-bar-content w-100 text-white shadow">
      <div className="d-flex align-items-center justify-content-between h-100">
        <Link to="/" className='flex-shrink-0'>
          <img
            src={logo}
            alt="Indian Army Logo"
            className="img-fluid logo-img"
          />
        </Link>
        <h1 className="text-center m-0 flex-grow-1 fw-bold" > Indian Army Unit e-Citation Application</h1>
        <Link to="/" className='flex-shrink-0'>
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

import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import dgis from '../../assets/dgislogo.png';

const Topbar = () => {
  const navigate = useNavigate();

  return (
    <div className="top-bar-content w-100 text-white py-3 px-4 shadow" style={{ backgroundColor: '#780000' }}>
      <div className="d-flex align-items-center justify-content-between h-100">
        <img
          src={logo}
          alt="Indian Army Logo"
          className="img-fluid logo-img"
          onClick={() => navigate('/')}
        />
        <h1 className="text-white fw-bold text-center m-0 flex-grow-1">
          Indian Army e-Citation Application
        </h1>
        <img
          src={dgis}
          alt="DGIS Logo"
          className="img-fluid logo-img"
          onClick={() => navigate('/')}
        />
      </div>
    </div>
  );
};

export default Topbar;

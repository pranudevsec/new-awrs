import logo from '../../assets/logo.png';
import dgis from '../../assets/dgislogo.png';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
  const navigate = useNavigate();

  return (
    <div className="w-100 text-white py-3 px-4 shadow" style={{ backgroundColor: '#780000' }}>
      <div className="d-flex align-items-center justify-content-between">
        <img
          src={logo}
          alt="Indian Army Logo"
          className="img-fluid"
          style={{ width: '64px', height: '64px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

        <h1 className="h3 fw-bold text-center m-0 flex-grow-1">
          Indian Army e-Citation Application
        </h1>

        <img
          src={dgis}
          alt="DGIS Logo"
          className="img-fluid"
          style={{ width: '64px', height: '64px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />
      </div>
    </div>
  );
};

export default Topbar;

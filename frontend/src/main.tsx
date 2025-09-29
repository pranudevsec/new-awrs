import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from './reduxToolkit/index';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/sass/style.scss';
import { Suspense, lazy } from 'react';

const App = lazy(() => import('./App'));

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
        <Toaster position="top-center" />
      </BrowserRouter>
    </PersistGate>
  </Provider>
)

import { Route, Routes } from "react-router";
import { publicRoutes, authProtectedRoutes } from "./routing";
import AuthLayout from "./layouts/AuthLayout";
import PublicLayout from "./layouts/PublicLayout";

const App = () => {
  return (
    <Routes>
      {publicRoutes.map((route, idx) => (
        <Route
          path={route.path}
          element={<PublicLayout>{route.element}</PublicLayout>}
          key={idx}
        />
      ))}
      {authProtectedRoutes.map((route, idx) => (
        <Route
          path={route.path}
          element={<AuthLayout>{route.element}</AuthLayout>}
          key={idx}
        />
      ))}
    </Routes>
  );
};

export default App;

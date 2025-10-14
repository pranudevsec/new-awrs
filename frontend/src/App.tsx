import { Route, Routes } from "react-router";
import { publicRoutes, authProtectedRoutes } from "./routing";
import AuthLayout from "./layouts/AuthLayout";
import PublicLayout from "./layouts/PublicLayout";

const App = () => {
  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route
          path={route.path}
          element={<PublicLayout>{route.element}</PublicLayout>}
          key={route.path}
        />
      ))}
      {authProtectedRoutes.map((route) => (
        <Route
          path={route.path}
          element={<AuthLayout>{route.element}</AuthLayout>}
          key={route.path}
        />
      ))}
    </Routes>
  );
};

export default App;

import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <main className="main-centered-content" style={{ minHeight: "100vh", background: "#fcfdff" }}>
      <Outlet />
    </main>
  );
}

export default AuthLayout;
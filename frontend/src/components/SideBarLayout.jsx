// frontend/src/components/SidebarLayout.jsx
import React from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const SidebarLayout = () => {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();

  const handleLogout = () => {
    localStorage.removeItem("token");
    clearUser();
    navigate("/login");
  };
  console.log(user);
  const isAdmin = user?.role?.name === "Admin";

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Menu</h2>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/predict">Predict</Link></li>
          {isAdmin && <li><Link to="/dataset">Dataset</Link></li>}
          {isAdmin && <li><Link to="/users">User Management</Link></li>}
          {isAdmin && <li><Link to="/report/history">All Reports</Link></li>}
          <li><button onClick={handleLogout}>Logout</button></li>
        </ul>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;
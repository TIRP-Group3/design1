// frontend/src/components/SidebarLayout.jsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";

const SidebarLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Menu</h2>
        <ul>
          <li><a href="/">Home</a></li>
          {/* Add more links as needed */}
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

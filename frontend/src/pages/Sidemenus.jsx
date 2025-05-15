// frontend/src/components/SidebarLayout.jsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
const SidebarLayout = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role"); // Store the user role in localStorage
    navigate("/login");
  };
  const userRole= localStorage.getItem("role");
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Menu</h2>
        <ul>
          <li><Link to="/">Home</Link></li>
          {userRole === "Admin" && (
            <li><Link to="/predict">Predict</Link></li>
          )}
          {userRole === "Admin" && (
            <li><Link to="/dataset">Dataset</Link></li>
          )}
          {userRole === "Admin" && (
            <li><Link to="/dataset">User management</Link></li>
          )}
      
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

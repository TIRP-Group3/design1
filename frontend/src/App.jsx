// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home"; 
import ProtectedRoute from "./pages/ProtectedRoute";
import Sidemenus from "./pages/Sidemenus"; //Side menus
import "./App.css"; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Sidemenus />}>
            <Route path="/" element={<Home />} />
            {/* Future protected routes go here */}
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

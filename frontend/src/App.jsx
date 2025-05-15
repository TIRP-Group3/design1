// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home"; 
import Dataset from "./pages/Dataset"; 
import Predict from "./pages/Predict"; 
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
            <Route path="/dataset" element={<Dataset />} />
            <Route path="/predict" element={<Predict />} />
            {/* Future protected routes go here */}
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

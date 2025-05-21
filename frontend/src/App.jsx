// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home"; 
import Dataset from "./pages/Dataset"; 
import Predict from "./pages/Predict"; 
import ScanReport from "./pages/ScanReport"; 
import ReportHistory from "./pages/ReportHistory"; 
import UserManagement from "./pages/UserManagement"; 
import ProtectedRoute from "./pages/ProtectedRoute";
import PublicScan from "./pages/PublicScan";
import ScanReportPublic from "./pages/ScanReportPublic";
import SideBarLayout from "./components/SideBarLayout.jsx"; //Side menus
import "./App.css"; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/public-scan" element={<PublicScan />} />
        <Route path="/report-public/:sessionId" element={<ScanReportPublic />} />
        {/* Protected Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<SideBarLayout />}>
            
            <Route path="/report/:sessionId" element={<ScanReport />} />
            <Route path="/" element={<Home />} />
            <Route path="/dataset" element={<Dataset />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/report/history" element={<ReportHistory />} />
            <Route path="/users" element={<UserManagement />} />
            {/* Future protected routes go here */}
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

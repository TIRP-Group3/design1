import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
} from "@mui/material";
import api from "../api";
import ScanForm from "../components/ScanForm";
import ScanHistory from "../components/ScanHistory";
import { useNavigate } from "react-router-dom"; 
export default function FilePredictor() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);

  const fetchSessions = async () => {
    try {
      const response = await api.get("/datasets/prediction-sessions");
      setSessions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch scan sessions", error);
    }
  };
  const navigate = useNavigate(); 
  useEffect(() => {
    fetchSessions();
  }, []);

  const handleFileUpload = async (file,modelId) => {
    console.log("Selected file:", file);
    console.log("Selected file:", modelId);
     if (!file || file.type !== "text/csv") {
        alert("Please upload a valid CSV file.");
        return;
      }

      if (!modelId) {
        alert("Please select a model.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("model_id", modelId);

    try {
      
    setLoading(true);
      const response = await api.post("/datasets/predict-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResults(response.data.results || []);
      fetchSessions();
      if (response.data.session_id) {
        navigate(`/report/${response.data.session_id}`); 
      }
    } catch (error) {
      alert(error.response?.data?.detail || error.message || "Failed to get prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Malware CSV Scanner
      </Typography>

      <ScanForm onUpload={handleFileUpload} />

      {loading && <LinearProgress sx={{ mt: 2 }} />}

      <ScanHistory sessions={sessions} />
    </Box>
  );
}

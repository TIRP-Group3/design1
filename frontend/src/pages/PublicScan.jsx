import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
} from "@mui/material";
import api from "../api";
import ScanForm from "../components/ScanForm";
import { useNavigate } from "react-router-dom"; 
export default function FilePredictor() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);


  const navigate = useNavigate(); 

  const handleFileUpload = async (file,modelId) => {
    
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
      const response = await api.post("/datasets/predict-file-public", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResults(response.data.results || []);
      if (response.data.session_id) {
        navigate(`/report-public/${response.data.session_id}`); 
      }
    } catch (error) {
      alert(error.response?.data?.detail || error.message || "Failed to get prediction");
    } finally {
      setLoading(false);
    }
  };

    return (
    <Box sx={{ position: "relative", minHeight: "100vh", px: 2, pt: 2 }}>
        {/* Top-right login button */}
        <Box sx={{ position: "absolute", top: 16, right: 24 }}>
        <button
            onClick={() => navigate("/login")}
            style={{
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 600
            }}
        >
            Login
        </button>
        </Box>

        <Box sx={{ maxWidth: 900, mx: "auto", mt: 8 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
            Malware CSV Scanner
        </Typography>

        <ScanForm onUpload={handleFileUpload} />

        {/* 🔄 Loading animation */}
        {loading && <LinearProgress sx={{ mt: 2 }} />}

        {results.length > 0 && (
            <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
                Scan Results
            </Typography>
            {results.map(({ filename, prediction, probabilities }, index) => (
                <Paper key={index} variant="outlined" sx={{ mt: 2, p: 2 }}>
                <Typography><strong>Filename:</strong> {filename}</Typography>
                <Typography><strong>Prediction:</strong> {prediction}</Typography>
                <Box mt={1}>
                    {Object.entries(probabilities || {}).map(([label, prob]) => (
                    <Typography key={label}>{label}: {(prob * 100).toFixed(1)}%</Typography>
                    ))}
                </Box>
                </Paper>
            ))}
            </Box>
        )}
        </Box>
    </Box>
    );

}

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

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleFileUpload = async (files) => {
    if (files.length === 0) return;
    setLoading(true);
    setResults([]);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await api.post("/datasets/predict-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResults(response.data.results || []);
      fetchSessions();
    } catch (error) {
      alert(error.response?.data?.detail || error.message || "Failed to get prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Malware File Scanner
      </Typography>

      <ScanForm onUpload={handleFileUpload} />

      {loading && <LinearProgress sx={{ mt: 2 }} />}

      {results.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Scan Results
          </Typography>
          {results.map(({ filename, prediction, probabilities }) => (
            <Paper key={filename} variant="outlined" sx={{ mt: 3, p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {filename}
              </Typography>
              <Typography variant="body1">
                Prediction: <strong>{prediction}</strong>
              </Typography>
              <Box mt={2}>
                {probabilities &&
                  Object.entries(probabilities).map(([label, prob]) => (
                    <Box key={label} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {label} ({(prob * 100).toFixed(1)}%)
                      </Typography>
                      <LinearProgress variant="determinate" value={prob * 100} />
                    </Box>
                  ))}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <ScanHistory sessions={sessions} />
    </Box>
  );
}

import React, { useState } from "react";
import axios from "axios";
import { Box, Button, LinearProgress, Typography, Paper, Stack,  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow } from "@mui/material";

import api from "../api"; // Import your api.js
export default function FilePredictor() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  //History
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await api.get("/datasets/prediction-history");
      setHistory(response.data || []);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };
  //end of history

  React.useEffect(() => {
    fetchHistory();
  }, []);
  
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setResults([]);
  };

  const handleUpload = async () => {
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
    } catch (error) {
      alert(error.response?.data?.detail || error.message || "Failed to get prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4, p: 2 }}>
     <Typography variant="h5" fontWeight="bold" gutterBottom>
        Malware File Scanner
      </Typography>

      <Stack spacing={2} mb={3}>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
        />
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={loading || files.length === 0}
        >
          {loading ? "Scanning..." : "Scan Files"}
        </Button>
      </Stack>

      {results.length > 0 && (
        <Typography variant="h6" sx={{ mt: 2 }}>
          Scan Results:
        </Typography>
      )}

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

      {history.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Scan History
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Filename</strong></TableCell>
                  <TableCell><strong>Prediction</strong></TableCell>
                  <TableCell><strong>Probabilities</strong></TableCell>
                  <TableCell><strong>Scanned At</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id || `${entry.filename}-${entry.scanned_at}`}>
                    <TableCell>{entry.filename}</TableCell>
                    <TableCell>{entry.prediction}</TableCell>
                    <TableCell>
                      {entry.probabilities &&
                        Object.entries(entry.probabilities)
                          .map(([label, prob]) => `${label}: ${(prob * 100).toFixed(1)}%`)
                          .join(" | ")
                      }
                    </TableCell>

                    <TableCell>
                      {new Date(entry.scanned_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}


    </Box>
  );
}

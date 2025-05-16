import React, { useEffect, useState } from "react";
import api from "../api"; // Import the API file to make requests
import axios from 'axios';

import { Box, Button, Typography, Paper, Stack, Table,
  CircularProgress ,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip } from "@mui/material";

const Dataset = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [result, setResult] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/datasets/training-sessions");
      const sorted = res.data.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
      setSessions(sorted);
    } catch (err) {
      console.error("Failed to load training sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleUpload = async () => {
    if (!csvFile) {
      alert("Please select a CSV file first.");
      return;
    }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const response = await api.post('/datasets/upload', formData);
      setResult(response.data.accuracy);
      alert('Model trained successfully! Accuracy: ' + response.data.accuracy + '%');
      fetchSessions(); // Refresh table after upload
    } catch (error) {
      alert('Upload failed: ' + error.response?.data?.detail || error.message);
    }
  };

  return (
  <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
       <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dataset Upload
      </Typography>

      <Stack spacing={2}>
        <Typography variant="h6" gutterBottom>
          Upload Files for Training Model
        </Typography>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setCsvFile(e.target.files[0])}
          style={{ marginTop: 8 }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!csvFile}
        >
          Upload & Train
        </Button>

        {result !== null && (
          <Typography variant="h6" mt={2}>
            Model Accuracy: <strong>{result}%</strong>
          </Typography>
        )}
      </Stack>

      <Box mt={6}>
        <Typography variant="h6" gutterBottom>
          Training History
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Filename</strong></TableCell>
                  <TableCell><strong>Accuracy</strong></TableCell>
                  <TableCell><strong>Uploaded By</strong></TableCell>
                  <TableCell><strong>Uploaded At</strong></TableCell>
                  <TableCell><strong>Active</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((s, index) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>{s.filename}</TableCell>
                    <TableCell>{s.accuracy?.toFixed(2)}%</TableCell>
                    <TableCell>{s.uploaded_by || "Unknown"}</TableCell>
                    <TableCell>{new Date(s.uploaded_at).toLocaleString()}</TableCell>
                    <TableCell>
                      {index === 0 ? (
                        <Chip label="Current" color="success" size="small" />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default Dataset;

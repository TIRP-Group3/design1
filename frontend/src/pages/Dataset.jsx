import React, { useEffect, useState } from "react";
import api from "../api"; // Import the API file to make requests
import axios from 'axios';

import { Box, Button, Typography, Paper, Stack } from "@mui/material";
const Dataset = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!csvFile) {
      alert("Please select a CSV file first.");
      return;
    }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      // Send the CSV to the backend for training
      const response = await api.post('/datasets/upload', formData);
      // Display the accuracy result returned by the backend
      setResult(response.data.accuracy);
      alert('Model trained successfully! Accuracy: ' + response.data.accuracy + '%');
    } catch (error) {
      alert('Upload failed: ' + error.response?.data?.detail || error.message);
    }
  };

  return (
  <Box sx={{ maxWidth: 600, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Dataset Upload
      </Typography>

      <Stack spacing={2}>
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
    </Box>
  );
};

export default Dataset;

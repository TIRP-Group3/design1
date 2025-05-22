import React, { useState, useEffect } from "react";
import { Box, Button, Stack, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

import api from "../api";
const ScanForm = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await api.get("/datasets/trained-models");
          if (response.data.length > 0) {
            setModels(response.data);
            setSelectedModel(response.data[0].id); // Select the first one (most recent if API is ordered)
          }
      } catch (err) {
        console.error("Failed to load models", err);
      }
    };
    fetchModels();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log("Selected file:", selectedFile);
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid CSV file.");
      e.target.value = null; // reset file input
      setFile(null);
    }
  };

  const handleUploadClick = () => {
    if (file) {
      console.log("Uploading file:", file);
      console.log("Selected model:", selectedModel);
      onUpload(file, selectedModel);

    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload CSV for Malware Prediction
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Select Model</InputLabel>
        <Select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          label="Select Model"
        >
          {models.map((model) => (
            <MenuItem key={model.id} value={model.id}>
              {model.version}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Stack spacing={2}>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <Button variant="contained" onClick={handleUploadClick} disabled={!file}>
          Predict from CSV
        </Button>
      </Stack>
    </Box>
  );
};

export default ScanForm;

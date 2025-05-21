import React, { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

const ScanForm = ({ onUpload }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
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
      onUpload([file]); // keeping it an array to match existing `onUpload` usage
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload CSV for Malware Prediction
      </Typography>
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

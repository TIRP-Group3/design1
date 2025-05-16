import React, { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

const ScanForm = ({ onUpload }) => {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUploadClick = () => {
    onUpload(files);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload Files for Malware Scan
      </Typography>
      <Stack spacing={2}>
        <input type="file" multiple onChange={handleFileChange} />
        <Button variant="contained" onClick={handleUploadClick} disabled={files.length === 0}>
          Scan Files
        </Button>
      </Stack>
    </Box>
  );
};
export default ScanForm;
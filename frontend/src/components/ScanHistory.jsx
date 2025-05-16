import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const ScanHistory = ({ sessions }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h6" gutterBottom>
        Scan History 
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Session #</strong></TableCell>
              <TableCell><strong>Scanned At</strong></TableCell>
              <TableCell><strong>File Count</strong></TableCell>
              <TableCell><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.session_id}>
                <TableCell>{session.session_id}</TableCell>
                <TableCell>{new Date(session.scanned_at).toLocaleString()}</TableCell>
                <TableCell>{session.file_count}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/report/${session.session_id}`)}
                  >
                    View Report
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ScanHistory;
// src/pages/ReportHistory.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function ReportHistory() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role.name !== "Admin") {
      navigate("/");
      return;
    }
    api.get("/datasets/prediction-history")
      .then((res) => setHistory(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user || loading || !history) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        All Report History
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>#</strong></TableCell>
              <TableCell><strong>Filename</strong></TableCell>
              <TableCell><strong>Prediction</strong></TableCell>
              <TableCell><strong>Scanned At</strong></TableCell>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Session</strong></TableCell>
              <TableCell><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((entry, idx) => (
              <TableRow key={entry.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{entry.filename}</TableCell>
                <TableCell>
                  <Chip label={entry.prediction} size="small" color="primary" />
                </TableCell>
                <TableCell>{new Date(entry.scanned_at).toLocaleString()}</TableCell>
                <TableCell>{entry.user?.username || "-"}</TableCell>
                <TableCell>#{entry.session_id}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/report/${entry.session_id}`)}
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
}

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
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function ReportHistory() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role.name !== "Admin") {
      navigate("/");
      return;
    }
    api.get("/datasets/prediction-sessions")
      .then((res) => setSessions(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user || loading || !sessions) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        All Scan Sessions
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>#</strong></TableCell>
              <TableCell><strong>Session ID</strong></TableCell>
              <TableCell><strong>Scanned By</strong></TableCell>
              <TableCell><strong>File Count</strong></TableCell>
              <TableCell><strong>Scanned At</strong></TableCell>
              <TableCell><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s, idx) => (
              <TableRow key={s.session_id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>#{s.session_id}</TableCell>
                <TableCell>{s.user?.username || "Unknown"}</TableCell>
                <TableCell>{s.file_count}</TableCell>
                <TableCell>{new Date(s.scanned_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/report/${s.session_id}`)}
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

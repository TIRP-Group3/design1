// src/pages/UserManagement.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert
} from "@mui/material";
export default function UserManagement() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (!user) return;
    if (user.role.name !== "Admin") {
      navigate("/");
      return;
    }
    api.get("/users/all",{
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/update-role/${userId}?role_name=${newRole}`);
      setUsers(users.map(u => u.id === userId ? { ...u, role: { ...u.role, name: newRole } } : u));
      setFeedback({ open: true, message: "Role updated", severity: "success" });
    } catch (error) {
      setFeedback({ open: true, message: "Failed to update role", severity: "error" });
    }
  };

  if (loading || !users) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box  sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h4" gutterBottom>User Management</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>#</strong></TableCell>
              <TableCell><strong>Username</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u, idx) => (
              <TableRow key={u.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={u.role.name}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <MenuItem value="Admin">Admin</MenuItem>
                      <MenuItem value="User">User</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={feedback.open}
        autoHideDuration={3000}
        onClose={() => setFeedback({ ...feedback, open: false })}
      >
        <Alert onClose={() => setFeedback({ ...feedback, open: false })} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { Box, Button, TextField, Typography, Paper, Alert } from "@mui/material";
import { useAuthStore } from "../store/useAuthStore";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/users/login", { username, password });
      const { token } = response.data;
      localStorage.setItem("token", token);

      const userRes = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userRes.data);

      navigate("/");
    } catch (error) {
      console.log(error);
      setError("Invalid credentials");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
      <Paper elevation={3} sx={{ padding: 4, width: 400 }}>
        <Typography variant="h4" gutterBottom align="center">
          Welcome Back
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          Please log in to continue
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Login
          </Button>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </form>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Login;

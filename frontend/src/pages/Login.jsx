// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import api from "../api"; // Import your api.js

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/users/login", { username, password });
      const { token } = response.data;
      localStorage.setItem("token", token);  // Save the token
      navigate("/"); // Navigate to the home page after login
    } catch (error) {
      setError("Invalid credentials");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
  
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {error && <div>{error}</div>}
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
}

export default Login;

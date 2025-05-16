// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';
import PieChartWithLegend from "../components/PieChartWithLegend";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await api.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchUserData();
    fetchDashboardData();
  }, []);

  if (!user || !dashboardData) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      <Typography variant="h4" textAlign="center" mb={1}>
        Welcome back, {user.username}!
      </Typography>
      <Typography variant="body1" textAlign="center" mb={4}>
        Email: {user.email} | Role: {user.role.name}
      </Typography>

      <Grid container spacing={2} justifyContent="center" mb={4}>
        {[{
          label: "# Users",
          value: dashboardData.usersCount,
          color: "primary",
        }, {
          label: "# Scans",
          value: dashboardData.scansCount,
          color: "success",
        }, {
          label: "# Threats",
          value: dashboardData.threatsCount,
          color: "warning",
        }, {
          label: "# Threats Today",
          value: dashboardData.threatsToday,
          color: "error",
        }].map(({ label, value, color }) => (
          <Grid key={label} item xs={6} sm={4} md={3} lg={2}>
            <Paper
              sx={{ p: 2, textAlign: "center", borderRadius: 2 }}
              elevation={3}
            >
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                {label}
              </Typography>
              <Typography variant="h4" color={`${color}.main`}>
                {value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" mb={2}>
              Threat Graph
            </Typography>
            <MuiLineChart
              xAxis={[{ scaleType: 'point', data: dashboardData.threatGraphData.map((d) => d.name) }]}
              series={[{
                data: dashboardData.threatGraphData.map((d) => d.threats),
                color: '#1976d2',
                label: 'Threats'
              }]}
              height={250}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <PieChartWithLegend title="Risk Breakdown" data={dashboardData.riskData} />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <PieChartWithLegend title="Threat Types" data={dashboardData.typeData} />
        </Grid>
      </Grid>

      <Box mt={5} display="flex" justifyContent="center">
        <Button variant="contained" onClick={() => navigate("/report/history")}>View All Reports</Button>
      </Box>
    </Box>
  );
};

export default Home;
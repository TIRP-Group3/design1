import React, { useEffect, useState } from "react";
import api from "../api";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
} from "recharts";
import { PieChart as MuiPieChart } from "@mui/x-charts/PieChart";

const COLORS = ["#FFD700", "#FF8C00", "#FF4500"]; // gold, dark orange, red

const Home = () => {
  const [user, setUser] = useState(null);

  const [dashboardData] = useState({
    usersCount: 85,
    scansCount: 235,
    threatsCount: 115,
    threatsToday: 15,
    threatGraphData: [
      { name: "2 Months Ago", threats: 10 },
      { name: "Last Month", threats: 30 },
      { name: "This Month", threats: 23 },
    ],
    riskData: [
      { name: "Low", value: 25, color: "#FFD700" },
      { name: "Medium", value: 55, color: "#FF8C00" },
      { name: "High", value: 20,  color: "#FF4500" },
    ],
    typeData: [
      { name: "Trojan", value: 25, color: "blue" },
      { name: "Adware", value: 55, color: "lightblue" },
      { name: "Spyware", value: 20, color: "purple" },
    ],
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, redirecting to login...");
          return;
        }
        const response = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  if (!user) {
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" textAlign="center" mb={3}>
        Welcome back, {user.username}!
      </Typography>
      <Typography variant="body1" textAlign="center" mb={5}>
        Email: {user.email} | Role: {user.role.name}
      </Typography>

      <Grid container spacing={2} justifyContent="center" mb={4}>
        {[
          { label: "# Users", value: dashboardData.usersCount, color: "primary" },
          { label: "# Scans", value: dashboardData.scansCount, color: "success" },
          { label: "# Threats", value: dashboardData.threatsCount, color: "warning" },
          { label: "# Threats Today", value: dashboardData.threatsToday, color: "error" },
        ].map(({ label, value, color }) => (
          <Grid key={label} item xs={6} sm={3} md={2}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                bgcolor: `${color}.lighter` || "grey.100",
                borderRadius: 2,
              }}
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
        {/* Threat Graph */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" mb={2}>
              Threat Graph
            </Typography>
            <ResponsiveContainer width={400} height={250}>
              <LineChart data={dashboardData.threatGraphData}>
                <XAxis
                  dataKey="name" 
                  interval={0}            // Show all labels, no skipping
                  tickMargin={15}         // Space between axis line and labels
                  minTickGap={30}         // Minimum pixel gap between ticks (default is 10)
                  angle={0} 
                />
                <YAxis />
                <RechartsTooltip />
                <RechartsLegend />
                <Line type="monotone" dataKey="threats" stroke="#1976d2" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Risk Pie Chart (MUI X) */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" mb={2}>
              Risk
            </Typography>
            <div style={{ width: "100%", height: 250 }}>
              <MuiPieChart
                series={[
                  {
                    type: "pie",
                    data: dashboardData.riskData.map((item, index) => ({
                      category: item.name,
                      value: item.value,
                      color: COLORS[index % COLORS.length],
                    })),
                    angleField: "value",
                    colorField: "category",
                    label: {
                      visible: true,
                      formatter: (item) => `${item.category}: ${item.value}`,
                    },
                  },
                ]}
                tooltip={{ visible: true }}
              />
            </div>
            {/* Custom Legend */}
            <Box mt={2}>
              {dashboardData.riskData.map((entry, index) => (
                <Box key={entry.name} display="flex" alignItems="center" mb={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: COLORS[index % COLORS.length],
                      borderRadius: "4px",
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">{entry.name}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        {/* Type Pie Chart (MUI X) */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" mb={2}>
              Type
            </Typography>
            <div style={{ width: "100%", height: 250 }}>
              <MuiPieChart
                series={[
                  {
                    type: "pie",
                    data: dashboardData.typeData.map((item, index) => ({
                      category: item.name,
                      value: item.value,
                      color: item.color,
                    })),
                    angleField: "value",
                    colorField: "category",
                    label: {
                      visible: true,
                      formatter: (item) => `${item.category}: ${item.value}`,
                    },
                  },
                ]}
                tooltip={{ visible: true }}
              />
            </div>
            {/* Custom Legend */}
            <Box mt={2}>
              {dashboardData.typeData.map((entry, index) => (
                <Box key={entry.name} display="flex" alignItems="center" mb={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: entry.color,
                      borderRadius: "4px",
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">{entry.name}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>


        
      </Grid>
    </Box>
  );
};

export default Home;

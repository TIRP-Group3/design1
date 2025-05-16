import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { PieChart as MuiPieChart } from "@mui/x-charts/PieChart";

const PieChartWithLegend = ({ title, data }) => (
  <Paper sx={{ p: 2, flex: 1 }}>
    <Typography variant="subtitle1" mb={2}>
      {title}
    </Typography>
    <div style={{ width: "100%", height: 178 }}>
      <MuiPieChart
        series={[
          {
            type: "pie",
            data: data.map((item) => ({
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
    <Box mt={2}>
      {data.map((entry) => (
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
);

export default PieChartWithLegend;
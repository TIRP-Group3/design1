// src/pages/ScanReport.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
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
  Divider,
  Stack,
  Button
} from "@mui/material";
import api from "../api";
import PieChartWithLegend from "../components/PieChartWithLegend";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const RISK_COLOR_MAP = {
  High: "#FF4500",
  Medium: "#FF8C00",
  Low: "#FFD700"
};

const THREAT_COLOR_MAP = {
  trojan: "#3f51b5",
  adware: "#2196f3",
  spyware: "#9c27b0",
  ransomware: "#4caf50",
  default: "#90a4ae"
};

const getSeverity = (prediction) => {
  const type = prediction.toLowerCase();
  if (["ransomware", "trojan", "worm"].includes(type)) return "High";
  if (["spyware", "keylogger"].includes(type)) return "Medium";
  if (["adware", "pup", "tracking"].includes(type)) return "Low";
  return "None";
};

const getRecommendation = (prediction) => {
  const type = prediction.toLowerCase();
  if (["ransomware", "trojan"].includes(type)) return "Immediate quarantine and deep scan";
  if (["spyware", "keylogger"].includes(type)) return "Quarantine and change passwords";
  if (["adware", "pup"].includes(type)) return "Remove with anti-adware tool";
  return "No action needed";
};

export default function ScanReport() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  useEffect(() => {
    api.get(`/datasets/scan-session/${sessionId}`)
      .then((res) => setSession(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleDownload = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`scan_report_session_${sessionId}.pdf`);
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  if (!session) return <Typography>Error loading report</Typography>;

  const files = session.files;
  const riskCounts = { Low: 0, Medium: 0, High: 0 };
  const threatCounts = {};

  files.forEach((f) => {
    const severity = getSeverity(f.prediction);
    riskCounts[severity]++;
    threatCounts[f.prediction] = (threatCounts[f.prediction] || 0) + 1;
  });

  const riskChartData = Object.entries(riskCounts).map(([name, value]) => ({
    name,
    value,
    color: RISK_COLOR_MAP[name] || "#999"
  }));

  const typeChartData = Object.entries(threatCounts).map(([name, value]) => ({
    name,
    value,
    color: THREAT_COLOR_MAP[name.toLowerCase()] || THREAT_COLOR_MAP.default
  }));

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold">
          Scan Report – Session #{session.session_id}
        </Typography>
        <Button variant="outlined" onClick={handleDownload}>
          Download PDF
        </Button>
      </Box>

      <Box ref={reportRef}>
        <Stack spacing={1} alignItems="center" mb={3}>
          <Typography variant="body1">
            Scanned At: {new Date(session.scanned_at).toLocaleString()}
          </Typography>
          {session.user && (
            <Typography variant="body2">
              Scanned by: {session.user.username} ({session.user.email})
            </Typography>
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", gap: 4, my: 3, flexWrap: "wrap", justifyContent: "center" }}>
          <PieChartWithLegend title="Risk Breakdown" data={riskChartData} />
          <PieChartWithLegend title="Threat Types" data={typeChartData} />
        </Box>

        <Typography variant="h6" gutterBottom textAlign="center">
          Scanned Files
        </Typography>

        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>#</strong></TableCell>
                <TableCell><strong>Filename</strong></TableCell>
                <TableCell><strong>Threat Type</strong></TableCell>
                <TableCell><strong>Severity</strong></TableCell>
                <TableCell><strong>Recommendation</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file, idx) => {
                const severity = getSeverity(file.prediction);
                const predColor = THREAT_COLOR_MAP[file.prediction.toLowerCase()] || THREAT_COLOR_MAP.default;
                return (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{file.filename}</TableCell>
                    <TableCell>
                      <Chip
                        label={file.prediction}
                        sx={{ backgroundColor: predColor, color: "#fff", fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={severity}
                        sx={{ backgroundColor: RISK_COLOR_MAP[severity] || "#ccc", color: "#000", fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>{getRecommendation(file.prediction)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

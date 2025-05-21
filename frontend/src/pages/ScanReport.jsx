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

// ✅ Severity color map
export const RISK_COLOR_MAP = {
  High: "#FFCDD2",    // light pink
  Medium: "#FFE082",  // soft orange
  None: "#E0E0E0"     // neutral grey
};

// ✅ Threat type color map
export const THREAT_COLOR_MAP = {
  trojan: "#B71C1C",       // red
  ransomware: "#D84315",   // dark orange
  worm: "#FF6F00",         // bright orange
  virus: "#C62828",        // red-orange
  benign: "#9E9E9E",       // grey
  default: "#90A4AE"
};

// ✅ Severity logic
export const getSeverity = (prediction) => {
  const type = prediction?.toLowerCase();
  if (["trojan", "ransomware", "worm"].includes(type)) return "High";
  if (["virus"].includes(type)) return "Medium";
  if (["benign"].includes(type)) return "None";
  return "None";
};

// ✅ Recommendation logic
export const getRecommendation = (prediction) => {
  const type = prediction?.toLowerCase();

  if (["trojan", "ransomware"].includes(type)) {
    return "⚠️ Immediate quarantine and full system scan";
  }

  if (["worm"].includes(type)) {
    return "⚠️ Isolate device from network and scan";
  }

  if (["virus"].includes(type)) {
    return "🛡️ Scan and monitor system for abnormalities";
  }

  if (["benign"].includes(type)) {
    return "✅ No action needed";
  }

  return "ℹ️ Unknown prediction – review manually";
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

  const handleDownloadPDF = async () => {
    const element = reportRef.current;
    await new Promise((resolve) => setTimeout(resolve, 500));
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`scan_report_session_${sessionId}.pdf`);
  };

  const handleDownloadCSV = () => {
    if (!session || !session.files) return;
    const headers = ["Filename", "Threat Type", "Severity", "Recommendation", "Probabilities"];
    const rows = session.files.map(file => [
      file.filename,
      file.prediction,
      getSeverity(file.prediction),
      getRecommendation(file.prediction),
      Object.entries(file.probabilities || {})
        .map(([label, prob]) => `${label}: ${(prob * 100).toFixed(1)}%`).join(" | ")
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `scan_report_session_${sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  }

  if (!session) {
    return <Typography>Error loading report</Typography>;
  }

  const files = session.files;

  const riskCounts = { High: 0, Medium: 0, None: 0 };
  const threatCounts = {};

  files.forEach((f) => {
    const severity = getSeverity(f.prediction);
    riskCounts[severity]++;
    const threat = f.prediction.toLowerCase();
    threatCounts[threat] = (threatCounts[threat] || 0) + 1;
  });

  const riskChartData = Object.entries(riskCounts).map(([name, value]) => ({
    name,
    value,
    color: RISK_COLOR_MAP[name] || "#999"
  }));

  const typeChartData = Object.entries(threatCounts).map(([name, value]) => ({
    name,
    value,
    color: THREAT_COLOR_MAP[name] || THREAT_COLOR_MAP.default
  }));

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold">
          Scan Report – Session #{session.session_id}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={handleDownloadPDF}>Download PDF</Button>
          <Button variant="outlined" onClick={handleDownloadCSV}>Download CSV</Button>
        </Stack>
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
                <TableCell><strong>Probabilities</strong></TableCell>
                <TableCell><strong>Severity</strong></TableCell>
                <TableCell><strong>Recommendation</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file, idx) => {
                const severity = getSeverity(file.prediction);
                const predColor = THREAT_COLOR_MAP[file.prediction.toLowerCase()] || THREAT_COLOR_MAP.default;
                const probabilityText = file.probabilities
                  ? Object.entries(file.probabilities)
                      .map(([label, prob]) => `${label}: ${(prob * 100).toFixed(1)}%`)
                      .join(" | ")
                  : "N/A";

                return (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{file.filename}</TableCell>
                    <TableCell>
                      <Chip
                        label={file.prediction}
                        sx={{
                          backgroundColor: predColor,
                          color: predColor === "#9E9E9E" ? "#000" : "#fff",
                          fontWeight: "bold"
                        }}
                      />
                    </TableCell>
                    <TableCell>{probabilityText}</TableCell>
                    <TableCell>
                      <Chip
                        label={severity}
                        sx={{
                          backgroundColor: RISK_COLOR_MAP[severity] || "#ccc",
                          color: "#000",
                          fontWeight: 500
                        }}
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

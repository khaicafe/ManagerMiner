import React, { useEffect, useState } from "react";
import { getAllMiners } from "../services/api";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";

const MinersScreen = () => {
  const [miners, setMiners] = useState([]);

  useEffect(() => {
    const fetchMiners = async () => {
      try {
        const res = await getAllMiners();
        // Add id property for DataGrid
        const minersWithId = res.data?.map((item, index) => ({
          id: index + 1,
          ...item,
        }));
        setMiners(minersWithId);
      } catch (error) {
        console.error("Error fetching miners:", error);
      }
    };

    fetchMiners();
  }, []);

  const columns = [
    { field: "deviceID", headerName: "Device ID", width: 120 },
    { field: "Status", headerName: "status", width: 150 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "ip", headerName: "IP", width: 150 },
    { field: "hashrate", headerName: "Hashrate", width: 130 },
    { field: "threads", headerName: "Threads", width: 100 },
    { field: "temperature", headerName: "Temp (°C)", width: 120 },
    { field: "uptime", headerName: "Uptime (s)", width: 130 },
    { field: "platform", headerName: "Platform", width: 130 },
    { field: "last_log", headerName: "Last Log", width: 200 },
    { field: "cpu_model", headerName: "CPU Model", width: 180 },
    { field: "cpu_usage", headerName: "CPU Usage (%)", width: 150 },
  ];

  return (
    <Box sx={{ height: 600, width: "100%", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Miners
      </Typography>
      <DataGrid
        rows={miners}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5, 10, 20]}
        disableSelectionOnClick
      />
    </Box>
  );
};

export default MinersScreen;

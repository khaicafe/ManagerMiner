import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import useMinerStore from "../store/useMinerStore";
import dayjs from "dayjs";

export default function Dashboard() {
  const { miners, fetchMiners } = useMinerStore();
  const [rxThreads, setRxThreads] = useState([0, 2, 4]);
  const [priority, setPriority] = useState(5);
  const [background, setBackground] = useState(true);

  const handleUpdateConfig = async () => {
    await axios.post("/api/config/update", {
      rx_threads: rxThreads,
      priority,
      background,
    });
    alert("Cấu hình đã cập nhật, vui lòng khởi động lại XMRig.");
  };

  useEffect(() => {
    fetchMiners(); // Lần đầu load

    const interval = setInterval(() => {
      fetchMiners(); // Load lại mỗi 60s
    }, 60000); // 60000 ms = 60 giây

    return () => clearInterval(interval); // Xoá interval khi unmount
  }, []);

  const columns = [
    { field: "ID", headerName: "ID", width: 80 },
    { field: "name", headerName: "Name" },
    { field: "ip", headerName: "IP Address" },
    { field: "platform", headerName: "platform" },
    { field: "hashrate", headerName: "Hashrate (H/s)", width: 150 },
    { field: "temperature", headerName: "Temp (°C)", width: 130 },
    {
      field: "cpu_usage",
      headerName: "CPU Usage (%)",
      width: 130,
      valueFormatter: (params) => (params ? `${params.toFixed(2)}%` : "N/A"),
    },

    { field: "uptime", headerName: "Uptime (s)", width: 120 },
    { field: "last_log", headerName: "Last Accepted", width: 400 },
    {
      field: "reported_at",
      headerName: "Reported At",
      width: 80,
      valueGetter: (params) =>
        params?.row?.reported_at
          ? dayjs(params.row.reported_at).format("HH:mm:ss DD/MM/YYYY")
          : "N/A",
    },
    { field: "status", headerName: "Status", width: 80 },
  ];

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Monero Miner Dashboard
      </Typography>
      <DataGrid
        rows={Array.isArray(miners) ? miners : []}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        disableSelectionOnClick
        // onRowClick={(params) => console.log("ROW:", params.row)} // 👈 debug
        getRowId={(row) => row.ID || `${row.name}-${row.reported_at}`}
      />
    </div>
  );
}

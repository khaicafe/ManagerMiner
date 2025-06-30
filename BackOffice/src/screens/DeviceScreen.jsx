import React, { useEffect, useState } from "react";
import {
  getAllMiners,
  getPools,
  getWallets,
  updateMiner,
  startMining,
  stopMining,
} from "../services/api";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from "@mui/material";
import isEqual from "lodash/isEqual";
import { Chip, Tooltip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MiningIcon from "@mui/icons-material/Whatshot";
import StopIcon from "@mui/icons-material/Stop";

const MinersScreen = () => {
  const [miners, setMiners] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [editModal, setEditModal] = useState(false);
  const [pools, setPools] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedPool, setSelectedPool] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [maxThreadsHint, setMaxThreadsHint] = useState(50);

  // Load miners
  const refreshMiners = async () => {
    try {
      const res = await getAllMiners();
      const minersWithId = res.data?.map((item) => ({
        id: item.ID,
        ...item,
      }));

      if (!isEqual(minersWithId, miners)) {
        setMiners(minersWithId);
        console.log("✅ Updated miners data", minersWithId);
      } else {
        console.log("⚠️ No changes in miners data");
      }
    } catch (error) {
      console.error("Error fetching miners:", error);
    }
  };

  useEffect(() => {
    refreshMiners();
    const interval = setInterval(() => refreshMiners(), 10000);
    return () => clearInterval(interval);
  }, []);

  const openEditModal = async () => {
    try {
      const [poolRes, walletRes] = await Promise.all([
        getPools(),
        getWallets(),
      ]);
      setPools(poolRes.data);
      setWallets(walletRes.data);
      setEditModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedPool || !selectedWallet) {
        alert("Please select both pool and wallet.");
        return;
      }

      const selectedMiners = miners.filter((m) => selectedIds.includes(m.id));

      const payload = selectedMiners.map((miner) => ({
        id: miner.id,
        pool_url: pools.find((p) => p.ID === selectedPool)?.url || "",
        pool_port: pools.find((p) => p.ID === selectedPool)?.port || 0,
        wallet_address:
          wallets.find((w) => w.ID === selectedWallet)?.address || "",
        max_threads_hint: maxThreadsHint,
      }));

      console.log("🚀 Updating miners with payload:", payload);

      await updateMiner(payload);

      setEditModal(false);
      refreshMiners();
      resetEditModal();
    } catch (e) {
      console.error(e);
    }
  };

  const resetEditModal = () => {
    setSelectedPool("");
    setSelectedWallet("");
    setMaxThreadsHint(50);
    // setSelectedIds([]);
  };

  const handleStartMining = async () => {
    try {
      const selectedMiners = miners.filter((m) => selectedIds.includes(m.id));
      const payload = selectedMiners.map((m) => ({
        deviceID: m.deviceID,
      }));

      console.log("🚀 Starting mining for miners:", payload);

      await startMining(payload);

      refreshMiners();
      // setSelectedIds([]);
    } catch (error) {
      console.error("Error starting mining:", error);
    }
  };

  const handleStopMining = async () => {
    try {
      const selectedMiners = miners.filter((m) => selectedIds.includes(m.id));
      const payload = selectedMiners.map((m) => ({
        deviceID: m.deviceID,
      }));

      console.log("🛑 Stopping mining for miners:", payload);

      await stopMining(payload);

      refreshMiners();
      // setSelectedIds([]);
    } catch (error) {
      console.error("Error stopping mining:", error);
    }
  };

  const deviceCounts = miners.reduce((acc, miner) => {
    acc[miner.deviceID] = (acc[miner.deviceID] || 0) + 1;
    return acc;
  }, {});

  const columnsbk = [
    {
      field: "deviceID",
      headerName: "Device ID",
      width: 200,
      renderCell: (params) => {
        const duplicate = deviceCounts[params.row.deviceID] > 1 ? "⚠️ " : "";
        return (
          <span style={{ color: duplicate ? "orange" : "inherit" }}>
            {duplicate}
            {params.row.deviceID}
          </span>
        );
      },
    },
    {
      field: "Status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        const status = params.row.status;
        console.log("status", params);
        return (
          <span
            style={{
              color: status ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {status ? "Online" : "Offline"}
          </span>
        );
      },
    },
    {
      field: "is_mining",
      headerName: "Mining",
      width: 120,
      renderCell: (params) => {
        const mining = params.row.is_mining === "Running";
        return (
          <span
            style={{
              color: mining ? "green" : "gray",
              fontWeight: "bold",
            }}
          >
            {params.row.is_mining}
          </span>
        );
      },
    },
    { field: "name", headerName: "Worker", width: 150 },
    { field: "wallet_address", headerName: "wallet_address", width: 150 },
    { field: "ip", headerName: "IP", width: 150 },
    { field: "hashrate", headerName: "Hashrate", width: 130 },
    { field: "max_threads_hint", headerName: "max_threads_hint", width: 100 },
    { field: "threads", headerName: "Threads", width: 100 },
    { field: "cpu_usage", headerName: "CPU Usage (%)", width: 80 },
    { field: "temperature", headerName: "Temp (°C)", width: 120 },
    { field: "uptime", headerName: "Uptime (s)", width: 130 },
    { field: "platform", headerName: "Platform", width: 130 },
    { field: "last_log", headerName: "Last Log", width: 200 },
    { field: "cpu_model", headerName: "CPU Model", width: 180 },
  ];

  const columns = [
    {
      field: "deviceID",
      headerName: "Device ID",
      width: 200,
      renderCell: (params) => {
        const duplicate = deviceCounts[params.row.deviceID] > 1;
        return (
          <Tooltip
            title={duplicate ? "Duplicated device ID!" : params.row.deviceID}
          >
            <span
              style={{
                color: duplicate ? "orange" : "inherit",
                fontWeight: duplicate ? "bold" : "normal",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {duplicate && "⚠️"}
              {params.row.deviceID}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: "Status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        const status = params.row.status;
        return (
          <Chip
            icon={
              status ? (
                <CheckCircleIcon color="success" />
              ) : (
                <CancelIcon color="error" />
              )
            }
            label={status ? "Online" : "Offline"}
            color={status ? "success" : "error"}
            variant="outlined"
            size="small"
          />
        );
      },
    },
    {
      field: "is_mining",
      headerName: "Mining",
      width: 150,
      renderCell: (params) => {
        const mining = params.row.is_mining === "Running";
        return (
          <Chip
            icon={mining ? <MiningIcon /> : <StopIcon />}
            label={params.row.is_mining}
            color={mining ? "success" : "default"}
            variant="outlined"
            size="small"
          />
        );
      },
    },
    {
      field: "name",
      headerName: "Worker",
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.row.name || ""}>
          <span>{params.row.name}</span>
        </Tooltip>
      ),
    },
    {
      field: "wallet_address",
      headerName: "Wallet Address",
      width: 250,
      renderCell: (params) => (
        <Tooltip title={params.row.wallet_address || ""}>
          <span>{params.row.wallet_address?.slice(0, 10)}...</span>
        </Tooltip>
      ),
    },
    {
      field: "ip",
      headerName: "IP",
      width: 150,
      renderCell: (params) => (
        <Chip label={params.row.ip} variant="outlined" size="small" />
      ),
    },
    {
      field: "hashrate",
      headerName: "Hashrate",
      width: 130,
      align: "right",
      renderCell: (params) => (
        <span>{Number(params.row.hashrate).toFixed(2)} H/s</span>
      ),
    },
    {
      field: "max_threads_hint",
      headerName: "Max Threads",
      width: 100,
      align: "center",
    },
    {
      field: "threads",
      headerName: "Threads",
      width: 100,
      align: "center",
    },
    {
      field: "cpu_usage",
      headerName: "CPU Usage",
      width: 130,
      align: "center",
      renderCell: (params) => (
        <Chip
          label={`${params.row.cpu_usage}%`}
          color={params.row.cpu_usage > 80 ? "error" : "primary"}
          size="small"
        />
      ),
    },
    {
      field: "temperature",
      headerName: "Temp (°C)",
      width: 120,
      align: "center",
      renderCell: (params) => (
        <Chip
          label={`${params.row.temperature}°C`}
          color={
            params.row.temperature > 75
              ? "error"
              : params.row.temperature > 60
              ? "warning"
              : "success"
          }
          size="small"
        />
      ),
    },
    {
      field: "uptime",
      headerName: "Uptime (s)",
      width: 130,
      align: "center",
      renderCell: (params) => (
        <span>{Number(params.row.uptime).toLocaleString()} s</span>
      ),
    },
    {
      field: "platform",
      headerName: "Platform",
      width: 130,
      renderCell: (params) => (
        <Chip label={params.row.platform} size="small" variant="outlined" />
      ),
    },
    {
      field: "last_log",
      headerName: "Last Log",
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.row.last_log || ""}>
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {params.row.last_log}
          </span>
        </Tooltip>
      ),
    },
    {
      field: "cpu_model",
      headerName: "CPU Model",
      width: 180,
      renderCell: (params) => (
        <Tooltip title={params.row.cpu_model || ""}>
          <span>{params.row.cpu_model}</span>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: "100%", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Miners
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          disabled={selectedIds.length === 0}
          onClick={openEditModal}
        >
          Edit Selected
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={selectedIds.length === 0}
          onClick={handleStartMining}
        >
          Start Mining
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={selectedIds.length === 0}
          onClick={handleStopMining}
        >
          Stop Mining
        </Button>
      </Stack>

      <DataGrid
        rows={miners}
        columns={columns}
        pageSize={10}
        checkboxSelection
        disableSelectionOnClick
        onRowSelectionModelChange={(selectionModel) => {
          let idsArray = [];

          if (selectionModel?.ids) {
            idsArray = Array.from(selectionModel.ids);
          } else if (Array.isArray(selectionModel)) {
            idsArray = selectionModel;
          }

          console.log("✅ Selected IDs:", idsArray);
          setSelectedIds(idsArray);
        }}
      />

      <Dialog open={editModal} onClose={() => setEditModal(false)} fullWidth>
        <DialogTitle>Edit Miners</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Pool</InputLabel>
            <Select
              value={selectedPool}
              label="Pool"
              onChange={(e) => setSelectedPool(e.target.value)}
            >
              {pools.map((pool) => (
                <MenuItem key={pool.ID} value={pool.ID}>
                  {pool.name} ({pool.url}:{pool.port})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Wallet</InputLabel>
            <Select
              value={selectedWallet}
              label="Wallet"
              onChange={(e) => setSelectedWallet(e.target.value)}
            >
              {wallets.map((wallet) => (
                <MenuItem key={wallet.ID} value={wallet.ID}>
                  {wallet.name} - {wallet.address}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 4 }}>
            <Typography gutterBottom>
              Max Threads Hint: {maxThreadsHint}
            </Typography>
            <Slider
              value={maxThreadsHint}
              onChange={(e, newValue) => setMaxThreadsHint(newValue)}
              min={0}
              max={100}
              step={1}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MinersScreen;

import React, { useEffect, useState } from "react";
import {
  getWallets,
  createWallet,
  updateWallet,
  deleteWallet,
  fetchHashVault,
} from "../services/api";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, Typography, Stack } from "@mui/material";
import WalletModal from "../components/WalletModal";
import CardStat from "../components/CardStat";

const WalletList = () => {
  const [wallets, setWallets] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletStats, setWalletStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState(null);

  const loadWallets = () => {
    getWallets()
      .then((res) => {
        const rows = res.data.map((wallet) => ({
          id: wallet.ID,
          name: wallet.name,
          address: wallet.address,
        }));
        setWallets(rows);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleCreate = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditData(row);
    setModalOpen(true);
  };

  const handleDelete = (row) => {
    if (window.confirm(`Delete wallet: ${row.name}?`)) {
      deleteWallet(row.id).then(() => loadWallets());
    }
  };

  const handleSave = (data) => {
    if (editData) {
      updateWallet(editData.id, data).then(() => {
        setModalOpen(false);
        loadWallets();
      });
    } else {
      createWallet(data).then(() => {
        setModalOpen(false);
        loadWallets();
      });
    }
  };

  const handleRowClick = (params) => {
    const wallet = params.row;
    setSelectedWallet(wallet);
    fetchWalletStats(wallet.address);
  };

  const fetchWalletStats = async (address) => {
    setLoadingStats(true);
    setErrorStats(null);

    try {
      const res = await fetchHashVault(address);
      console.log("data", res.data);
      setWalletStats(res.data.revenue);
    } catch (err) {
      console.error(err);
      setErrorStats(err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const columns = [
    { field: "name", headerName: "Wallet Name", width: 200 },
    { field: "address", headerName: "Wallet Address", width: 400 },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleEdit(params.row)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => handleDelete(params.row)}
          >
            Delete
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ height: "auto", width: "100%", p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Wallet Management
      </Typography>
      <Button variant="contained" onClick={handleCreate} sx={{ mb: 2 }}>
        Create Wallet
      </Button>
      {selectedWallet && (
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Wallet Details: {selectedWallet.name} (Pool: Hashvault)
          </Typography>

          {loadingStats && (
            <Typography variant="body1" color="text.secondary">
              Loading stats...
            </Typography>
          )}

          {errorStats && (
            <Typography variant="body1" color="error">
              Error: {errorStats}
            </Typography>
          )}

          {walletStats && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <CardStat
                label="Confirmed Balance"
                value={`${(walletStats.confirmedBalance / 1e12).toFixed(
                  6
                )} XMR`}
                icon="account_balance_wallet"
                color="#1976d2"
              />
              <CardStat
                label="Daily Credited"
                value={`${(walletStats.dailyCredited / 1e12).toFixed(6)} XMR`}
                icon="trending_up"
                color="#2e7d32"
              />
              <CardStat
                label="Total Paid"
                value={`${(walletStats.totalPaid / 1e12).toFixed(6)} XMR`}
                icon="paid"
                color="#f57c00"
              />
              <CardStat
                label="Payout Threshold"
                value={`${(walletStats.payoutThreshold / 1e12).toFixed(6)} XMR`}
                icon="flag"
                color="#d32f2f"
              />
              <CardStat
                label="Total Rewards Credited"
                value={walletStats.totalRewardsCredited}
                icon="emoji_events"
                color="#9c27b0"
              />
            </Box>
          )}
        </Box>
      )}
      <DataGrid
        rows={wallets}
        columns={columns}
        pageSize={10}
        onRowClick={handleRowClick}
      />

      <WalletModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
      />
    </Box>
  );
};

export default WalletList;

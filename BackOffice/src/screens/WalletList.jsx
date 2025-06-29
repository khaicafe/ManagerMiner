import React, { useEffect, useState } from "react";
import {
  getWallets,
  createWallet,
  updateWallet,
  deleteWallet,
} from "../services/api";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, Typography, Stack } from "@mui/material";
import WalletModal from "../components/WalletModal";

const WalletList = () => {
  const [wallets, setWallets] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

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
    <Box sx={{ height: 500, width: "100%", p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Wallet Management
      </Typography>
      <Button variant="contained" onClick={handleCreate} sx={{ mb: 2 }}>
        Create Wallet
      </Button>
      <DataGrid rows={wallets} columns={columns} pageSize={10} />

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

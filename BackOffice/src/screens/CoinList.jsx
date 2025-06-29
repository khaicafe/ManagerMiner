import React, { useEffect, useState } from "react";
import {
  fetchAllCoins,
  createCoinFull,
  deleteCoinFull,
  updateCoinFull,
} from "../services/api";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, Button, Stack } from "@mui/material";
import CoinModal from "../components/CoinModal";

const CoinList = () => {
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const loadData = () => {
    fetchAllCoins()
      .then((res) => {
        const data = [];
        let id = 1;

        res.data.forEach((coin) => {
          if (coin.pools.length === 0) {
            coin.pools = [{ id: null, name: "", url: "", port: "" }];
          }
          if (coin.wallets.length === 0) {
            coin.wallets = [{ id: null, name: "", address: "" }];
          }

          console.log("check fetch", coin);
          coin.pools.forEach((pool) => {
            coin.wallets.forEach((wallet) => {
              data.push({
                id: id++,
                coinId: coin.ID,
                poolId: pool.ID,
                walletId: wallet.ID,
                coinName: coin.name,
                poolName: pool.name,
                poolUrl: pool.url,
                poolPort: pool.port,
                walletName: wallet.name,
                walletAddress: wallet.address,
              });
            });
          });
        });

        setRows(data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditData(row);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    console.log("row", row);
    if (window.confirm(`Delete coin: ${row.coinName}?`)) {
      try {
        await deleteCoinFull(row.coinId);
        loadData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      const payload = {
        coinName: formData.coinName,
        pool: {
          id: formData.poolId || null,
          name: formData.poolName,
          url: formData.poolUrl,
          port: formData.poolPort,
        },
        wallet: {
          id: formData.walletId || null,
          name: formData.walletName,
          address: formData.walletAddress,
        },
      };

      //   console.log("payload", payload, editData.coinId, formData);
      if (editData) {
        await updateCoinFull(editData.coinId, payload);
      } else {
        await createCoinFull(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { field: "coinName", headerName: "Coin", width: 150 },
    { field: "poolName", headerName: "Pool Name", width: 200 },
    { field: "poolUrl", headerName: "Pool URL", width: 250 },
    { field: "poolPort", headerName: "Pool Port", width: 120 },
    { field: "walletName", headerName: "Wallet Name", width: 200 },
    { field: "walletAddress", headerName: "Wallet Address", width: 350 },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleEdit(params.row)}
          >
            Edit
          </Button>
          {/* <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => handleDelete(params.row)}
          >
            Delete
          </Button> */}
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Coin - Pool - Wallet
      </Typography>
      {/* Mô tả chức năng show ngay bên dưới */}
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Quản lý thông tin Coin, Pool và Wallet. Mỗi dòng trong bảng thể hiện một
        tổ hợp Coin - Pool - Wallet. Bạn có thể tạo mới hoặc chỉnh sửa tên Coin,
        thông tin Pool (tên, URL, Port), cũng như thông tin ví (tên, địa chỉ).
        Tất cả tên Coin, tên Pool và địa chỉ ví phải duy nhất.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={handleCreate}
        sx={{ mb: 2 }}
      >
        Create New
      </Button>

      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 20]}
      />

      <CoinModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
      />
    </Box>
  );
};

export default CoinList;

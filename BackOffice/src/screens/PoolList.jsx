import React, { useEffect, useState } from "react";
import { getPools, createPool, updatePool, deletePool } from "../services/api";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, Typography, Stack } from "@mui/material";
import PoolModal from "../components/PoolModal";

const PoolList = () => {
  const [pools, setPools] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const loadPools = () => {
    getPools()
      .then((res) => {
        const rows = res.data.map((pool) => ({
          id: pool.ID,
          name: pool.name,
          url: pool.url,
          port: pool.port,
          description: pool.description,
        }));
        setPools(rows);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadPools();
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
    if (window.confirm(`Delete pool: ${row.name}?`)) {
      deletePool(row.id).then(() => loadPools());
    }
  };

  const handleSave = (data) => {
    if (editData) {
      updatePool(editData.id, data).then(() => {
        setModalOpen(false);
        loadPools();
      });
    } else {
      createPool(data).then(() => {
        setModalOpen(false);
        loadPools();
      });
    }
  };

  const columns = [
    { field: "name", headerName: "Pool Name", width: 200 },
    { field: "url", headerName: "URL", width: 250 },
    { field: "port", headerName: "Port", width: 100 },
    { field: "description", headerName: "Description", width: 300 },
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
        Pool Management
      </Typography>
      <Button variant="contained" onClick={handleCreate} sx={{ mb: 2 }}>
        Create Pool
      </Button>
      <DataGrid rows={pools} columns={columns} pageSize={10} />

      <PoolModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
      />
    </Box>
  );
};

export default PoolList;

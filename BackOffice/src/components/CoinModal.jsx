import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from "@mui/material";

const CoinModal = ({ open, handleClose, onSave, initialData }) => {
  const [form, setForm] = useState({
    coinId: null,
    coinName: "",
    poolId: null,
    poolName: "",
    poolUrl: "",
    poolPort: "",
    walletId: null,
    walletName: "",
    walletAddress: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        coinId: initialData.coinId || null,
        coinName: initialData.coinName || "",
        poolId: initialData.poolId || null,
        poolName: initialData.poolName || "",
        poolUrl: initialData.poolUrl || "",
        poolPort: initialData.poolPort || "",
        walletId: initialData.walletId || null,
        walletName: initialData.walletName || "",
        walletAddress: initialData.walletAddress || "",
      });
    } else {
      setForm({
        coinId: null,
        coinName: "",
        poolId: null,
        poolName: "",
        poolUrl: "",
        poolPort: "",
        walletId: null,
        walletName: "",
        walletAddress: "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "poolPort" ? parseInt(value || 0) : value,
    });
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>{initialData ? "Edit" : "Create"} Coin</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="coinName"
              label="Coin Name"
              fullWidth
              value={form.coinName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="poolName"
              label="Pool Name"
              fullWidth
              value={form.poolName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="poolUrl"
              label="Pool URL"
              fullWidth
              value={form.poolUrl}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="poolPort"
              label="Pool Port"
              type="number"
              fullWidth
              value={form.poolPort}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="walletName"
              label="Wallet Name"
              fullWidth
              value={form.walletName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="walletAddress"
              label="Wallet Address"
              fullWidth
              value={form.walletAddress}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CoinModal;

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

const WalletModal = ({ open, handleClose, onSave, initialData }) => {
  const [form, setForm] = useState({
    name: "",
    address: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        address: initialData.address || "",
      });
    } else {
      setForm({
        name: "",
        address: "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{initialData ? "Edit Wallet" : "Create Wallet"}</DialogTitle>
      <DialogContent>
        <TextField
          label="Wallet Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
          sx={{ mt: 2 }}
        />
        <TextField
          label="Wallet Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          fullWidth
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletModal;

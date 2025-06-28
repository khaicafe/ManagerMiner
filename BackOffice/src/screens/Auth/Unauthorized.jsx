import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

const UnauthorizedDialog = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    navigate(-1); // Quay lại trang trước đó
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="unauthorized-dialog-title"
      aria-describedby="unauthorized-dialog-description"
    >
      <DialogTitle id="unauthorized-dialog-title">
        403 - Unauthorized
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="unauthorized-dialog-description">
          You do not have permission to access this page.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary" variant="contained">
          Return to Previous Page
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnauthorizedDialog;

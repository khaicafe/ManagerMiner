import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { fetchSettings, updateSettings } from "../services/api";

const SettingScreen = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSetting = async () => {
    try {
      const res = await fetchSettings();
      const map = {};
      res.data.forEach((item) => {
        map[item.Key] = item.Value;
      });
      setSettings(map);
    } catch (err) {
      toast.error("Lỗi khi tải settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetting();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    try {
      const payload = Object.keys(settings).map((key) => ({
        key,
        value: settings[key],
      }));
      await updateSettings(payload); // Gửi toàn bộ settings
      toast.success("Đã lưu tất cả cài đặt thành công!");
    } catch (err) {
      toast.error("Lỗi khi lưu cài đặt");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box maxWidth="100%" mx="auto">
      <Typography variant="h4" gutterBottom>
        Cài đặt hệ thống
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6">Ping Interval</Typography>
            <TextField
              fullWidth
              label="Ping mỗi bao nhiêu giây?"
              type="number"
              value={settings.pingInterval || ""}
              onChange={(e) => handleChange("pingInterval", e.target.value)}
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Ping Consistency</Typography>
            <TextField
              fullWidth
              label="Số lần ping liên tiếp giống nhau"
              type="number"
              value={settings.pingConsistency || ""}
              onChange={(e) => handleChange("pingConsistency", e.target.value)}
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Max Concurrent</Typography>
            <TextField
              fullWidth
              label="Số switch xử lý song song"
              type="number"
              value={settings.maxConcurrent || ""}
              onChange={(e) => handleChange("maxConcurrent", e.target.value)}
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSaveAll} fullWidth>
              💾 Lưu tất cả cài đặt
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SettingScreen;

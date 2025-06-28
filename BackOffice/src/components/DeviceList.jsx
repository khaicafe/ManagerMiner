import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  getDevices,
  getDeviceFunctions,
  sendDeviceCommand,
  sendTurnOn,
  sendTurnOff,
} from "../services/api";

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [functions, setFunctions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sendTurnOn();
    fetchDevices();
    setLoading(false);
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await getDevices();
      console.log(res.data);
      setDevices(res.data.result);
      setLoading(false);

      if (res.data) {
        for (const dev of res.data.result) {
          const funcRes = await getDeviceFunctions(dev.id);
          console.log("data", funcRes.data.result.properties);
          const allFunctions = funcRes.data.result.properties;
          const switches = allFunctions.filter((f) => f.type === "bool");
          setFunctions((prev) => ({
            ...prev,
            [dev.id]: switches,
          }));
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleToggle = async (deviceId, code, value) => {
    console.log("action", deviceId, code, value);
    try {
      await sendDeviceCommand(deviceId, { code, value });
      alert(`${value ? "Bật" : "Tắt"} thành công!`);
    } catch (err) {
      alert("Thất bại khi gửi lệnh");
      console.error(err);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Device Name</strong>
            </TableCell>
            <TableCell>
              <strong>Device ID</strong>
            </TableCell>
            <TableCell>
              <strong>Model</strong>
            </TableCell>
            <TableCell>
              <strong>Switches</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell>{device.name}</TableCell>
              <TableCell>{device.id}</TableCell>
              <TableCell>{device.model}</TableCell>
              <TableCell>
                {(functions[device.id] || []).map((f) => (
                  <div key={f.code} style={{ marginBottom: 8 }}>
                    <Typography
                      variant="body2"
                      sx={{ display: "inline-block", mr: 1 }}
                    >
                      {f.name || f.code}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleToggle(device.id, f.code, true)}
                      sx={{ mr: 1 }}
                    >
                      Bật
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => handleToggle(device.id, f.code, false)}
                    >
                      Tắt
                    </Button>
                  </div>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DeviceList;

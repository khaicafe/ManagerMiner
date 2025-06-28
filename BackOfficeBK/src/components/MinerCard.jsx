// src/components/MinerCard.jsx
import { Card, CardContent, Typography } from "@mui/material";
import dayjs from "dayjs";

export default function MinerCard({ miner }) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant="h6">{miner.name}</Typography>
        <Typography color="text.secondary">IP: {miner.ip}</Typography>
        <Typography>Hashrate: {miner.hashrate} H/s</Typography>
        <Typography>Temp: {miner.temperature}°C</Typography>
        <Typography>Uptime: {miner.uptime}s</Typography>
        <Typography>
          Last Report: {dayjs(miner.reported_at).format("HH:mm:ss DD/MM/YYYY")}
        </Typography>
      </CardContent>
    </Card>
  );
}

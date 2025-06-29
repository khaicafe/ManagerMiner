import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import Icon from "@mui/material/Icon";

const CardStat = ({ label, value, icon, color }) => {
  return (
    <Card
      sx={{
        minWidth: 200,
        flex: "1 1 200px",
        background: "#f9f9f9",
        borderLeft: `6px solid ${color}`,
        boxShadow: 3,
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Icon sx={{ color, mr: 1 }}>{icon}</Icon>
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>
        </Box>
        <Typography variant="h6" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CardStat;

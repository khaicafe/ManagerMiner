import { Container, Typography } from "@mui/material";
import React from "react";

const Dashboard = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">
        Welcome to the SmartHome back office Dashboard!
      </Typography>
    </Container>
  );
};

export default Dashboard;

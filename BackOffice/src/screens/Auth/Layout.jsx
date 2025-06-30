import {
  CloudDownload as FileDownloadIcon,
  CloudUpload as FileUploadIcon,
  Inventory2 as InventoryIcon,
  Category as MaterialIcon,
  SwapHoriz as SwapIcon,
  Straighten as UnitIcon,
  Store as WarehouseIcon,
} from "@mui/icons-material";
import CategoryIcon from "@mui/icons-material/Category";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LayersIcon from "@mui/icons-material/Layers";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StraightenIcon from "@mui/icons-material/Straighten";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import TuneIcon from "@mui/icons-material/Tune";
import Stack from "@mui/material/Stack";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { jwtDecode } from "jwt-decode";
import React from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import RightDropdownMenu from "./RightDropdownMenu";
import config from "../../config";
import permissions from "../../utils/permissions"; // Import danh sách quyền
import routes from "../../utils/routes"; // Import danh sách route
import { getlocalIp } from "../../services/api";

const API_URL = config.apiBaseUrl;

const drawerWidth = 240;

const getWanIP = async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  })
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const Layout = () => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [localIP, setLocalIP] = React.useState(null);
  const [wanIP, setWanIP] = React.useState(null);

  React.useEffect(() => {
    getlocalIp().then((ip) => {
      console.log("local", ip.data.local_ip);

      setLocalIP(ip.data.local_ip);
    });
    getWanIP().then((ip) => setWanIP(ip));
  }, []);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  const user = jwtDecode(token);
  const userRole = user?.role || "cashier";
  const allowedRoutes = permissions[userRole] || [];

  const canAccess = (path) => allowedRoutes.includes(path);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: "none" }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dashboard {API_URL}
          </Typography>
          <Divider sx={{ my: 1 }} />

          <Stack direction="column" spacing={1}>
            {localIP && (
              <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                🏠 <strong>Local IP:</strong> {localIP}
              </Typography>
            )}
            {wanIP && (
              <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                🌐 <strong>WAN IP:</strong> {wanIP}
              </Typography>
            )}
          </Stack>

          <RightDropdownMenu />
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <List>
          {routes.map((route, index) =>
            route.type === "divider" ? (
              <Divider key={index} />
            ) : (
              canAccess(route.path) && (
                <ListItem component={Link} to={route.path} key={route.path}>
                  <ListItemIcon>{route.icon}</ListItemIcon>
                  <ListItemText primary={route.label} />
                </ListItem>
              )
            )
          )}
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
};

export default Layout;

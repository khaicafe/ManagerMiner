import PeopleIcon from "@mui/icons-material/People";
import LayersIcon from "@mui/icons-material/Layers";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StraightenIcon from "@mui/icons-material/Straighten";
import TuneIcon from "@mui/icons-material/Tune";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import CategoryIcon from "@mui/icons-material/Category";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InventoryIcon from "@mui/icons-material/Inventory2";
import SwapIcon from "@mui/icons-material/SwapHoriz";
import WarehouseIcon from "@mui/icons-material/Store";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

const routes = [
  { type: "divider" },
  { path: "/user-management", label: "User Management", icon: <PeopleIcon /> },
  {
    path: "/settings",
    label: "Settings",
    icon: <PeopleIcon />,
  },
  { path: "/deviceScreen", label: "List Device", icon: <PeopleIcon /> },
];

export default routes;

const permissions = {
  admin: [
    "/user-management",
    "/customerManager",
    "/deviceScreen",
    "/settings",
    "/coinList",
    "/poolList",
    "/walletList",
  ],
  manager: [
    "/deviceScreen",
    "/reportType",
    "/reportsOrder",
    "/reportsOrderTimeRange",
    "/reportProducts",
    "/login",
  ],
  cashier: ["/reportsOrder", "/topup", "/advertisements"],
  report: [
    "/reports",
    "/reportType",
    "/reportsOrder",
    "/reportsOrderTimeRange",
    "/reportProducts",
  ],
  reportRevenue: ["/reports"],
  reportProducts: ["/reportsOrder", "/reportsOrderTimeRange"],
  // reportsOrderTimeRange: ["/reportsOrderTimeRange"],
};

export default permissions;

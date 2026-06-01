import users from "./users";
import roles from "./roles";
import permission from "./permission";
import login from "./login";

const modules = {
  users,
  roles,
  permission,
  login,
};

export default {
  ...modules,
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  save: "Save",
  cancel: "Cancel",
  confirm: "Confirm",
  action: "Action",
  enabled: "Enabled",
  disabled: "Disabled",
  yes: "Yes",
  no: "No",
  createdAt: "Created At",
  password: "Password",
  newPassword: "New Password",
  user: "User",
  logout: "Logout",
  logoutSuccess: "Logged out successfully",
  createSuccess: "Created successfully",
  updateSuccess: "Updated successfully",
  deleteSuccess: "Deleted successfully",
  operationSuccess: "Operation successful",
  unsavedData: "Unsaved data",
  confirmDelete: "Confirm Delete",
  okText: "Confirm",
  cancelText: "Cancel",
  status: "Status",
  remark: "Remark",
  statusPlaceholder: "Please select status",
  remarkPlaceholder: "Please enter remark",
  permissions: "Permissions",
  loading: "Loading...",
  noPermissions: "No permission data",
  notFound: {
    title: "Page Not Found",
    description:
      "The page you are looking for may have been removed or is temporarily unavailable.",
    backHome: "Back to Home",
  },
  // Search form
  search: "Search",
  reset: "Reset",
  expand: "Expand",
  collapse: "Collapse",
  // Pagination
  pagination: {
    total: "Total {{total}} items",
  },
  // Table settings
  tableSettings: {
    columnSettings: "Column Settings",
    refresh: "Refresh",
    selectAll: "Select All",
    noColumns: "No column configuration",
    noFilterableColumns: "No filterable columns",
    density: "Density",
    size: {
      small: "Compact",
      middle: "Medium",
      large: "Relaxed",
    },
  },
  // Error messages
  error: {
    loginExpired: "Login expired, please login again",
    unauthorized: "Unauthorized or invalid token",
    forbidden: "Insufficient permissions or user disabled",
    forbiddenShort: "Insufficient permissions",
    requestFailed: "Request failed",
    operationFailed: "Operation failed",
    networkError: "Network error, please check your connection",
    networkErrorShort: "Network error",
  },
  // Theme switcher
  theme: {
    light: "Light Mode",
    dark: "Dark Mode",
    system: "Follow System",
  },
};

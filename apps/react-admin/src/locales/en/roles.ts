export default {
  title: "Role Management",
  list: "Role List",
  create: "Create Role",
  edit: "Edit Role",
  name: "Role Name",
  code: "Role Code",
  configurePermissions: "Configure Permissions",
  placeholder: {
    name: "Please enter role name",
    code: "Please enter role code (lowercase letters, numbers, underscores)",
    status: "Please select status",
  },
  rules: {
    nameRequired: "Please enter role name",
    codeRequired: "Please enter role code",
    codePattern:
      "Role code can only contain lowercase letters, numbers, and underscores",
  },
  message: {
    createError: "Failed to create role",
    updateError: "Failed to update role",
    deleteError: "Failed to delete role",
    loadPermissionsError: "Failed to load permissions",
    updatePermissionsError: "Failed to update role permissions",
    updatePermissionsSuccess: "Permissions updated successfully",
  },
};

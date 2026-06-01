export default {
  title: "角色管理",
  list: "角色列表",
  create: "新增角色",
  edit: "编辑角色",
  name: "角色名称",
  code: "角色代码",
  configurePermissions: "配置权限",
  placeholder: {
    name: "请输入角色名称",
    code: "请输入角色代码（小写字母、数字、下划线）",
    status: "请选择状态",
  },
  rules: {
    nameRequired: "请输入角色名称",
    codeRequired: "请输入角色代码",
    codePattern: "角色代码只能包含小写字母、数字和下划线",
  },
  message: {
    createError: "创建角色失败",
    updateError: "更新角色失败",
    deleteError: "删除角色失败",
    loadPermissionsError: "加载权限数据失败",
    updatePermissionsError: "更新角色权限失败",
    updatePermissionsSuccess: "权限更新成功",
  },
};

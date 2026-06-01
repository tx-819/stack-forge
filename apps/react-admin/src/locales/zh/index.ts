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
  create: "新增",
  edit: "编辑",
  delete: "删除",
  save: "保存",
  cancel: "取消",
  confirm: "确认",
  action: "操作",
  enabled: "启用",
  disabled: "禁用",
  yes: "是",
  no: "否",
  createdAt: "创建时间",
  password: "密码",
  newPassword: "新密码",
  user: "用户",
  logout: "退出登录",
  logoutSuccess: "已退出登录",
  createSuccess: "创建成功",
  updateSuccess: "更新成功",
  deleteSuccess: "删除成功",
  operationSuccess: "操作成功",
  unsavedData: "数据未保存",
  confirmDelete: "确认删除",
  okText: "确定",
  cancelText: "取消",
  status: "状态",
  remark: "备注",
  statusPlaceholder: "请选择状态",
  remarkPlaceholder: "请输入备注",
  permissions: "权限",
  loading: "加载中...",
  noPermissions: "暂无权限数据",
  notFound: {
    title: "页面不存在",
    description: "您访问的页面可能已被移除或暂时不可用。",
    backHome: "返回首页",
  },
  // 搜索表单
  search: "搜索",
  reset: "重置",
  expand: "展开",
  collapse: "收起",
  // 分页
  pagination: {
    total: "共 {{total}} 条",
  },
  // 表格设置
  tableSettings: {
    columnSettings: "列设置",
    refresh: "刷新",
    selectAll: "全选",
    noColumns: "暂无列配置",
    noFilterableColumns: "暂无可筛选的列",
    density: "密度",
    size: {
      small: "紧凑",
      middle: "中等",
      large: "宽松",
    },
  },
  // 错误消息
  error: {
    loginExpired: "登录已过期，请重新登录",
    unauthorized: "未认证或Token无效",
    forbidden: "权限不足或用户被禁用",
    forbiddenShort: "权限不足",
    requestFailed: "请求失败",
    operationFailed: "操作失败",
    networkError: "网络错误，请检查网络连接",
    networkErrorShort: "网络错误",
  },
  // 主题切换
  theme: {
    light: "亮色模式",
    dark: "暗色模式",
    system: "跟随系统",
  },
};

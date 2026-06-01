# React Admin

基于 React 19 + Vite 7 + Ant Design 6 的后台管理模板，支持动态路由、权限控制、主题切换与国际化。

对应后端项目地址为 https://github.com/tx-819/nest-admin

## 技术栈

| 类别     | 技术                             |
| -------- | -------------------------------- |
| 框架     | React 19、TypeScript             |
| 构建     | Vite 7                           |
| UI       | Ant Design 6、Tailwind CSS 4     |
| 状态管理 | Zustand                          |
| 路由     | React Router 7                   |
| 数据请求 | Axios、TanStack React Query      |
| 国际化   | i18next、react-i18next           |
| 工具库   | dayjs、lodash、motion、nprogress |

## 项目结构

```
src/
├── api/              # 接口定义
├── components/       # 通用组件
│   ├── ProTable/    # 高级表格（搜索、分页、列设置）
│   ├── DMForm/      # 动态表单
│   ├── SearchForm/  # 搜索表单
│   ├── Access/      # 权限控制
│   ├── ThemeSwitcher/
│   ├── SelectLang/
│   └── ...
├── hooks/
├── layouts/         # 布局（BasicLayout、侧边栏、Header、面包屑）
├── locales/         # 多语言文案（zh/en）
├── pages/           # 页面
├── routes/          # 路由配置与动态路由生成
├── store/           # Zustand 状态（user、menu、theme）
└── utils/
```

## 功能列表

### 认证与权限

- 用户登录 / 注册
- 邮箱链接登录
- Token 验证与用户信息同步
- 基于后端菜单的动态路由
- 页面/按钮级权限控制（Access 组件）

### 布局与导航

- 可折叠侧边栏
- 面包屑导航
- 顶部 Header（用户头像、主题切换、语言切换）

### 主题与国际化

- 亮色 / 暗色 / 跟随系统（7:00–19:00 亮色）
- 中英文切换

### 业务页面

- 用户管理（CRUD、角色分配）
- 角色管理（CRUD、权限配置）
- 权限管理（树形结构、CRUD）

### 通用组件

- **ProTable**：表格 + 搜索表单 + 刷新 / 分页 / 列筛选
- **DMForm**：基于配置的动态表单
- **SearchForm**：与 ProTable 联动的搜索表单

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务（默认端口 5173）
npm run dev

# 构建
npm run build

# 代码检查
npm run lint
```

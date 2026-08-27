import { Layout } from "antd";
import SideMenu from "./_components/SideMenu";
import MenuRouteGuard from "./_components/MenuRouteGuard";
import Header from "./_components/Header";
import { getEffectiveTheme, useThemeStore } from "@/store/themeStore";
import { theme as antdTheme } from "antd";
import { setCollapsed, useMenuStore } from "@/store/menuStore";

const { Sider, Content } = Layout;

const BasicLayout = () => {
  const collapsed = useMenuStore((state) => state.collapsed);
  const theme = useThemeStore((s) => s.theme);
  const effectiveTheme = getEffectiveTheme(theme);
  const {
    token: { colorBgContainer },
  } = antdTheme.useToken();
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        style={{
          overflow: "auto",
          height: "100vh",
          position: "sticky",
          insetInlineStart: 0,
          top: 0,
          scrollbarWidth: "thin",
          background: colorBgContainer,
        }}
        trigger={null}
        theme={effectiveTheme}
        collapsible
        collapsed={collapsed}
      >
        <div className="text-xl font-bold p-4 text-center dark:text-white">
          {collapsed ? "A" : "Admin"}
        </div>
        <SideMenu />
      </Sider>
      <Layout>
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        <Content
          className="p-4 overflow-hidden"
        >
            <MenuRouteGuard />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;

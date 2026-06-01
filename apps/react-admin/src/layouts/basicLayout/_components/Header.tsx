import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  theme as antdTheme,
  Avatar,
  Dropdown,
  Space,
  Typography,
  message,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import BreadcrumbNav from "./BreadcrumbNav";
import { getUser, clearAuth } from "@/store/userStore";
import type { UserInfo } from "@/api/auth";
import SelectLang from "@/components/SelectLang";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header = ({ collapsed, onToggle }: HeaderProps) => {
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const {
    token: { colorBgContainer },
  } = antdTheme.useToken();
  useEffect(() => {
    // 获取用户信息
    const user = getUser();
    setUserInfo(user);
  }, []);

  const handleLogout = () => {
    clearAuth();
    message.success(t("logoutSuccess"));
    navigate("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div className="py-1">
          <div className="font-medium">
            {userInfo?.nickname || userInfo?.username}
          </div>
          <Text type="secondary" className="text-xs">
            {userInfo?.username}
          </Text>
        </div>
      ),
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: t("logout"),
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader
      className="flex items-center justify-between"
      style={{ background: colorBgContainer }}
    >
      <div className="flex items-center gap-4">
        {collapsed ? (
          <MenuUnfoldOutlined
            className="trigger text-lg cursor-pointer"
            onClick={onToggle}
          />
        ) : (
          <MenuFoldOutlined
            className="trigger text-lg cursor-pointer"
            onClick={onToggle}
          />
        )}
        <BreadcrumbNav />
      </div>
      <div className="flex items-center gap-2">
        <Space>
          <ThemeSwitcher />
          <SelectLang />
        </Space>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space
            className="cursor-pointer px-2"
            onClick={(e) => e.preventDefault()}
          >
            <Avatar
              src={userInfo?.avatar}
              icon={!userInfo?.avatar && <UserOutlined />}
              size="default"
            />
            <Text strong>
              {userInfo?.nickname || userInfo?.username || t("user")}
            </Text>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;

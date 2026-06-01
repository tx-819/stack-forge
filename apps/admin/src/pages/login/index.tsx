import { useState } from "react";
import { Form, Input, Button, message, Tabs, Space } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login, sendLoginLink } from "../../api/auth";
import { setUser, setAccessToken } from "@/store/userStore";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import SelectLang from "@/components/SelectLang";

type LoginTab = "password" | "emailLink";

const Login = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [form] = Form.useForm();
  const [emailLinkForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<LoginTab>("password");

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await login({
        username: values.username,
        password: values.password,
      });
      setUser(response.user);
      setAccessToken(response.accessToken);
      message.success(t("login.loginSuccess"));
      location.href = "/";
    } catch (error) {
      console.error("登录错误:", error);
    } finally {
      setLoading(false);
    }
  };

  const onEmailLinkFinish = async (values: { email: string }) => {
    setLinkLoading(true);
    setLinkSent(false);
    try {
      await sendLoginLink(values.email);
      setLinkSent(true);
      message.success(t("login.emailLinkSent"));
    } catch (error) {
      console.error("发送登录链接错误:", error);
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f0f4ff] dark:bg-gray-900">
      <div className="flex items-center justify-between p-8 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">Admin</span>
        </div>
        <Space>
          <SelectLang />
          <ThemeSwitcher />
        </Space>
      </div>

      {/* 登录表单区域 */}
      <div className="w-full p-8 mt-8 relative z-10 mx-auto flex flex-col items-center">
        <div className="form-autofill-style w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {t("login.title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === "password" ? t("login.subtitle") : t("login.emailLinkSubtitle")}
            </p>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(k) => {
              setActiveTab(k as LoginTab);
              setLinkSent(false);
            }}
            className="login-tabs"
            items={[
              {
                key: "password",
                label: t("login.tabPassword"),
                children: (
                  <Form
                    form={form}
                    name="login"
                    onFinish={onFinish}
                    autoComplete="off"
                    layout="vertical"
                  >
                    <Form.Item
                      name="username"
                      rules={[
                        { required: true, message: t("login.rules.usernameRequired") },
                        { min: 3, message: t("login.rules.usernameMinLength") },
                      ]}
                      className="mb-4"
                    >
                      <Input
                        size="large"
                        placeholder={t("login.placeholder.username")}
                        className="h-12"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[
                        { required: true, message: t("login.rules.passwordRequired") },
                      ]}
                      className="mb-4"
                    >
                      <Input.Password
                        size="large"
                        placeholder={t("login.placeholder.password")}
                        className="h-12"
                      />
                    </Form.Item>

                    <Form.Item className="mb-4">
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={loading}
                        size="large"
                        className="h-12 rounded-lg text-base font-medium"
                      >
                        {t("login.login")}
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: "emailLink",
                label: t("login.tabEmailLink"),
                children: (
                  <Form
                    form={emailLinkForm}
                    name="email-link"
                    onFinish={onEmailLinkFinish}
                    autoComplete="off"
                    layout="vertical"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: t("login.rules.emailRequired") },
                        { type: "email", message: t("login.rules.emailInvalid") },
                      ]}
                      className="mb-4"
                    >
                      <Input
                        size="large"
                        type="email"
                        placeholder={t("login.placeholder.email")}
                        className="h-12"
                        disabled={linkSent}
                      />
                    </Form.Item>

                    {linkSent ? (
                      <div className="mb-4 py-3 px-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
                        {t("login.emailLinkSent")}
                        <br />
                        <span className="text-gray-500 dark:text-gray-400">
                          {t("login.emailLinkSentHint")}
                        </span>
                      </div>
                    ) : null}

                    <Form.Item className="mb-4">
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={linkLoading}
                        size="large"
                        className="h-12 rounded-lg text-base font-medium"
                        disabled={linkSent}
                      >
                        {t("login.sendLoginLink")}
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {t("login.noAccount")}{" "}
            <Link
              to="/register"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              {t("login.registerNow")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

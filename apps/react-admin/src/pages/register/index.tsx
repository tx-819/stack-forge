import { useState } from "react";
import { Form, Input, Button, message, Space } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { register } from "@/api/auth";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import SelectLang from "@/components/SelectLang";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    nickname?: string;
    avatar?: string;
  }) => {
    setLoading(true);
    try {
      // 调用注册API
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        nickname: values.nickname,
        avatar: values.avatar,
      });

      message.success("注册成功，请登录");
      // 注册成功后跳转到登录页
      navigate("/login");
    } catch (error) {
      // 错误信息已经在request工具中统一处理并显示
      // 这里只记录日志，不重复显示错误提示
      console.error("注册错误:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f0f4ff] dark:bg-gray-900">
      <div className="flex items-center justify-between p-8 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Admin
          </span>
        </div>
        <Space>
          <SelectLang />
          <ThemeSwitcher />
        </Space>
      </div>

      {/* 注册表单区域 */}
      <div className="w-full p-8 mt-8 relative z-10 mx-auto flex flex-col items-center">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              创建账号
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              填写以下信息完成注册
            </p>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "请输入用户名" },
                { min: 3, message: "用户名长度必须在 3-50 个字符之间" },
                { max: 50, message: "用户名长度必须在 3-50 个字符之间" },
              ]}
              className="mb-4"
            >
              <Input size="large" placeholder="用户名" className="h-12" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: "请输入邮箱" },
                { type: "email", message: "请输入有效的邮箱地址" },
              ]}
              className="mb-4"
            >
              <Input size="large" placeholder="邮箱" className="h-12" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 6, message: "密码长度至少为 6 位" },
              ]}
              className="mb-4"
            >
              <Input.Password
                size="large"
                placeholder="密码"
                className="h-12"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "请确认密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("两次输入的密码不一致"));
                  },
                }),
              ]}
              className="mb-4"
            >
              <Input.Password
                size="large"
                placeholder="确认密码"
                className="h-12"
              />
            </Form.Item>

            <Form.Item
              name="nickname"
              rules={[{ max: 50, message: "昵称长度不能超过 50 个字符" }]}
              className="mb-4"
            >
              <Input size="large" placeholder="昵称（可选）" className="h-12" />
            </Form.Item>

            <Form.Item
              name="avatar"
              rules={[
                { type: "url", message: "请输入有效的头像 URL" },
                { max: 500, message: "头像 URL 长度不能超过 500 个字符" },
              ]}
              className="mb-4"
            >
              <Input
                size="large"
                placeholder="头像 URL（可选）"
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
                注册
              </Button>
            </Form.Item>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              已有账号?{" "}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                立即登录
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;

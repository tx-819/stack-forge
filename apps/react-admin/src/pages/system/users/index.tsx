import { useState, useRef, useCallback, useEffect } from "react";
import {
  Tag,
  Space,
  Button,
  Modal,
  message,
  Avatar,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import ProTable from "@/components/ProTable";
import type { ProTableRef, ProColumnType } from "@/components/ProTable/types";
import DMForm from "@/components/DMForm";
import {
  getUserListApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  type CreateUserParams,
  type UpdateUserParams,
  type GetUserPageParams,
  type User,
} from "@/api/user";
import Access from "@/components/Access";
import { getRoleListApi, type Role } from "@/api/role";

const Users = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const tableRef = useRef<ProTableRef>(null);

  // 加载角色列表
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const { data } = await getRoleListApi({ page: 1, pageSize: 1000 });
        setRoles(data);
      } catch (error) {
        console.error(t("users.message.loadRolesError"), error);
      }
    };
    loadRoles();
  }, [t]);

  // 处理删除用户
  const handleDelete = useCallback(
    (record: User) => {
      Modal.confirm({
        title: t("confirmDelete"),
        okText: t("okText"),
        cancelText: t("cancelText"),
        okType: "danger",
        onOk: async () => {
          try {
            await deleteUserApi(record.id);
            message.success(t("deleteSuccess"));
            // 刷新表格
            if (tableRef.current) {
              await tableRef.current.refresh();
            }
          } catch (error) {
            console.error(t("users.message.deleteError"), error);
          }
        },
      });
    },
    [t],
  );

  // 表格列定义
  const columns: ProColumnType<User>[] = [
    {
      title: t("users.username"),
      dataIndex: "username",
      key: "username",
      width: 150,
      formItem: {
        type: "input",
        fieldProps: {
          placeholder: t("users.placeholder.username"),
        },
      },
    },
    {
      title: t("users.nickname"),
      dataIndex: "nickname",
      key: "nickname",
      width: 150,
      formItem: {
        type: "input",
        fieldProps: {
          placeholder: t("users.placeholder.nickname"),
        },
      },
    },
    {
      title: t("users.avatar"),
      dataIndex: "avatar",
      key: "avatar",
      width: 80,
      render: (avatar: string | null) => (
        <Avatar src={avatar} icon={<UserOutlined />} size="small" />
      ),
    },
    {
      title: t("users.status"),
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: boolean) => (
        <Tag color={status ? "success" : "default"}>
          {status ? t("enabled") : t("disabled")}
        </Tag>
      ),
      formItem: {
        type: "select",
        options: [
          { label: t("enabled"), value: 1 },
          { label: t("disabled"), value: 0 },
        ],
        fieldProps: {
          placeholder: t("users.placeholder.status"),
          allowClear: true,
        },
      },
    },
    {
      title: t("users.isSuper"),
      dataIndex: "isSuper",
      key: "isSuper",
      width: 120,
      render: (isSuper: boolean) => (
        <Tag color={isSuper ? "red" : "default"}>
          {isSuper ? t("yes") : t("no")}
        </Tag>
      ),
    },
    {
      title: t("users.roles"),
      dataIndex: "roles",
      key: "roles",
      width: 200,
      render: (roles: Array<{ name: string }>) => {
        if (!roles || roles.length === 0) return "-";
        return (
          <Space wrap>
            {roles.map((role, index) => (
              <Tag key={index} color="blue">
                {role.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t("createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt: string) => {
        if (!createdAt) return "-";
        return new Date(createdAt).toLocaleString();
      },
    },
    {
      title: t("action"),
      key: "action",
      width: 150,
      fixed: "right",
      render: (_: unknown, record: User) => (
        <Space>
          <Access code="update">
            <DMForm<UpdateUserParams>
              name="userForm_edit"
              type="Modal"
              title={t("users.edit")}
              width={960}
              trigger={
                <Button type="link" size="small" icon={<EditOutlined />}>
                  {t("edit")}
                </Button>
              }
              initialValues={{
                username: record.username,
                nickname: record.nickname || "",
                avatar: record.avatar || "",
                status: record.status,
                email: record.email,
                isSuper: record.isSuper,
                roleIds: record.roles?.map((r) => r.id) || [],
              }}
              onSubmit={(values, { success, error }) => {
                updateUserApi(record.id, values)
                  .then(() => {
                    success();
                    // 刷新表格
                    if (tableRef.current) {
                      tableRef.current.refresh();
                    }
                  })
                  .catch(() => {
                    error(t("users.message.updateError"));
                  });
              }}
            >
              {renderForm(true)}
            </DMForm>
          </Access>
          <Access code="delete">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                handleDelete(record);
              }}
            >
              {t("delete")}
            </Button>
          </Access>
        </Space>
      ),
    },
  ];

  // 渲染表单内容
  const renderForm = useCallback(
    (isEdit = false) => (
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="username"
            label={t("users.username")}
            labelCol={{ span: 6 }}
            rules={[
              { required: true, message: t("users.rules.usernameRequired") },
              {
                min: 3,
                max: 50,
                message: t("users.rules.usernameLength"),
              },
            ]}
          >
            <Input
              placeholder={t("users.placeholder.usernameWithRule")}
              autoComplete="off"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="email"
            label={t("users.email")}
            labelCol={{ span: 6 }}
            rules={[
              { required: true, message: t("users.rules.emailRequired") },
              {
                type: "email",
                message: t("users.rules.emailInvalid"),
              },
            ]}
          >
            <Input
              placeholder={t("users.placeholder.email")}
              autoComplete="off"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="nickname"
            label={t("users.nickname")}
            labelCol={{ span: 6 }}
          >
            <Input placeholder={t("users.placeholder.nickname")} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="avatar"
            label={t("users.avatarUrl")}
            labelCol={{ span: 6 }}
          >
            <Input placeholder={t("users.placeholder.avatarUrl")} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="roleIds"
            label={t("users.roles")}
            labelCol={{ span: 6 }}
          >
            <Select
              mode="multiple"
              placeholder={t("users.placeholder.roles")}
              allowClear
              options={roles.map((role) => ({
                label: role.name,
                value: role.id,
              }))}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="status"
            label={t("status")}
            labelCol={{ span: 6 }}
            valuePropName="checked"
            {...(!isEdit && { initialValue: true })}
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="isSuper"
            label={t("users.isSuper")}
            labelCol={{ span: 6 }}
            valuePropName="checked"
            {...(!isEdit && { initialValue: false })}
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    ),
    [t, roles],
  );

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">{t("users.title")}</h2>
        <Access code="create">
          <DMForm<CreateUserParams>
            name="userForm_create"
            type="Modal"
            title={t("users.create")}
            width={960}
            trigger={
              <Button type="primary" icon={<PlusOutlined />}>
                {t("users.create")}
              </Button>
            }
            onSubmit={(values, { success, error }) => {
              createUserApi(values)
                .then(() => {
                  success();
                  // 刷新表格
                  if (tableRef.current) {
                    tableRef.current.refresh();
                  }
                })
                .catch(() => {
                  error(t("users.message.createError"));
                });
            }}
          >
            {renderForm(false)}
          </DMForm>
        </Access>
      </div>
      <ProTable<User, GetUserPageParams>
        ref={tableRef}
        columns={columns}
        request={getUserListApi}
        title={t("users.list")}
      />
    </>
  );
};

export default Users;

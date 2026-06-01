import { useRef, useCallback, useMemo } from "react";
import { Space, Button, Modal, message, Form, Input, Switch, InputNumber, Row, Col, Radio } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import ProTable from "@/components/ProTable";
import type { ProTableRef } from "@/components/ProTable/types";
import DMForm from "@/components/DMForm";
import {
  getPermissionTreeApi,
  createPermissionApi,
  updatePermissionApi,
  deletePermissionApi,
  type Permission,
  type PermissionType,
} from "@/api/permission";
import Access from "@/components/Access";
const { TextArea } = Input;
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Permission = () => {
  const { t } = useTranslation();
  const tableRef = useRef<ProTableRef>(null);
  const queryClient = useQueryClient();
  const { data, isPending, isFetching } = useQuery({
    queryKey: ["permissionTree"],
    queryFn: getPermissionTreeApi,
  });

  // 处理删除权限
  const handleDelete = useCallback(
    (record: Permission) => {
      Modal.confirm({
        title: t("confirmDelete"),
        okText: t("okText"),
        cancelText: t("cancelText"),
        okType: "danger",
        onOk: async () => {
          try {
            await deletePermissionApi(record.id);
            message.success(t("deleteSuccess"));
            // 刷新表格
            if (tableRef.current) {
              await tableRef.current.refresh();
            }
          } catch (error) {
            console.error(t("permission.message.deleteError"), error);
          }
        },
      });
    },
    [t]
  );

  // 渲染表单内容
  const renderFormItems = useCallback(
    (isEdit = false, permissionType?: PermissionType) => (
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="permissionType"
            label={t("permission.permissionType")}
            labelCol={{ span: 3 }}
          >
            <Radio.Group disabled={permissionType === "action"}>
              <Radio.Button value="menu">{t("permission.typeMenu")}</Radio.Button>
              <Radio.Button value="action">{t("permission.typeAction")}</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="name"
            label={t("permission.name")}
            labelCol={{ span: 6 }}
            rules={[{ required: true, message: t("permission.rules.nameRequired") }]}
          >
            <Input placeholder={t("permission.placeholder.name")} />
          </Form.Item>
        </Col>
        <Form.Item shouldUpdate={(prev, current) => prev?.permissionType !== current?.permissionType} noStyle>
          {({ getFieldValue }) => {
            const permissionType = getFieldValue("permissionType");
            if (permissionType === "menu") {
              return (
                <>
                  <Col span={12}>
                    <Form.Item
                      name="path"
                      label={t("permission.path")}
                      labelCol={{ span: 6 }}
                      rules={[{ required: true, message: t("permission.rules.pathRequired") }]}
                    >
                      <Input placeholder={t("permission.placeholder.path")} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="component"
                      label={t("permission.componentPath")}
                      labelCol={{ span: 6 }}
                    >
                      <Input placeholder={t("permission.placeholder.componentPath")} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="icon"
                      label={t("permission.icon")}
                      labelCol={{ span: 6 }}
                    >
                      <Input placeholder={t("permission.placeholder.icon")} />
                    </Form.Item>
                  </Col>
                </>
              );
            }
            return (
              <Col span={12}>
                <Form.Item name="code" label={t("permission.code")} labelCol={{ span: 6 }}>
                  <Input placeholder={t("permission.placeholder.code")} />
                </Form.Item>
              </Col>
            );
          }}
        </Form.Item>
        <Col span={12}>
          <Form.Item
            name="orderNo"
            label={t("permission.orderNo")}
            labelCol={{ span: 6 }}
            {...(!isEdit && { initialValue: 0 })}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
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
        <Col span={24}>
          <Form.Item
            name="remark"
            label={t("remark")}
            labelCol={{ span: 3 }}
          >
            <TextArea
              placeholder={t("remarkPlaceholder")}
              rows={3}
            />
          </Form.Item>
        </Col>
      </Row>
    ),
    [t]
  );

  // 表格列定义
  const columns: ColumnsType<Permission> = useMemo(
    () => [
      {
        title: t("permission.name"),
        dataIndex: "name",
        key: "name",
        width: 200,
      },
      {
        title: t("permission.code"),
        dataIndex: "code",
        key: "code",
        width: 200,
        render: (code: string) => code || "-",
      },
      {
        title: t("permission.path"),
        dataIndex: "path",
        key: "path",
        width: 250,
      },
      {
        title: t("permission.component"),
        dataIndex: "component",
        key: "component",
        width: 200,
        render: (component: string) => component || "-",
      },
      {
        title: t("permission.icon"),
        dataIndex: "icon",
        key: "icon",
        width: 100,
        render: (icon: string) => icon || "-",
      },
      {
        title: t("action"),
        key: "action",
        width: 150,
        fixed: "right",
        render: (_: unknown, record: Permission) => (
          <Space>
            {record.permissionType === "menu" && (
              <Access code="create">
                <DMForm<Partial<Permission>>
                  name={`menuForm_create_child_${record.id}`}
                  type="Modal"
                  title={t("permission.createChild")}
                  width={1060}
                  trigger={
                    <Button
                      type="link"
                      size="small"
                      icon={<PlusOutlined />}
                    >
                      {t("permission.createChild")}
                    </Button>
                  }
                  initialValues={{
                    permissionType: "menu",
                    parentId: record.id,
                  }}
                  onSubmit={async (values, { success }) => {
                    try {
                      await createPermissionApi({
                        ...values,
                        parentId: record.id,
                      });
                      success();
                      // 刷新表格
                      if (tableRef.current) {
                        await tableRef.current.refresh();
                      }
                    } catch (error) {
                      console.error(t("permission.message.createError"), error);
                      throw error;
                    }
                  }}
                >
                  {renderFormItems(false)}
                </DMForm>
              </Access>
            )}
            <Access code="update">
              <DMForm<Partial<Permission>>
                name={`menuForm_edit_${record.id}`}
                type="Modal"
                title={t("permission.edit")}
                width={1060}
                trigger={
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                  >
                    {t("edit")}
                  </Button>
                }
                initialValues={record}
                onSubmit={(values, { success, error }) => {
                  updatePermissionApi(record.id, values).then(() => {
                    success();
                    // 刷新表格
                    if (tableRef.current) {
                      tableRef.current.refresh();
                    }
                  }).catch(() => {
                    error(t("permission.message.updateError"));
                  });
                }}
              >
                {renderFormItems(true, record.permissionType)}
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
    ],
    [t, handleDelete, renderFormItems]
  );

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">{t("permission.title")}</h2>
        <Access code="create">
          <DMForm<Partial<Permission>>
            name="menuForm_create"
            type="Modal"
            title={t("permission.create")}
            width={1060}
            trigger={
              <Button
                type="primary"
                icon={<PlusOutlined />}
              >
                {t("permission.create")}
              </Button>
            }
            initialValues={{
              permissionType: "menu"
            }}
            onSubmit={(values, { success, error }) => {
              createPermissionApi(values).then(() => {
                success();
                // 刷新表格
                if (tableRef.current) {
                  tableRef.current.refresh();
                }
              }).catch(() => {
                error(t("permission.message.createError"))
              });
            }}
          >
            {renderFormItems(false)}
          </DMForm>
        </Access>
      </div >
      <ProTable<Permission>
        ref={tableRef}
        columns={columns}
        dataSource={data}
        loading={isPending || isFetching}
        pagination={false}
        size="middle"
        title={t("permission.list")}
        options={{
          onRefresh: () => {
            queryClient.invalidateQueries({ queryKey: ["permissionTree"] });
          },
        }}
      />

    </>
  );
};

export default Permission;

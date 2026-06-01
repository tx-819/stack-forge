import { useState, useCallback, useMemo } from "react";
import { message, Tree, Spin, Form } from "antd";
import type { DataNode } from "antd/es/tree";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import DMForm from "@/components/DMForm";
import {
  getRolePermissionsApi,
  updateRolePermissionsApi,
  type Role,
  type UpdateRolePermissionsParams,
} from "@/api/role";
import { getPermissionTreeApi, type Permission } from "@/api/permission";

interface PermissionConfigProps {
  /** 角色信息 */
  role: Role;
  /** 触发元素 */
  trigger?: ReactNode | ((props: { onClick: (e: React.MouseEvent) => void }) => ReactNode);
  /** 保存成功回调 */
  onSuccess?: () => void;
}

const PermissionConfig = ({ role, trigger, onSuccess }: PermissionConfigProps) => {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  // 将权限树转换为 Tree 组件需要的格式
  const convertPermissionsToTreeData = useCallback(
    (permissions: Permission[]): DataNode[] => {
      return permissions.map((permission) => ({
        title: permission.name,
        key: permission.id,
        value: permission.id,
        children: permission.children
          ? convertPermissionsToTreeData(permission.children)
          : undefined,
      }));
    },
    []
  );


  // 加载权限数据
  const loadPermissions = useCallback(async () => {
    setLoading(true);

    try {
      // 并行加载所有权限和角色已有权限
      const [allPermissions, rolePermissions] = await Promise.all([
        getPermissionTreeApi(),
        getRolePermissionsApi(role.id),
      ]);

      setPermissions(allPermissions);
      // 提取角色已有权限的 ID
      const rolePermissionIds = rolePermissions.map((p) => p.id);

      return rolePermissionIds;
    } catch (error) {
      console.error(t("roles.message.loadPermissionsError"), error);
      message.error(t("roles.message.loadPermissionsError"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [role.id, t]);

  // 树形数据
  const treeData = useMemo(
    () => convertPermissionsToTreeData(permissions),
    [permissions, convertPermissionsToTreeData]
  );

  return (
    <DMForm<UpdateRolePermissionsParams>
      name="permissionConfig"
      type="Modal"
      title={`${t("roles.configurePermissions")} - ${role.name}`}
      width={600}
      trigger={trigger}
      requestInitialValues={({ resolve, reject }) => {
        loadPermissions()
          .then((permissionIds) => {
            resolve({ permissionIds });
          })
          .catch(() => {
            reject();
          });
      }}
      requestDeps={[role.id]}
      onSubmit={(values, { success, error }) => {
        const permissionIds = values.permissionIds || [];
        updateRolePermissionsApi(role.id, {
          permissionIds,
        }).then(() => {
          success();
          if (onSuccess) {
            onSuccess();
          }
        }).catch(() => {
          error(t("roles.message.updatePermissionsError"))
        })
      }}
    >
      <Form.Item name="permissionIds">
        <PermissionTree
          permissions={permissions}
          loading={loading}
          treeData={treeData}
        />
      </Form.Item>
    </DMForm>
  );
};


// 获取所有父权限ID（递归向上查找）
const getAllParentIds = (permissionId: string, parentMap: Map<string, string | undefined>): string[] => {
  const parentIds: string[] = [];
  let currentParentId = parentMap.get(permissionId);
  while (currentParentId !== undefined) {
    parentIds.push(currentParentId);
    currentParentId = parentMap.get(currentParentId);
  }
  return parentIds;
};

// 获取所有子权限ID（递归向下查找）
const getAllChildIds = (permissionId: string, permissions: Permission[]): string[] => {
  const childIds: string[] = [];
  const findPermission = (
    items: Permission[],
    targetId: string
  ): Permission | null => {
    for (const item of items) {
      if (item.id === targetId) {
        return item;
      }
      if (item.children) {
        const found = findPermission(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };
  const permission = findPermission(permissions, permissionId);
  if (permission && permission.children) {
    const traverse = (items: Permission[]) => {
      items.forEach((item) => {
        childIds.push(item.id);
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(permission.children);
  }
  return childIds;
};

// 构建权限ID到父权限ID的映射关系
const buildParentMap = (permissions: Permission[], parentId?: string): Map<string, string | undefined> => {
  const map = new Map<string, string | undefined>();
  permissions.forEach((permission) => {
    map.set(permission.id, parentId);
    if (permission.children) {
      const childMap = buildParentMap(permission.children, permission.id);
      childMap.forEach((value, key) => map.set(key, value));
    }
  });
  return map;
}


// 权限树组件
interface PermissionTreeProps {
  permissions: Permission[];
  loading: boolean;
  treeData: DataNode[];
  value?: string[];
  onChange?: (value: string[]) => void;
}

const PermissionTree = ({
  permissions,
  loading,
  treeData,
  value = [],
  onChange,
}: PermissionTreeProps) => {
  const { t } = useTranslation();

  const handleCheck = (checkedKeys: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
    if (!onChange) return;
    // Tree 组件的 onCheck 回调可能返回数组或对象（checkStrictly 模式下返回数组）
    const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
    const newSelectedIds = keys as string[];
    // 构建父权限映射
    const parentMap = buildParentMap(permissions);
    // 找出新增和移除的权限ID
    const currentSelectedSet = new Set(value);
    const newSelectedSet = new Set(newSelectedIds);
    const addedIds: string[] = [];
    const removedIds: string[] = [];
    newSelectedSet.forEach((id) => {
      if (!currentSelectedSet.has(id)) {
        addedIds.push(id);
      }
    });
    currentSelectedSet.forEach((id) => {
      if (!newSelectedSet.has(id)) {
        removedIds.push(id);
      }
    });
    // 开始处理：先应用新的选择状态
    const finalSelectedIds = new Set(newSelectedIds);
    // 处理新增权限
    addedIds.forEach((id) => {
      // 1. 如果是父权限，自动选中所有子权限（向下级联）
      const childIds = getAllChildIds(id, permissions);
      childIds.forEach((childId) => {
        finalSelectedIds.add(childId);
      });
      // 2. 自动选中所有父权限（向上级联）
      const parentIds = getAllParentIds(id, parentMap);
      parentIds.forEach((parentId) => {
        finalSelectedIds.add(parentId);
      });
    });
    // 处理移除权限
    removedIds.forEach((id) => {
      // 1. 如果移除的是父权限，需要同时移除所有子权限（向下级联）
      const childIds = getAllChildIds(id, permissions);
      childIds.forEach((childId) => {
        finalSelectedIds.delete(childId);
      });
      // 2. 如果移除的是子权限，不移除父权限（保持父权限选中）
      // 注意：这里不执行向上清理逻辑
    });
    onChange(Array.from(finalSelectedIds));
  };


  return (
    <Spin spinning={loading}>
      {permissions.length > 0 ? (
        <Tree
          checkable
          checkStrictly
          checkedKeys={value}
          onCheck={handleCheck}
          treeData={treeData}
          defaultExpandAll
          style={{ maxHeight: "500px", overflowY: "auto" }}
        />
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          {loading ? t("loading") : t("noPermissions")}
        </div>
      )}
    </Spin>
  );
};

export default PermissionConfig;


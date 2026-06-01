import { Button, Popover } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface RefreshButtonProps {
  /** 加载状态 */
  loading?: boolean;
  /** 刷新回调 */
  onRefresh?: () => void;
}

const RefreshButton = ({ loading = false, onRefresh }: RefreshButtonProps) => {
  const { t } = useTranslation();
  return (
    <Popover content={t("tableSettings.refresh")} trigger="hover">
      <Button
        icon={<ReloadOutlined spin={loading} />}
        onClick={onRefresh}
        loading={loading}
        disabled={loading}
        type="text"
      />
    </Popover>
  );
};

export default RefreshButton;

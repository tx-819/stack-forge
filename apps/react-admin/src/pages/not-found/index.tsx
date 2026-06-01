
import { useTranslation } from "react-i18next";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title={t("notFound.title")}
      subTitle={t("notFound.description")}
      extra={<Button type="primary" onClick={() => navigate("/")}>{t("notFound.backHome")}</Button>}
    />
  );
};

export default NotFound;

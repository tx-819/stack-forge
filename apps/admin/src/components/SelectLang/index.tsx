import { useTranslation } from "react-i18next";
import { Dropdown } from "antd";
import { TranslationOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";

type Language = "zh" | "en";

const SelectLang = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "zh",
      label: "中文",
      onClick: () => handleLanguageChange("zh"),
    },
    {
      key: "en",
      label: "English",
      onClick: () => handleLanguageChange("en"),
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      <TranslationOutlined className="text-xl cursor-pointer text-black/80 p-2 hover:bg-black/10 rounded-md dark:text-white! dark:hover:bg-white/10 transition-all duration-300" />
    </Dropdown>
  );
};

export default SelectLang;

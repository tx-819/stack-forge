import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resources from "@/locales";
import { getLanguage, setLanguage } from "./storage";

i18n.use(initReactI18next).init({
  resources,
  lng: getLanguage() || "zh",
  fallbackLng: "zh",
  debug: true,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  setLanguage(lng);
});

export default i18n;

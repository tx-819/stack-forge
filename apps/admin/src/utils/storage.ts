
const LANGUAGE_KEY = "app_language";

/**
 * 获取语言
 */
export const getLanguage = (): string | null => {
  return localStorage.getItem(LANGUAGE_KEY);
};

/**
 * 设置语言
 */
export const setLanguage = (language: string): void => {
  localStorage.setItem(LANGUAGE_KEY, language);
};

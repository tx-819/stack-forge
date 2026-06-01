import { Form, message } from "antd";
import type { FormInstance } from "antd/es/form";
import { useTranslation } from "react-i18next";
import { useRef, useMemo, useCallback } from "react";
import type { DMFormProps } from "../types";

interface ValidateErrorEntity {
  errorFields?: Array<{ name: string[] }>;
  outOfDate?: boolean;
  values?: Record<string, unknown>;
}

interface ExtendedFormInstance extends FormInstance {
  currentInitialValues?: Record<string, unknown>;
  setInitialValues?: (newInitialValues: Record<string, unknown>) => void;
  resetInitialValues?: () => void;
}

interface UseNormalizedPropsInput<T = Record<string, unknown>> extends Omit<
  DMFormProps<T>,
  "submitAsync" | "reset" | "onReset"
> {
  onSubmit?: (
    values: T,
    helpers: {
      success: (
        content?: string | null,
        options?: { initialValues?: Record<string, unknown> },
      ) => void;
      error: (content?: string | null) => void;
      form: FormInstance;
    },
    submitParams?: Record<string, unknown>,
  ) => void;
  onOk?: (
    values: T,
    helpers: {
      success: (
        content?: string | null,
        options?: { initialValues?: Record<string, unknown> },
      ) => void;
      error: (content?: string | null) => void;
      form: FormInstance;
    },
    submitParams?: Record<string, unknown>,
  ) => void;
  onFailed?: (errorInfo: {
    errorFields?: Array<{ name: string[] }>;
    outOfDate?: boolean;
    values?: Partial<T>;
  }) => void;
  onReset?: () => void;
  scrollToFieldOptions?: {
    block?: "start" | "center" | "end";
    behavior?: "auto" | "smooth";
  };
}

export default function useNormalizedProps<T = Record<string, unknown>>(
  props: UseNormalizedPropsInput<T>,
) {
  const { t } = useTranslation();
  const {
    form: outerForm,
    onSubmit,
    onOk,
    onFailed,
    onReset,
    scrollToFieldOptions,
    ...rest
  } = props;

  const [innerForm] = Form.useForm();
  const form = outerForm || innerForm;

  // 使用 ref 存储扩展属性，避免直接修改 form 对象
  const currentInitialValuesRef = useRef<Record<string, unknown> | undefined>(
    undefined,
  );

  const setInitialValues = useCallback(
    (newInitialValues: Record<string, unknown>) => {
      if (newInitialValues) {
        const fields = Object.entries(newInitialValues).map(([k, v]) => ({
          name: k,
          value: v,
          touched: false,
        }));

        form.setFields(fields);

        currentInitialValuesRef.current = newInitialValues;
      }
    },
    [form],
  );

  const resetInitialValues = useCallback(() => {
    const currentInitialValues = currentInitialValuesRef.current || {};

    const keys = Object.keys(form.getFieldsValue(true) || {});
    if (keys.length) {
      const fields = keys.map((item) => ({
        name: item,
        value:
          currentInitialValues[item] != null
            ? currentInitialValues[item]
            : undefined,
        touched: false,
      }));

      form.setFields(fields);
    }
  }, [form]);

  // 使用 useMemo 创建扩展的 form 对象，使用 getter/setter 访问 ref，避免在渲染期间直接访问 ref
  const extendedForm = useMemo(() => {
    return Object.assign(form, {
      get currentInitialValues() {
        return currentInitialValuesRef.current;
      },
      set currentInitialValues(value: Record<string, unknown> | undefined) {
        currentInitialValuesRef.current = value;
      },
      setInitialValues,
      resetInitialValues,
    }) as ExtendedFormInstance;
  }, [form, setInitialValues, resetInitialValues]);

  return {
    labelWrap: true,
    form: extendedForm,
    submitAsync: (submitParams = {}) => {
      return new Promise<void>((resolve, reject) => {
        form
          .validateFields()
          .then((newRecord: Record<string, unknown>) => {
            form.submit(); // 兼容 onFinish

            const push =
              onSubmit ||
              onOk ||
              ((
                newValue: T,
                {
                  success,
                }: {
                  success: (
                    content?: string | null,
                    options?: { initialValues?: Record<string, unknown> },
                  ) => void;
                },
              ) => {
                console.log("Submit:", newValue);
                success();
              });

            push(
              newRecord as T,
              {
                success: (
                  content?: string | null,
                  options?: { initialValues?: Record<string, unknown> },
                ) => {
                  if (content !== null) {
                    message.success({
                      key: "KEY_FORM",
                      content: content || t("operationSuccess"),
                      duration: 3,
                    });
                  }

                  setInitialValues(options?.initialValues || newRecord); // 复位 form.isFieldsTouched()

                  resolve(undefined);
                },
                error: (content?: string | null) => {
                  if (content !== null) {
                    message.error({
                      key: "KEY_FORM",
                      content: content || t("error.operationFailed"),
                      duration: 5,
                    });
                  }

                  reject();
                },
                form,
              },
              submitParams,
            );
          })
          .catch((rejectedReason: unknown) => {
            const errorInfo = rejectedReason as ValidateErrorEntity;
            if (onFailed) {
              onFailed({
                errorFields: errorInfo.errorFields,
                outOfDate: errorInfo.outOfDate,
                values: errorInfo.values as Partial<T> | undefined,
              });
            }
            if (errorInfo.errorFields) {
              form.scrollToField(errorInfo.errorFields[0]?.name, {
                block: "center",
                ...scrollToFieldOptions,
              });
            } else {
              console.log(rejectedReason);
            }
            reject();
          });
      });
    },

    reset: (newInitialValues?: Record<string, unknown>) => {
      if (newInitialValues) {
        setInitialValues(newInitialValues);
      } else {
        resetInitialValues();
      }

      if (onReset) {
        onReset();
      }
    },
    ...rest,
  };
}

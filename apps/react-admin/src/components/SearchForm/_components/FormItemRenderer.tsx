import {
  Input,
  InputNumber,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Checkbox,
  Radio,
  Upload,
  Form,
} from "antd";
import type { FormInstance } from "antd/es/form";
import type { SearchFormItemConfig } from "../types";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface FormItemRendererProps {
  item: SearchFormItemConfig;
  form: FormInstance;
}

/**
 * 表单项渲染组件
 * 根据配置的类型渲染对应的表单项
 */
const FormItemRenderer = ({ item, form }: FormItemRendererProps) => {
  const {
    type = "input",
    fieldProps = {},
    render,
    options = [],
    ...formItemProps
  } = item;

  // 自定义渲染
  if (render) {
    return <Form.Item {...formItemProps}>{render(form)}</Form.Item>;
  }

  // 根据类型渲染不同的输入组件
  const renderInput = () => {
    switch (type) {
      case "input":
        return <Input {...fieldProps} />;
      case "password":
        return <Input.Password {...fieldProps} />;
      case "textarea":
        return <TextArea {...fieldProps} />;
      case "number":
        return <InputNumber style={{ width: "100%" }} {...fieldProps} />;
      case "select":
        return <Select options={options} {...fieldProps} />;
      case "datePicker":
        return <DatePicker style={{ width: "100%" }} {...fieldProps} />;
      case "dateRangePicker":
        return <RangePicker style={{ width: "100%" }} {...fieldProps} />;
      case "timePicker":
        return <TimePicker style={{ width: "100%" }} {...fieldProps} />;
      case "switch":
        return <Switch {...fieldProps} />;
      case "checkbox":
        return <Checkbox.Group options={options} {...fieldProps} />;
      case "radio":
        return <Radio.Group options={options} {...fieldProps} />;
      case "upload":
        return <Upload {...fieldProps} />;
      case "custom":
        return null; // 自定义类型必须使用 render
      default:
        return <Input {...fieldProps} />;
    }
  };

  return <Form.Item {...formItemProps}>{renderInput()}</Form.Item>;
};

export default FormItemRenderer;


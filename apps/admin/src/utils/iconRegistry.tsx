/**
 * 图标注册表 - 仅导入管理后台常用图标，避免 lucide-react 全量导入
 * 新增图标时在此处添加，权限管理中输入的图标名称需与 lucide 组件名一致（支持 PascalCase 或 kebab-case）
 * @see https://lucide.dev/icons/
 */
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  User,
  Shield,
  ShieldCheck,
  Key,
  Settings,
  Home,
  Menu,
  FileText,
  Folder,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Bookmark,
  Star,
  Heart,
  Tag,
  Link,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  Save,
  X,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  CircleGauge,
  UserRound,
  UserRoundCog
} from "lucide-react";

/** 图标名 -> 组件的映射（仅包含实际使用的图标） */
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  User,
  Shield,
  ShieldCheck,
  Key,
  Settings,
  Home,
  Menu,
  FileText,
  Folder,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Bookmark,
  Star,
  Heart,
  Tag,
  Link,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  Save,
  X,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  CircleGauge,
  UserRound,
  UserRoundCog
};

/** 将 kebab-case 转为 PascalCase，如 layout-dashboard -> LayoutDashboard */
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

/**
 * 根据图标名称获取组件（支持 PascalCase 和 kebab-case）
 */
export function getIconComponent(iconName: string): LucideIcon | undefined {
  if (!iconName || typeof iconName !== "string") return undefined;
  const trimmed = iconName.trim();
  if (!trimmed) return undefined;

  // 直接查找
  let component = iconMap[trimmed];
  if (component) return component;

  // 尝试 kebab-case 转 PascalCase
  const pascalName = kebabToPascal(trimmed);
  component = iconMap[pascalName];
  if (component) return component;

  return undefined;
}

/** 获取已注册的图标名称列表（用于权限管理中的提示） */
export function getRegisteredIconNames(): string[] {
  return Object.keys(iconMap).sort();
}

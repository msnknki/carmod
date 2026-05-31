import React from 'react';
import type {LucideIcon} from 'lucide-react-native';
import {
  AlertCircle,
  AlertTriangle,
  Armchair,
  Bot,
  Camera,
  Car,
  Circle,
  CircleHelp,
  DollarSign,
  Home,
  Lightbulb,
  ListOrdered,
  MapPin,
  MessageCircle,
  MessagesSquare,
  ScanSearch,
  Search,
  Send,
  ShieldAlert,
  ShoppingCart,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Vibrate,
  Volume2,
  Warehouse,
  Wrench,
  X,
  Cog,
  Wind,
  Trash2,
  ChevronRight,
  ChevronDown,
  Check,
  XCircle,
  Phone,
  Globe,
  Clock,
  Download,
} from 'lucide-react-native';
import {useTheme} from '../../context/ThemeContext';

const ICON_MAP: Record<string, LucideIcon> = {
  'home-variant': Home,
  wrench: Wrench,
  'tune-variant': SlidersHorizontal,
  'robot-outline': Bot,
  'car-sports': Car,
  'garage-open': Warehouse,
  'camera-plus-outline': Camera,
  'cart-outline': ShoppingCart,
  stethoscope: Stethoscope,
  'map-marker-radius': MapPin,
  car: Car,
  'car-turbocharger': Car,
  'chat-processing-outline': MessagesSquare,
  send: Send,
  'volume-high': Volume2,
  engine: Cog,
  'car-light-alert': AlertTriangle,
  vibrate: Vibrate,
  'car-brake-alert': AlertCircle,
  'car-brake-abs': AlertCircle,
  snowflake: Snowflake,
  'magnify-scan': ScanSearch,
  'shield-alert': ShieldAlert,
  'toolbox-outline': Wrench,
  'format-list-numbered': ListOrdered,
  cash: DollarSign,
  'help-circle-outline': CircleHelp,
  'alert-circle': AlertCircle,
  magnify: Search,
  'storefront-outline': Store,
  star: Star,
  close: X,
  'trash-can-outline': Trash2,
  'chevron-right': ChevronRight,
  'close-circle': XCircle,
  'chat-outline': MessageCircle,
  tire: Circle,
  pipe: Wind,
  'car-light-dimmed': Lightbulb,
  'car-seat': Armchair,
  'image-plus': Camera,
  'chevron-down': ChevronDown,
  check: Check,
  phone: Phone,
  'web': Globe,
  'clock-outline': Clock,
  download: Download,
};

export type AppIconName = keyof typeof ICON_MAP;

type Props = {
  name: AppIconName | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const AppIcon = ({
  name,
  size = 22,
  color,
  strokeWidth = 2,
}: Props) => {
  const {colors} = useTheme();
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon size={size} color={color ?? colors.text} strokeWidth={strokeWidth} />;
};

export default AppIcon;

// BeefTrace Icon System - Using React Icons for consistency
// All icons inherit color from theme and adapt to light/dark mode

import { 
  // Navigation & Layout
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineBars3 as HiOutlineMenu,
  HiOutlineXMark as HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineMagnifyingGlass as HiOutlineSearch,
  HiOutlineBell,
  HiOutlineInformationCircle,
  
  // Actions
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineArrowDownTray as HiOutlineDownload,
  HiOutlineArrowUpTray as HiOutlineUpload,
  HiOutlineCheck,
  HiOutlineXCircle,
  HiOutlineExclamationCircle as HiOutlineExclamation,
  HiOutlineQuestionMarkCircle,
  
  // Status
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineArrowPath as HiOutlineRefresh,
  HiOutlineWifi,
  HiOutlineSignalSlash as HiOutlineWifiOff,
  HiOutlineCloud,
  
  // Role-specific
  HiOutlineBuildingOffice,
  HiOutlineTruck,
  HiOutlineMapPin,
  HiOutlineDocumentText,
  HiOutlineClipboardDocumentCheck,
  HiOutlineQrCode,
  HiOutlineCamera,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineUsers,
  
  // Animals & Agriculture
  HiOutlineCube,
  HiOutlineArchiveBox,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  
  // Theme
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi2';

// Icon mapping for easy access
export const Icons = {
  // Navigation
  home: HiOutlineHome,
  user: HiOutlineUser,
  settings: HiOutlineCog,
  menu: HiOutlineMenu,
  close: HiOutlineX,
  chevronLeft: HiOutlineChevronLeft,
  chevronRight: HiOutlineChevronRight,
  chevronDown: HiOutlineChevronDown,
  chevronUp: HiOutlineChevronUp,
  search: HiOutlineSearch,
  bell: HiOutlineBell,
  info: HiOutlineInformationCircle,
  
  // Actions
  plus: HiOutlinePlus,
  edit: HiOutlinePencil,
  trash: HiOutlineTrash,
  download: HiOutlineDownload,
  upload: HiOutlineUpload,
  check: HiOutlineCheck,
  xCircle: HiOutlineXCircle,
  exclamation: HiOutlineExclamation,
  question: HiOutlineQuestionMarkCircle,
  
  // Status
  checkCircle: HiOutlineCheckCircle,
  exclamationCircle: HiOutlineExclamationCircle,
  clock: HiOutlineClock,
  refresh: HiOutlineRefresh,
  wifi: HiOutlineWifi,
  wifiOff: HiOutlineWifiOff,
  cloud: HiOutlineCloud,
  
  // Role-specific
  building: HiOutlineBuildingOffice,
  truck: HiOutlineTruck,
  location: HiOutlineMapPin,
  document: HiOutlineDocumentText,
  verified: HiOutlineClipboardDocumentCheck,
  qrCode: HiOutlineQrCode,
  camera: HiOutlineCamera,
  calendar: HiOutlineCalendar,
  chart: HiOutlineChartBar,
  users: HiOutlineUsers,
  
  // Agriculture & Commerce
  package: HiOutlineCube,
  boxes: HiOutlineArchiveBox,
  cart: HiOutlineShoppingBag,
  dollar: HiOutlineCurrencyDollar,
  phone: HiOutlinePhone,
  email: HiOutlineEnvelope,
  globe: HiOutlineGlobeAlt,
  
  // Theme
  sun: HiOutlineSun,
  moon: HiOutlineMoon,
};

// Legacy compatibility - keep existing IconPaths for backward compatibility
export { IconPaths } from './IconPaths';

/**
 * Reusable Icon Component
 * - Automatically adapts to light/dark theme
 * - Consistent sizing and styling
 * - Accessible with aria-hidden by default
 * 
 * @param {string} name - Icon name from Icons object
 * @param {number} size - Icon size in pixels (default: 20)
 * @param {string} className - Additional CSS classes
 * @param {string} color - Override color (inherits from theme by default)
 * @param {boolean} animated - Enable subtle hover animation
 * @param {string} ariaLabel - Accessibility label (optional)
 */
export function Icon({ 
  name, 
  size = 20, 
  className = '', 
  color, 
  animated = false,
  ariaLabel 
}) {
  const IconComponent = Icons[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found. Available icons:`, Object.keys(Icons).join(', '));
    return null;
  }
  
  const baseClasses = `inline-flex items-center justify-center ${animated ? 'transition-transform duration-200 hover:scale-110' : ''} ${className}`;
  
  return (
    <span
      className={baseClasses}
      style={{ 
        fontSize: `${size}px`, 
        color: color || 'currentColor',
        lineHeight: 1
      }}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      <IconComponent />
    </span>
  );
}

/**
 * Status Icon Component - for badges, toasts, and status indicators
 */
export function StatusIcon({ status, size = 18 }) {
  const statusIcons = {
    success: { name: 'checkCircle', color: 'var(--success-600, #16a34a)' },
    error: { name: 'xCircle', color: 'var(--error-600, #dc2626)' },
    warning: { name: 'exclamationCircle', color: 'var(--warning-600, #ca8a04)' },
    info: { name: 'info', color: 'var(--info-600, #2563eb)' },
    loading: { name: 'refresh', color: 'var(--ink-600)' },
    offline: { name: 'wifiOff', color: 'var(--ink-600)' },
    online: { name: 'wifi', color: 'var(--success-600, #16a34a)' },
  };
  
  const config = statusIcons[status] || statusIcons.info;
  
  return (
    <Icon 
      name={config.name} 
      size={size} 
      color={config.color}
      animated={status === 'loading'}
      className={status === 'loading' ? 'animate-spin' : ''}
    />
  );
}

/**
 * Role Icon Component - icons for different user roles
 */
export function RoleIcon({ role, size = 22 }) {
  const roleIcons = {
    farmer: 'user',
    agent: 'user',
    transporter: 'truck',
    slaughterhouse: 'building',
    processor: 'package',
    distributor: 'boxes',
    retailer: 'cart',
    consumer: 'user',
    veterinary: 'clipboardDocumentCheck',
    admin: 'settings',
  };
  
  const iconName = roleIcons[role] || 'user';
  
  return <Icon name={iconName} size={size} />;
}


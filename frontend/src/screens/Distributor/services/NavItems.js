import { IconPaths } from '../../../components/icons'

// Shared nav item list for every distributor screen. Centralizing this means
// DistributorDashboard.jsx, ReceiveShipment.jsx, WarehouseInventory.jsx,
// ScheduleDelivery.jsx, and Recent.jsx all navigate identically instead of five
// separate hardcoded arrays that could drift out of sync.
//
// activeKey selects which item is highlighted on the current screen — pass one of:
// 'dashboard' | 'receive-shipment' | 'warehouse-inventory' | 'schedule-delivery'
// | 'delivery-tracking' | 'notifications' | 'settings'
export function getDistributorNavItems(navigate, activeKey) {
  return [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: IconPaths.grid,
      active: activeKey === 'dashboard',
      onClick: () => navigate('/dashboard/distributor'),
    },
    {
      key: 'receive-shipment',
      label: 'Incoming shipments',
      icon: IconPaths.warehouse,
      active: activeKey === 'receive-shipment',
      onClick: () => navigate('/dashboard/distributor/receive-shipment'),
    },
    {
      key: 'warehouse-inventory',
      label: 'Warehouse inventory',
      icon: IconPaths.boxes,
      active: activeKey === 'warehouse-inventory',
      onClick: () => navigate('/dashboard/distributor/warehouse-inventory'),
    },
    {
      key: 'schedule-delivery',
      label: 'Delivery scheduling',
      icon: IconPaths.schedule,
      active: activeKey === 'schedule-delivery',
      onClick: () => navigate('/dashboard/distributor/schedule-delivery'),
    },
    {
      key: 'delivery-tracking',
      label: 'Delivery tracking',
      icon: IconPaths.warehouse,
      active: activeKey === 'delivery-tracking',
      // No dedicated tracking screen exists yet — Schedule Delivery already lists
      // every in-transit delivery with a "Mark delivered" action, so this points
      // there too, same as the Dashboard's existing "Track all" link.
      onClick: () => navigate('/dashboard/distributor/schedule-delivery'),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: IconPaths.bell,
      active: activeKey === 'notifications',
      // No Notifications screen exists yet — a no-op rather than routing
      // somewhere that doesn't reflect what was clicked.
      onClick: () => {},
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: IconPaths.gear,
      active: activeKey === 'settings',
      // No Settings screen exists yet either.
      onClick: () => {},
    },
  ]
}
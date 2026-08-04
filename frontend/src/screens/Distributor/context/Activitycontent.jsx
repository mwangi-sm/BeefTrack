// Turns a DistributorDataContext activity-log entry into the JSX `text` node
// ActivityItem expects. Shared by DistributorDashboard.jsx (latest 3) and
// Recent.jsx (full history) so the two screens always describe the same
// event the same way.
export function activityContent(entry) {
  switch (entry.type) {
    case 'shipment-received':
      return (
        <>
          Shipment <b>{entry.batchId}</b> received into Ruiru warehouse
        </>
      )
    case 'shipment-canceled':
      return (
        <>
          Shipment <b>{entry.batchId}</b> request canceled
        </>
      )
    case 'delivery-scheduled':
      return (
        <>
          Delivery <b>{entry.deliveryId}</b> scheduled for {entry.detail}
        </>
      )
    case 'delivery-completed':
      return (
        <>
          Delivery <b>{entry.deliveryId}</b> completed to {entry.detail}
        </>
      )
    case 'profile-completed':
      return (
        <>
          Distributor profile set up for <b>{entry.detail}</b>
        </>
      )
    case 'profile-updated':
      return (
        <>
          Distributor profile updated for <b>{entry.detail}</b>
        </>
      )
    default:
      return null
  }
}
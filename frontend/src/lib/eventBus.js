const bus = new EventTarget()

export function emitCustomerScan(detail) {
  bus.dispatchEvent(new CustomEvent('customer-scan', { detail }))
}

export function onCustomerScan(handler) {
  const wrapped = (e) => handler(e.detail)
  bus.addEventListener('customer-scan', wrapped)
  return () => bus.removeEventListener('customer-scan', wrapped)
}

export default { emitCustomerScan, onCustomerScan }

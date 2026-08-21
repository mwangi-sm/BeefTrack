import { useEffect, useState } from 'react'
import { Icon, IconPaths } from '../../../components/icons'
import './FarmerLoadingStrip.css'

const LOADING_MESSAGES = [
  'Opening your farm workspace…',
  'Checking your latest animal records…',
  'Preparing your traceability summary…',
]

export function FarmerLoadingStrip() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length)
    }, 1800)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="farmer-loading-strip" role="status" aria-live="polite">
      <span className="farmer-loading-icon" aria-hidden="true">
        <Icon size={17}>{IconPaths.farm}</Icon>
      </span>
      <span className="farmer-loading-message">{LOADING_MESSAGES[messageIndex]}</span>
      <span className="farmer-loading-track" aria-hidden="true">
        <span className="farmer-loading-progress" />
      </span>
    </div>
  )
}

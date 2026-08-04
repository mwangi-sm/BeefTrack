import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// `basePath` is where AgentRoutes is actually mounted (e.g. "/dashboard/agent").
// See useFarmerFlow.jsx for why this can't just use relative navigate() calls.
export function useAgentFlow(basePath) {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [traceabilityHistory, setTraceabilityHistory] = useState([])

  const goAgentDashboard = () => navigate(basePath)
  const goAgentTraceability = () => navigate(`${basePath}/traceability`)
  const goBuyAnimal = () => navigate(`${basePath}/buy`)
  const goAnimalSaleDetails = (listingId) => navigate(`${basePath}/buy/${listingId}`)
  const goReceiveAnimal = () => navigate(`${basePath}/receive`)
  const goAgentNotBuilt = () => navigate(`${basePath}/not-built`)
  const goAgentTraceabilityHistory = () => navigate(`${basePath}/traceability/history`)
  const recordTraceabilityLookup = (value) => {
    setTraceabilityHistory((prev) => [...prev, { value, timestamp: new Date().toLocaleString() }])
  }

  const addToCart = (listingId) => setCart((prev) => (prev.includes(listingId) ? prev : [...prev, listingId]))
  const removeFromCart = (listingId) => setCart((prev) => prev.filter((id) => id !== listingId))

  return {
    cart,
    goAgentDashboard,
    goAgentTraceability,
    goBuyAnimal,
    goAnimalSaleDetails,
    goReceiveAnimal,
    goAgentNotBuilt,
    goAgentTraceabilityHistory,
    traceabilityHistory,
    recordTraceabilityLookup,
    addToCart,
    removeFromCart,
  }
}
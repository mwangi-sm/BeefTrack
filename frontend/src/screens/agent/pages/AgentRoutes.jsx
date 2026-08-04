//AgentRoutes.jsx code
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { AgentDashboard } from './AgentDashboard'
import { AgentTraceabilityHistory, AgentTraceabilityLookup } from './AgentTraceabilityLookup'
import { BuyAnimal } from './BuyAnimal'
import { AnimalSaleDetails } from './AnimalSaleDetails'
import { ReceiveAnimal } from './ReceiveAnimal'
import { Placeholder } from '../../public/StaticScreens'
import { SALE_LISTINGS } from '../data/saleListings'

function SaleDetailsPage({ flow, onToggleTheme, onLogout }) {
  const { listingId } = useParams()
  const listing = SALE_LISTINGS.find((l) => l.id === listingId)
  if (!listing) return <Navigate to="../buy" replace />
  return (
    <AnimalSaleDetails
      listing={listing}
      inCart={flow.cart.includes(listing.id)}
      onGoHome={flow.goAgentDashboard}
      onBack={flow.goBuyAnimal}
      onRequestPurchase={() => {}}
      onContactFarmer={() => {}}
      onAddToCart={() => flow.addToCart(listing.id)}
      onShare={() => {}}
      onToggleTheme={onToggleTheme}
      onLogout={onLogout}
    />
  )
}

export function AgentRoutes({ flow, onLogout, onToggleTheme }) {
  const navHandlers = {
    onGoHome: flow.goAgentDashboard,
    onGoNotBuilt: flow.goAgentNotBuilt,
  }

  return (
    <Routes>
      <Route
        index
        element={
          <AgentDashboard
            onLogout={onLogout}
            onToggleTheme={onToggleTheme}
            onGoTraceabilityLookup={flow.goAgentTraceability}
            onGoBuyAnimal={flow.goBuyAnimal}
            onGoReceiveAnimal={flow.goReceiveAnimal}
            {...navHandlers}
            onLookup={flow.recordTraceabilityLookup}
            history={flow.traceabilityHistory}
            onSeeHistory={flow.goAgentTraceabilityHistory}
          />
        }
      />
      <Route path="traceability/history" element={<AgentTraceabilityHistory onGoHome={flow.goAgentDashboard} history={flow.traceabilityHistory} onBack={flow.goAgentTraceability} />} />
      <Route
        path="traceability"
        element={
          <AgentTraceabilityLookup
            onGoHome={flow.goAgentDashboard}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...navHandlers}
          />
        }
      />
      <Route
        path="buy"
        element={
          <BuyAnimal
            cart={flow.cart}
            onGoHome={flow.goAgentDashboard}
            onViewDetails={flow.goAnimalSaleDetails}
            onRemoveFromCart={flow.removeFromCart}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...navHandlers}
          />
        }
      />
      <Route
        path="buy/:listingId"
        element={<SaleDetailsPage flow={flow} onToggleTheme={onToggleTheme} onLogout={onLogout} />}
      />
      <Route
        path="receive"
        element={
          <ReceiveAnimal
            onGoHome={flow.goAgentDashboard}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...navHandlers}
          />
        }
      />
      <Route
        path="not-built"
        element={
          <Placeholder
            roleName="This feature"
            onBack={flow.goAgentDashboard}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
          />
        }
      />
    </Routes>
  )
}

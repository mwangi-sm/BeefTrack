import { useContext } from 'react'
import { DistributorDataContext } from './DistributorDataContext'

export function useDistributorData() {
  const ctx = useContext(DistributorDataContext)
  if (!ctx) {
    throw new Error('useDistributorData must be used within a DistributorDataProvider')
  }
  return ctx
}

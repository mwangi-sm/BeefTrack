import { useContext } from 'react'
import { ProcessorDataContextInstance } from './ProcessorDataContextInstance'

/**
 * Access point for all Processor screens. Throws early if a component
 * tries to use it outside the ProcessorDataProvider, same guard pattern
 * as useDistributorData.
 */
export function useProcessorData() {
  const context = useContext(ProcessorDataContextInstance)
  if (context === undefined) {
    throw new Error('useProcessorData must be used within a ProcessorDataProvider')
  }
  return context
}
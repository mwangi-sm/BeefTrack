import { createContext } from 'react'

// Raw context object, kept separate from the Provider so components can
// import just the context reference without pulling in Provider logic.
// Mirrors the DistributorDataContextInstance split.
export const ProcessorDataContextInstance = createContext(undefined)
'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface MapCoordinates {
  latitude: number
  longitude: number
}

export interface MapStationItem {
  id: number
  rank: number
  displayName: string
  brand: string | null
  address: string | null
  city: string | null
  latitude: number
  longitude: number
  fuelPrice: number
  netFuelLiters: number
  travelDistanceKm: number
  travelFuelLiters: number
  navigationHref: string | null
  navigationLabel: string
  distanceSummary: string
}

export interface ResultsMapData {
  mode: 'nearby' | 'trip'
  fuelType: string
  isSelf: boolean
  origin: MapCoordinates | null
  destination?: MapCoordinates | null
  stations: MapStationItem[]
}

interface ResultsMapContextValue {
  mapData: ResultsMapData | null
  setMapData: (data: ResultsMapData | null) => void
  selectedStationId: number | null
  setSelectedStationId: (stationId: number | null) => void
}

const ResultsMapContext = createContext<ResultsMapContextValue | null>(null)

export function useResultsMap() {
  return useContext(ResultsMapContext)
}

export function ResultsMapProvider({ children }: { children: ReactNode }) {
  const [mapData, setMapDataState] = useState<ResultsMapData | null>(null)
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    null,
  )

  const setMapData = useCallback((nextData: ResultsMapData | null) => {
    setMapDataState(nextData)
    setSelectedStationId(nextData?.stations[0]?.id ?? null)
  }, [])

  const value = useMemo<ResultsMapContextValue>(
    () => ({
      mapData,
      setMapData,
      selectedStationId,
      setSelectedStationId,
    }),
    [mapData, setMapData, selectedStationId],
  )

  return (
    <ResultsMapContext.Provider value={value}>
      {children}
    </ResultsMapContext.Provider>
  )
}

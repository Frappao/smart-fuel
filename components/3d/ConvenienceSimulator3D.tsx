'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { isWebGLAvailable, getRecommendedDpr, disposeThreeHierarchy } from './webglUtils'

interface ConvenienceSimulator3DProps {
  initialBudget?: number
  initialConsumption?: number
}

type CyclePhase = 'outbound' | 'refueling' | 'return' | 'complete'

interface CarLiveTelemetry {
  phase: CyclePhase
  phaseLabel: string
  kmDriven: number
  fuelBurnedLiters: number
  fuelAddedLiters: number
  currentTankLiters: number
}

interface ScenarioPreset {
  id: string
  label: string
  badge: string
  budget: number
  consumption: number
  distanceFarKm: number
  priceFar: number
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'rabbocco',
    label: 'Rabbocco veloce (20€)',
    badge: '20€',
    budget: 20,
    consumption: 6.8,
    distanceFarKm: 10,
    priceFar: 1.749,
  },
  {
    id: 'standard',
    label: 'Pieno standard (50€)',
    badge: '50€',
    budget: 50,
    consumption: 6.8,
    distanceFarKm: 14,
    priceFar: 1.749,
  },
  {
    id: 'maxi',
    label: 'Maxi pieno (80€)',
    badge: '80€',
    budget: 80,
    consumption: 6.0,
    distanceFarKm: 8,
    priceFar: 1.719,
  },
  {
    id: 'suv',
    label: 'Auto assetata / SUV',
    badge: '10.2 L/100km',
    budget: 50,
    consumption: 10.2,
    distanceFarKm: 12,
    priceFar: 1.739,
  },
  {
    id: 'lunga_deviazione',
    label: 'Lunga deviazione',
    badge: '20 km',
    budget: 45,
    consumption: 7.2,
    distanceFarKm: 20,
    priceFar: 1.729,
  },
]

const CYCLE_DURATION_SECONDS = 11.5
const FAR_TIMINGS = { outboundEnd: 0.34, refuelEnd: 0.52, returnEnd: 0.86 } as const

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function smoothstep01(t: number): number {
  const c = clamp01(t)
  return c * c * (3 - 2 * c)
}

/**
 * Computes a car's position along its curve (0 = Origin, 1 = Station Canopy)
 * and its live fuel telemetry at normalized cycleProgress in [0, 1].
 */
export function computeCarCycleState(
  cycleProgress: number,
  timings: {
    outboundEnd: number
    refuelEnd: number
    returnEnd: number
  },
  oneWayDistanceKm: number,
  litersBought: number,
  totalRoundTripBurnLiters: number,
): {
  curveT: number
  isReturning: boolean
  isRefueling: boolean
  telemetry: CarLiveTelemetry
} {
  const p = clamp01(cycleProgress)
  const halfBurn = totalRoundTripBurnLiters / 2
  const roundTripKm = oneWayDistanceKm * 2

  if (p <= timings.outboundEnd) {
    const legT = smoothstep01(p / timings.outboundEnd)
    const burned = halfBurn * legT
    return {
      curveT: legT,
      isReturning: false,
      isRefueling: false,
      telemetry: {
        phase: 'outbound',
        phaseLabel: 'Andata',
        kmDriven: oneWayDistanceKm * legT,
        fuelBurnedLiters: burned,
        fuelAddedLiters: 0,
        currentTankLiters: -burned,
      },
    }
  }

  if (p <= timings.refuelEnd) {
    const refuelT = clamp01((p - timings.outboundEnd) / (timings.refuelEnd - timings.outboundEnd))
    const added = litersBought * refuelT
    return {
      curveT: 1,
      isReturning: false,
      isRefueling: true,
      telemetry: {
        phase: 'refueling',
        phaseLabel: 'Rifornimento',
        kmDriven: oneWayDistanceKm,
        fuelBurnedLiters: halfBurn,
        fuelAddedLiters: added,
        currentTankLiters: added - halfBurn,
      },
    }
  }

  if (p <= timings.returnEnd) {
    const legT = smoothstep01((p - timings.refuelEnd) / (timings.returnEnd - timings.refuelEnd))
    const burned = halfBurn + halfBurn * legT
    return {
      curveT: 1 - legT,
      isReturning: true,
      isRefueling: false,
      telemetry: {
        phase: 'return',
        phaseLabel: 'Ritorno',
        kmDriven: oneWayDistanceKm + oneWayDistanceKm * legT,
        fuelBurnedLiters: burned,
        fuelAddedLiters: litersBought,
        currentTankLiters: litersBought - burned,
      },
    }
  }

  return {
    curveT: 0,
    isReturning: false,
    isRefueling: false,
    telemetry: {
      phase: 'complete',
      phaseLabel: 'Arrivata',
      kmDriven: roundTripKm,
      fuelBurnedLiters: totalRoundTripBurnLiters,
      fuelAddedLiters: litersBought,
      currentTankLiters: litersBought - totalRoundTripBurnLiters,
    },
  }
}

export function formatCarHudFuel(telemetry: CarLiveTelemetry): string {
  const { phase, fuelBurnedLiters, fuelAddedLiters, currentTankLiters } = telemetry
  if (phase === 'outbound') {
    return `−${fuelBurnedLiters.toFixed(2)} L viaggio`
  }
  if (phase === 'refueling') {
    return `+${fuelAddedLiters.toFixed(1)} L pompa`
  }
  if (phase === 'return') {
    return `${currentTankLiters.toFixed(2)} L (−${fuelBurnedLiters.toFixed(2)} L)`
  }
  return `Netti: ${currentTankLiters.toFixed(2)} L`
}

/**
 * Resolves 2D screen coordinates for the two floating car HUD badges,
 * clamping them inside the container and preventing badge overlap at any camera angle.
 */
export function computeHudScreenPositions(
  rawA: { x: number; y: number },
  rawB: { x: number; y: number },
  width: number,
  height: number,
): { a: { x: number; y: number }; b: { x: number; y: number } } {
  const marginX = Math.min(64, Math.max(44, width * 0.16))
  const minY = 44
  const maxY = Math.max(minY + 40, height - 28)

  const clampX = (v: number) => Math.max(marginX, Math.min(width - marginX, v))
  const clampY = (v: number) => Math.max(minY, Math.min(maxY, v))

  let ax = clampX(rawA.x)
  let ay = clampY(rawA.y)
  let bx = clampX(rawB.x)
  let by = clampY(rawB.y)

  const minDx = 116
  const minDy = 38
  if (Math.abs(ax - bx) < minDx && Math.abs(ay - by) < minDy) {
    const midY = (ay + by) / 2
    const topIsA = ay <= by
    const upperY = clampY(midY - minDy / 2)
    const lowerY = clampY(upperY + minDy)
    const adjustedUpperY = clampY(lowerY - minDy)

    if (topIsA) {
      ay = adjustedUpperY
      by = lowerY
    } else {
      by = adjustedUpperY
      ay = lowerY
    }

    if (Math.abs(ax - bx) < 36) {
      ax = clampX(ax - 16)
      bx = clampX(bx + 16)
    }
  }

  return {
    a: { x: ax, y: ay },
    b: { x: bx, y: by },
  }
}

/**
 * Configures camera position and projection with continuous aspect-ratio scaling
 * so the full 3D diorama fits without horizontal clipping even on <360px mobile screens at 25km.
 */
export function configureCameraForAspect(camera: THREE.PerspectiveCamera, aspect: number): void {
  const safeAspect = Math.max(aspect, 0.55)
  const zoomScale = Math.max(1, 1.32 / safeAspect)
  camera.aspect = aspect
  camera.position.set(0.45, 9.8 * zoomScale, 13.2 * zoomScale)
  camera.lookAt(0.45, 0.15, 0.0)
  camera.updateProjectionMatrix()
}

/**
 * Disposes only BufferGeometry instances inside a group while preserving shared Material instances.
 */
export function disposeGroupGeometries(group: THREE.Object3D): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      child.geometry.dispose()
    }
  })
}

/**
 * Generates a continuous flat ribbon geometry along a 3D XZ curve.
 */
export function createRibbonGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  width: number,
  yOffset: number,
  segments = 72,
  startT = 0,
): THREE.BufferGeometry {
  const halfWidth = width / 2
  const clampedStart = clamp01(startT)
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const frac = i / segments
    const t = clampedStart + (1 - clampedStart) * frac
    const pt = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t).normalize()
    const normalXZ = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()

    const left = new THREE.Vector3().copy(pt).addScaledVector(normalXZ, halfWidth)
    const right = new THREE.Vector3().copy(pt).addScaledVector(normalXZ, -halfWidth)

    positions.push(left.x, yOffset, left.z)
    positions.push(right.x, yOffset, right.z)

    normals.push(0, 1, 0, 0, 1, 0)
    uvs.push(0, t, 1, t)

    if (i < segments) {
      const base = i * 2
      indices.push(base, base + 1, base + 2)
      indices.push(base + 1, base + 3, base + 2)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return geometry
}

/**
 * Generates dashed centerline markings along a 3D XZ curve.
 */
export function createDashedCenterlineGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  dashCount = 26,
  dashWidth = 0.06,
  yOffset = 0.032,
  startT = 0,
): THREE.BufferGeometry {
  const halfW = dashWidth / 2
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  let vertexOffset = 0

  for (let i = 0; i < dashCount; i++) {
    const t0 = (i + 0.18) / dashCount
    const t1 = (i + 0.68) / dashCount
    if (t0 < startT || t1 > 0.98) continue

    const p0 = curve.getPointAt(t0)
    const p1 = curve.getPointAt(t1)
    const tan0 = curve.getTangentAt(t0).normalize()
    const tan1 = curve.getTangentAt(t1).normalize()
    const n0 = new THREE.Vector3(-tan0.z, 0, tan0.x).normalize()
    const n1 = new THREE.Vector3(-tan1.z, 0, tan1.x).normalize()

    const v0 = new THREE.Vector3().copy(p0).addScaledVector(n0, halfW)
    const v1 = new THREE.Vector3().copy(p0).addScaledVector(n0, -halfW)
    const v2 = new THREE.Vector3().copy(p1).addScaledVector(n1, halfW)
    const v3 = new THREE.Vector3().copy(p1).addScaledVector(n1, -halfW)

    positions.push(
      v0.x, yOffset, v0.z,
      v1.x, yOffset, v1.z,
      v2.x, yOffset, v2.z,
      v3.x, yOffset, v3.z,
    )
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0)
    indices.push(
      vertexOffset, vertexOffset + 1, vertexOffset + 2,
      vertexOffset + 1, vertexOffset + 3, vertexOffset + 2,
    )
    vertexOffset += 4
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setIndex(indices)
  return geometry
}

/**
 * Builds the Far Route curve and Station B coordinates dynamically from distanceFarKm (4..25 km).
 * Uses two collinear forecourt alignment points before the canopy center so lateral deviation inside the canopy is zero.
 */
export function buildFarRouteData(distanceFarKm: number) {
  const tDist = clamp01((distanceFarKm - 4) / (25 - 4))
  const stationFarX = 1.9 + tDist * 3.5
  const stationFarZ = -1.1 - tDist * 2.1

  const drivingPoints = [
    new THREE.Vector3(-4.2, 0, 3.6), // Shared Origin
    new THREE.Vector3(-3.4, 0, 2.55), // Shared Trunk Midpoint
    new THREE.Vector3(-2.6, 0, 1.5), // Shared Y-Junction
    new THREE.Vector3(-0.9 + tDist * 0.4, 0, 0.95 + tDist * 0.25), // Smooth Right Branch Exit
    new THREE.Vector3(1.1 + tDist * 2.4, 0, 0.35 - tDist * 0.35), // Sweeping Highway Detour
    new THREE.Vector3(stationFarX, 0, stationFarZ + 1.65), // Forecourt Approach Entry aligned on -Z
    new THREE.Vector3(stationFarX, 0, stationFarZ + 0.85), // Canopy Island Entry aligned on -Z
    new THREE.Vector3(stationFarX, 0, stationFarZ), // Exact Center under Station B Canopy
  ]

  const roadMeshPoints = [
    ...drivingPoints,
    new THREE.Vector3(stationFarX, 0, stationFarZ - 0.95), // Extends through canopy exit
  ]

  return {
    stationFarX,
    stationFarZ,
    drivingCurve: new THREE.CatmullRomCurve3(drivingPoints, false, 'catmullrom', 0.45),
    roadMeshCurve: new THREE.CatmullRomCurve3(roadMeshPoints, false, 'catmullrom', 0.45),
    dashCount: Math.round(22 + tDist * 18),
  }
}

export default function ConvenienceSimulator3D({
  initialBudget = 50,
  initialConsumption = 6.8,
}: ConvenienceSimulator3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const carNearHudRef = useRef<HTMLDivElement>(null)
  const carFarHudRef = useRef<HTMLDivElement>(null)

  // Interactive parameters (default distanceFarKm = 14 so Station A wins by default while Station B has lower pump price)
  const [budget, setBudget] = useState(initialBudget)
  const [consumption, setConsumption] = useState(initialConsumption)
  const [priceNear] = useState(1.839)
  const [distanceNearKm] = useState(2.5) // A/R = 5.0 km
  const [priceFar, setPriceFar] = useState(1.749)
  const [distanceFarKm, setDistanceFarKm] = useState(14.0) // A/R = 28.0 km
  const [activePresetId, setActivePresetId] = useState<string | null>('standard')

  // Playback & Cycle controls
  const [isPlaying, setIsPlaying] = useState(true)
  const [cycleProgressUI, setCycleProgressUI] = useState(0)
  const [isSupported] = useState(() => (typeof window === 'undefined' ? true : isWebGLAvailable()))

  // Core Rifornio calculations
  const litersBoughtNear = budget / priceNear
  const travelBurnNear = (distanceNearKm * 2 * consumption) / 100
  const netNear = litersBoughtNear - travelBurnNear

  const litersBoughtFar = budget / priceFar
  const travelBurnFar = (distanceFarKm * 2 * consumption) / 100
  const netFar = litersBoughtFar - travelBurnFar

  const grossPumpDiffFarVsNear = litersBoughtFar - litersBoughtNear
  const extraBurnFarVsNear = travelBurnFar - travelBurnNear
  const winner = netNear >= netFar ? 'near' : 'far'
  const netDifferenceLiters = Math.abs(netNear - netFar)
  const referencePrice = winner === 'near' ? priceNear : priceFar
  const netDifferenceEuro = netDifferenceLiters * referencePrice

  // Dynamic cycle timings: Station A arrives earlier and returns home earlier than Station B,
  // while overlapping during the refueling and return windows for direct side-by-side phase inspection
  const nearTimings = useMemo(() => {
    const nearLegDuration = Number(
      (0.2 + (distanceNearKm / Math.max(distanceFarKm, 4)) * 0.08).toFixed(3),
    )
    return {
      outboundEnd: nearLegDuration,
      refuelEnd: 0.46,
      returnEnd: Number((0.46 + nearLegDuration).toFixed(3)),
    }
  }, [distanceNearKm, distanceFarKm])

  const nearCycleState = computeCarCycleState(
    cycleProgressUI,
    nearTimings,
    distanceNearKm,
    litersBoughtNear,
    travelBurnNear,
  )
  const farCycleState = computeCarCycleState(
    cycleProgressUI,
    FAR_TIMINGS,
    distanceFarKm,
    litersBoughtFar,
    travelBurnFar,
  )

  // Refs shared with the Three.js animation loop
  const cycleProgressRef = useRef(0)
  const resetCameraTriggerRef = useRef(false)
  const rebuildFarRoadRef = useRef<((distKm: number) => void) | null>(null)

  const simulationRef = useRef({
    winner,
    distanceNearKm,
    distanceFarKm,
    litersBoughtNear,
    travelBurnNear,
    netNear,
    litersBoughtFar,
    travelBurnFar,
    netFar,
    nearTimings,
    farTimings: FAR_TIMINGS,
    isPlaying,
  })

  useEffect(() => {
    simulationRef.current = {
      winner,
      distanceNearKm,
      distanceFarKm,
      litersBoughtNear,
      travelBurnNear,
      netNear,
      litersBoughtFar,
      travelBurnFar,
      netFar,
      nearTimings,
      farTimings: FAR_TIMINGS,
      isPlaying,
    }
  }, [
    winner,
    distanceNearKm,
    distanceFarKm,
    litersBoughtNear,
    travelBurnNear,
    netNear,
    litersBoughtFar,
    travelBurnFar,
    netFar,
    nearTimings,
    isPlaying,
  ])

  // Dynamically update 3D Far Road & Station B when distanceFarKm changes
  useEffect(() => {
    if (rebuildFarRoadRef.current) {
      rebuildFarRoadRef.current(distanceFarKm)
    }
  }, [distanceFarKm])

  const handleApplyPreset = (preset: ScenarioPreset) => {
    setActivePresetId(preset.id)
    setBudget(preset.budget)
    setConsumption(preset.consumption)
    setDistanceFarKm(preset.distanceFarKm)
    setPriceFar(preset.priceFar)
    cycleProgressRef.current = 0
    setCycleProgressUI(0)
    setIsPlaying(true)
  }

  const handleRestartCycle = () => {
    cycleProgressRef.current = 0
    setCycleProgressUI(0)
    setIsPlaying(true)
  }

  const handleJumpToProgress = (targetProgress: number) => {
    const clamped = clamp01(targetProgress)
    cycleProgressRef.current = clamped
    setCycleProgressUI(clamped)
  }

  const handleResetCamera = () => {
    resetCameraTriggerRef.current = true
  }

  useEffect(() => {
    if (!isSupported) {
      return
    }

    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    let animationFrameId: number
    const isDark =
      document.documentElement.classList.contains('dark') ||
      Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)

    // Scene & Camera
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(isDark ? 0x09090b : 0xf4f4f0)

    const initialWidth = container.clientWidth || 720
    const initialHeight = container.clientHeight || 420
    const initialAspect = initialWidth / initialHeight
    const camera = new THREE.PerspectiveCamera(38, initialAspect, 0.1, 100)
    configureCameraForAspect(camera, initialAspect)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setPixelRatio(getRecommendedDpr())
    renderer.setSize(initialWidth, initialHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.78 : 0.96)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfffbeb, isDark ? 1.45 : 1.65)
    sunLight.position.set(9, 16, 10)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 1024
    sunLight.shadow.mapSize.height = 1024
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 38
    sunLight.shadow.camera.left = -11
    sunLight.shadow.camera.right = 11
    sunLight.shadow.camera.top = 11
    sunLight.shadow.camera.bottom = -11
    scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, isDark ? 0.45 : 0.35)
    fillLight.position.set(-8, 6, -6)
    scene.add(fillLight)

    // Diorama World Group (rotatable by user drag)
    const worldGroup = new THREE.Group()
    scene.add(worldGroup)

    // 1. Diorama Terrain Island (Two-layered architectural base)
    const baseSlabGeo = new THREE.BoxGeometry(19.2, 0.45, 13.2)
    const baseSlabMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x18181b : 0xe4e2dd,
      roughness: 0.88,
      metalness: 0.06,
    })
    const baseSlab = new THREE.Mesh(baseSlabGeo, baseSlabMat)
    baseSlab.position.set(0.4, -0.225, 0.1)
    baseSlab.receiveShadow = true
    worldGroup.add(baseSlab)

    const plinthGeo = new THREE.BoxGeometry(19.6, 0.25, 13.6)
    const plinthMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x09090b : 0xd4d2cd,
      roughness: 0.7,
    })
    const plinth = new THREE.Mesh(plinthGeo, plinthMat)
    plinth.position.set(0.4, -0.52, 0.1)
    worldGroup.add(plinth)

    // Shared Road Materials
    const curbNearMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x065f46 : 0x6ee7b7,
      roughness: 0.7,
    })
    const curbFarMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x92400e : 0xfcd34d,
      roughness: 0.7,
    })
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x27272a : 0x3f3f46,
      roughness: 0.82,
    })
    const dashMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0xe4e4e7 : 0xfafafa,
    })

    // 2. Near Route Curve (Fixed, continuous from Origin -> Junction -> Station A Canopy)
    const nearDrivingPoints = [
      new THREE.Vector3(-4.2, 0, 3.6), // Shared Origin
      new THREE.Vector3(-3.4, 0, 2.55), // Shared Trunk Midpoint
      new THREE.Vector3(-2.6, 0, 1.5), // Shared Y-Junction
      new THREE.Vector3(-2.98, 0, 0.25), // Left Branch Curve
      new THREE.Vector3(-3.1, 0, -0.8), // Forecourt Approach Entry aligned on -Z
      new THREE.Vector3(-3.1, 0, -1.55), // Canopy Island Entry aligned on -Z
      new THREE.Vector3(-3.1, 0, -2.3), // Exact Center under Station A Canopy
    ]
    const nearRoadMeshPoints = [
      ...nearDrivingPoints,
      new THREE.Vector3(-3.1, 0, -3.25), // Extends through Station A canopy exit
    ]

    const pathNear = new THREE.CatmullRomCurve3(nearDrivingPoints, false, 'catmullrom', 0.45)
    const roadNearMeshCurve = new THREE.CatmullRomCurve3(nearRoadMeshPoints, false, 'catmullrom', 0.45)

    const roadNearGroup = new THREE.Group()
    const nearCurbMesh = new THREE.Mesh(createRibbonGeometry(roadNearMeshCurve, 1.46, 0.012, 64), curbNearMat)
    const nearAsphaltMesh = new THREE.Mesh(createRibbonGeometry(roadNearMeshCurve, 1.24, 0.022, 64), asphaltMat)
    const nearDashMesh = new THREE.Mesh(createDashedCenterlineGeometry(roadNearMeshCurve, 18, 0.055, 0.033), dashMat)
    nearCurbMesh.receiveShadow = true
    nearAsphaltMesh.receiveShadow = true
    roadNearGroup.add(nearCurbMesh, nearAsphaltMesh, nearDashMesh)
    worldGroup.add(roadNearGroup)

    // Junction Roundel to seamlessly blend the Y-split
    const junctionPadGeo = new THREE.CylinderGeometry(0.95, 1.0, 0.02, 28)
    const junctionPad = new THREE.Mesh(junctionPadGeo, asphaltMat)
    junctionPad.position.set(-2.6, 0.011, 1.5)
    junctionPad.receiveShadow = true
    worldGroup.add(junctionPad)

    // 3. Origin Plaza ("Casa / Punto di Partenza") at (-4.2, 0, 3.6)
    const originGroup = new THREE.Group()
    originGroup.position.set(-4.2, 0, 3.6)

    const originCourtOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(1.42, 1.48, 0.022, 36),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 }),
    )
    originCourtOuter.position.y = 0.01
    originGroup.add(originCourtOuter)

    const originCourtInner = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.32, 0.028, 36),
      asphaltMat,
    )
    originCourtInner.position.y = 0.014
    originCourtInner.receiveShadow = true
    originGroup.add(originCourtInner)

    // Stylized Miniature Home / Garage beside the origin court
    const houseGroup = new THREE.Group()
    houseGroup.position.set(-0.95, 0, 0.55)
    houseGroup.rotation.y = Math.PI / 5

    const houseWalls = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.62, 0.72),
      new THREE.MeshStandardMaterial({ color: isDark ? 0xd4d4d8 : 0xffffff, roughness: 0.5 }),
    )
    houseWalls.position.y = 0.31
    houseWalls.castShadow = true
    houseGroup.add(houseWalls)

    const houseRoof = new THREE.Mesh(
      new THREE.ConeGeometry(0.68, 0.42, 4),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 }),
    )
    houseRoof.position.y = 0.83
    houseRoof.rotation.y = Math.PI / 4
    houseRoof.castShadow = true
    houseGroup.add(houseRoof)

    const houseWindow = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.22, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    )
    houseWindow.position.set(0, 0.34, 0.35)
    houseGroup.add(houseWindow)
    originGroup.add(houseGroup)

    // Origin Location Pin Beacon
    const originPinBeacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x2563eb,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      }),
    )
    originPinBeacon.position.set(-0.95, 1.35, 0.55)
    originGroup.add(originPinBeacon)

    worldGroup.add(originGroup)

    // 4. Detailed Service Station Builder (Centered over the Z-axis fueling lane!)
    const createDetailedStation = (
      x: number,
      z: number,
      brandColor: number,
      emissiveColor: number,
      totemSide: -1 | 1,
    ) => {
      const group = new THREE.Group()
      group.position.set(x, 0, z)

      // Paved Forecourt Apron centered around the road lane (local X = 0)
      const forecourtGeo = new THREE.BoxGeometry(2.8, 0.02, 2.5)
      const forecourtMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x27272a : 0x52525b,
        roughness: 0.85,
      })
      const forecourt = new THREE.Mesh(forecourtGeo, forecourtMat)
      forecourt.position.set(0, 0.01, 0)
      forecourt.receiveShadow = true
      group.add(forecourt)

      // Refueling Bay Marking Box directly on the central lane (local X = 0, Z = 0)
      const bayBorderGeo = new THREE.RingGeometry(0.45, 0.54, 28)
      const bayBorderMat = new THREE.MeshBasicMaterial({
        color: brandColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      })
      const bayRing = new THREE.Mesh(bayBorderGeo, bayBorderMat)
      bayRing.rotation.x = -Math.PI / 2
      bayRing.position.set(0, 0.036, 0)
      group.add(bayRing)

      // Twin Raised Concrete Islands flanking the central fueling lane (local X = ±0.88)
      // This leaves local X in [-0.62, +0.62] completely clear for the car!
      const islandGeo = new THREE.BoxGeometry(0.36, 0.12, 1.85)
      const islandMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x71717a : 0xd4d4d8,
        roughness: 0.6,
      })
      const leftIsland = new THREE.Mesh(islandGeo, islandMat)
      leftIsland.position.set(-0.88, 0.06, 0)
      leftIsland.castShadow = true
      leftIsland.receiveShadow = true

      const rightIsland = new THREE.Mesh(islandGeo, islandMat)
      rightIsland.position.set(0.88, 0.06, 0)
      rightIsland.castShadow = true
      rightIsland.receiveShadow = true
      group.add(leftIsland, rightIsland)

      // 4 Canopy Pillars standing on the raised islands
      const pillarGeo = new THREE.CylinderGeometry(0.075, 0.075, 1.65, 12)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0xa1a1aa,
        metalness: 0.4,
        roughness: 0.3,
      })
      const pillarCoords: [number, number][] = [
        [-0.88, -0.68],
        [0.88, -0.68],
        [-0.88, 0.68],
        [0.88, 0.68],
      ]
      pillarCoords.forEach(([px, pz]) => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat)
        pillar.position.set(px, 0.85, pz)
        pillar.castShadow = true
        group.add(pillar)
      })

      // Detailed Fuel Pump Dispensers on the islands next to the car stop point
      const pumpBodyGeo = new THREE.BoxGeometry(0.24, 0.68, 0.36)
      const pumpBodyMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3 })
      const pumpHeaderGeo = new THREE.BoxGeometry(0.26, 0.18, 0.38)
      const pumpHeaderMat = new THREE.MeshStandardMaterial({
        color: brandColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.25,
      })
      const pumpScreenGeo = new THREE.BoxGeometry(0.27, 0.16, 0.2)
      const pumpScreenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })

      ;[-0.88, 0.88].forEach((ix) => {
        const dispenser = new THREE.Group()
        dispenser.position.set(ix, 0.12, 0)

        const body = new THREE.Mesh(pumpBodyGeo, pumpBodyMat)
        body.position.y = 0.34
        body.castShadow = true
        dispenser.add(body)

        const header = new THREE.Mesh(pumpHeaderGeo, pumpHeaderMat)
        header.position.y = 0.72
        dispenser.add(header)

        const screen = new THREE.Mesh(pumpScreenGeo, pumpScreenMat)
        screen.position.y = 0.46
        dispenser.add(screen)

        group.add(dispenser)
      })

      // Overhead Canopy centered at (0, 1.72, 0) directly over the road lane
      const canopyFasciaGeo = new THREE.BoxGeometry(2.55, 0.24, 2.2)
      const canopyFasciaMat = new THREE.MeshStandardMaterial({
        color: brandColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.18,
        roughness: 0.28,
      })
      const canopyFascia = new THREE.Mesh(canopyFasciaGeo, canopyFasciaMat)
      canopyFascia.position.y = 1.72
      canopyFascia.castShadow = true
      group.add(canopyFascia)

      const canopyDeckGeo = new THREE.BoxGeometry(2.38, 0.08, 2.04)
      const canopyDeckMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x18181b : 0xffffff,
        roughness: 0.4,
      })
      const canopyDeck = new THREE.Mesh(canopyDeckGeo, canopyDeckMat)
      canopyDeck.position.y = 1.85
      group.add(canopyDeck)

      // Recessed LED ceiling light strip under canopy
      const ceilingLightGeo = new THREE.PlaneGeometry(1.6, 1.5)
      const ceilingLightMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
      const ceilingLight = new THREE.Mesh(ceilingLightGeo, ceilingLightMat)
      ceilingLight.rotation.x = Math.PI / 2
      ceilingLight.position.y = 1.59
      group.add(ceilingLight)

      // Roadside Price Totem placed outside the forecourt
      const totemPoleGeo = new THREE.BoxGeometry(0.34, 2.15, 0.18)
      const totemMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 })
      const totem = new THREE.Mesh(totemPoleGeo, totemMat)
      totem.position.set(totemSide * 1.65, 1.07, 0.55)
      totem.castShadow = true
      group.add(totem)

      const boardGeo = new THREE.BoxGeometry(0.48, 0.78, 0.22)
      const boardMat = new THREE.MeshStandardMaterial({
        color: brandColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.45,
      })
      const board = new THREE.Mesh(boardGeo, boardMat)
      board.position.set(totemSide * 1.65, 1.65, 0.55)
      group.add(board)

      // Winner Halo Ring on ground
      const haloGeo = new THREE.RingGeometry(1.65, 1.9, 40)
      const haloMat = new THREE.MeshBasicMaterial({
        color: brandColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      })
      const halo = new THREE.Mesh(haloGeo, haloMat)
      halo.rotation.x = -Math.PI / 2
      halo.position.y = 0.03
      group.add(halo)

      return { group, halo, bayRing }
    }

    // Create Station A (Near - Emerald) centered on (-3.1, 0, -2.3)
    const stationNear = createDetailedStation(-3.1, -2.3, 0x10b981, 0x059669, -1)
    worldGroup.add(stationNear.group)

    // Create Station B (Far - Amber) & Dynamic Far Road
    const initialFarData = buildFarRouteData(simulationRef.current.distanceFarKm)
    const stationFar = createDetailedStation(
      initialFarData.stationFarX,
      initialFarData.stationFarZ,
      0xf59e0b,
      0xd97706,
      1,
    )
    worldGroup.add(stationFar.group)

    let pathFar = initialFarData.drivingCurve
    const roadFarGroup = new THREE.Group()
    worldGroup.add(roadFarGroup)

    const populateFarRoadMeshes = (farData: ReturnType<typeof buildFarRouteData>) => {
      disposeGroupGeometries(roadFarGroup)
      roadFarGroup.clear()

      const farCurb = new THREE.Mesh(
        createRibbonGeometry(farData.roadMeshCurve, 1.46, 0.011, 80, 0.18),
        curbFarMat,
      )
      const farAsphalt = new THREE.Mesh(
        createRibbonGeometry(farData.roadMeshCurve, 1.24, 0.021, 80, 0.18),
        asphaltMat,
      )
      const farDashes = new THREE.Mesh(
        createDashedCenterlineGeometry(farData.roadMeshCurve, farData.dashCount, 0.055, 0.032, 0.25),
        dashMat,
      )
      farCurb.receiveShadow = true
      farAsphalt.receiveShadow = true
      roadFarGroup.add(farCurb, farAsphalt, farDashes)

      stationFar.group.position.set(farData.stationFarX, 0, farData.stationFarZ)
      pathFar = farData.drivingCurve
    }

    populateFarRoadMeshes(initialFarData)

    rebuildFarRoadRef.current = (newDistanceFarKm: number) => {
      const updatedFarData = buildFarRouteData(newDistanceFarKm)
      populateFarRoadMeshes(updatedFarData)
    }

    // 5. Stylized Low-Poly Trees around Diorama Perimeter
    const createTree = (tx: number, tz: number, scale = 1) => {
      const tree = new THREE.Group()
      tree.position.set(tx, 0, tz)
      tree.scale.setScalar(scale)

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.11, 0.42, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }),
      )
      trunk.position.y = 0.21
      trunk.castShadow = true
      tree.add(trunk)

      const foliageMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x065f46 : 0x16a34a,
        roughness: 0.75,
      })
      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.75, 7), foliageMat)
      cone1.position.y = 0.65
      cone1.castShadow = true
      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 7), foliageMat)
      cone2.position.y = 1.02
      cone2.castShadow = true
      tree.add(cone1, cone2)

      return tree
    }

    const treePositions: [number, number, number][] = [
      [-6.8, 1.5, 1.05],
      [-6.2, -1.8, 0.9],
      [-5.6, -4.1, 1.15],
      [-0.8, -3.9, 0.95],
      [-0.9, 3.8, 1.0],
      [2.6, 3.6, 0.85],
      [6.8, 2.8, 1.1],
      [7.8, 0.4, 0.95],
    ]
    treePositions.forEach(([tx, tz, sc]) => {
      worldGroup.add(createTree(tx, tz, sc))
    })

    // 6. Detailed Low-Poly Cars (Auto A = Emerald, Auto B = Amber)
    const createCarModel = (bodyColor: number, accentColor: number) => {
      const car = new THREE.Group()

      // Lower chassis
      const bodyGeo = new THREE.BoxGeometry(0.72, 0.28, 1.38)
      const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.22,
        metalness: 0.45,
      })
      const body = new THREE.Mesh(bodyGeo, bodyMat)
      body.position.y = 0.24
      body.castShadow = true
      car.add(body)

      // Upper cabin
      const cabinGeo = new THREE.BoxGeometry(0.58, 0.24, 0.72)
      const cabinMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.15,
        metalness: 0.3,
      })
      const cabin = new THREE.Mesh(cabinGeo, cabinMat)
      cabin.position.set(0, 0.48, -0.06)
      cabin.castShadow = true
      car.add(cabin)

      // Roof color beacon strip
      const roofBeacon = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.05, 0.36),
        new THREE.MeshBasicMaterial({ color: accentColor }),
      )
      roofBeacon.position.set(0, 0.62, -0.06)
      car.add(roofBeacon)

      // 4 Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12)
      wheelGeo.rotateZ(Math.PI / 2)
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 })
      const wheelOffsets: [number, number][] = [
        [-0.36, 0.42],
        [0.36, 0.42],
        [-0.36, -0.42],
        [0.36, -0.42],
      ]
      wheelOffsets.forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat)
        wheel.position.set(wx, 0.14, wz)
        car.add(wheel)
      })

      // Front Headlights (+Z in local car frame is forward for lookAt)
      const headlightGeo = new THREE.SphereGeometry(0.065, 8, 8)
      const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb })
      const hlLeft = new THREE.Mesh(headlightGeo, headlightMat)
      hlLeft.position.set(-0.24, 0.25, 0.69)
      const hlRight = new THREE.Mesh(headlightGeo, headlightMat)
      hlRight.position.set(0.24, 0.25, 0.69)
      car.add(hlLeft, hlRight)

      // Rear Taillights (-Z in local car frame)
      const taillightGeo = new THREE.BoxGeometry(0.14, 0.06, 0.04)
      const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 })
      const tlLeft = new THREE.Mesh(taillightGeo, taillightMat)
      tlLeft.position.set(-0.22, 0.26, -0.69)
      const tlRight = new THREE.Mesh(taillightGeo, taillightMat)
      tlRight.position.set(0.22, 0.26, -0.69)
      car.add(tlLeft, tlRight)

      return car
    }

    const carNear = createCarModel(0x10b981, 0x34d399)
    const carFar = createCarModel(0xf59e0b, 0xfbbf24)
    worldGroup.add(carNear, carFar)

    // Orbit Drag Controls
    let isDragging = false
    let previousMouseX = 0
    let rotationVelocity = 0

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      previousMouseX = e.clientX
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - previousMouseX
      previousMouseX = e.clientX
      worldGroup.rotation.y += deltaX * 0.006
      rotationVelocity = deltaX * 0.00045
    }
    const onMouseUp = () => {
      isDragging = false
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true
        previousMouseX = e.touches[0].clientX
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return
      const deltaX = e.touches[0].clientX - previousMouseX
      previousMouseX = e.touches[0].clientX
      worldGroup.rotation.y += deltaX * 0.0075
      rotationVelocity = deltaX * 0.0005
    }
    const onTouchEnd = () => {
      isDragging = false
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    // Pause rendering when scrolled out of view
    let isVisible = true
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    })
    observer.observe(container)

    // Helper to position a car along its curve with lateral separation on the shared trunk
    const positionCarOnCurve = (
      car: THREE.Group,
      curve: THREE.CatmullRomCurve3,
      curveT: number,
      isReturning: boolean,
      trunkLateralSign: -1 | 1,
    ) => {
      const clampedT = clamp01(curveT)
      const pt = curve.getPointAt(clampedT)
      const tangent = curve.getTangentAt(clampedT).normalize()
      const normalXZ = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()

      // Smoothly separate the two cars on the shared trunk (t in [0, 0.34]) and center them (0) into the station lane
      const trunkBlend = 1 - smoothstep01((clampedT - 0.14) / 0.24)
      const lateralOffset = trunkLateralSign * 0.28 * trunkBlend

      car.position.copy(pt).addScaledVector(normalXZ, lateralOffset)

      const headingDir = isReturning ? tangent.clone().negate() : tangent
      const lookTarget = car.position.clone().add(headingDir)
      car.lookAt(lookTarget.x, car.position.y, lookTarget.z)
    }

    // Helper to project both 3D car positions to 2D floating HUD overlays with anti-overlap separation
    const tempProjVecA = new THREE.Vector3()
    const tempProjVecB = new THREE.Vector3()
    const applyCarHudTextAndPosition = (
      hudEl: HTMLDivElement | null,
      pos: { x: number; y: number },
      state: ReturnType<typeof computeCarCycleState>,
      stationLabel: string,
    ) => {
      if (!hudEl) return
      hudEl.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) translate(-50%, -100%)`

      const phaseBadgeEl = hudEl.querySelector('[data-hud-phase]')
      const fuelValueEl = hudEl.querySelector('[data-hud-fuel]')
      if (phaseBadgeEl) {
        phaseBadgeEl.textContent = `${stationLabel} • ${state.telemetry.phaseLabel}`
      }
      if (fuelValueEl) {
        fuelValueEl.textContent = formatCarHudFuel(state.telemetry)
      }
    }

    const updateBothCarHudOverlays = (
      nearState: ReturnType<typeof computeCarCycleState>,
      farState: ReturnType<typeof computeCarCycleState>,
    ) => {
      if (!container) return
      const width = container.clientWidth || 720
      const height = container.clientHeight || 420

      carNear.getWorldPosition(tempProjVecA)
      tempProjVecA.y += 1.05
      tempProjVecA.project(camera)

      carFar.getWorldPosition(tempProjVecB)
      tempProjVecB.y += 1.05
      tempProjVecB.project(camera)

      const rawA = {
        x: (tempProjVecA.x * 0.5 + 0.5) * width,
        y: (-(tempProjVecA.y * 0.5) + 0.5) * height,
      }
      const rawB = {
        x: (tempProjVecB.x * 0.5 + 0.5) * width,
        y: (-(tempProjVecB.y * 0.5) + 0.5) * height,
      }

      const resolved = computeHudScreenPositions(rawA, rawB, width, height)
      applyCarHudTextAndPosition(carNearHudRef.current, resolved.a, nearState, 'Auto A')
      applyCarHudTextAndPosition(carFarHudRef.current, resolved.b, farState, 'Auto B')
    }

    // Render Loop
    const clock = new THREE.Clock()
    let lastUiSyncTime = 0

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (!isVisible) return

      const delta = Math.min(clock.getDelta(), 0.1)
      const elapsed = clock.getElapsedTime()

      if (resetCameraTriggerRef.current) {
        worldGroup.rotation.y *= 0.8
        rotationVelocity = 0
        if (Math.abs(worldGroup.rotation.y) < 0.005) {
          worldGroup.rotation.y = 0
          resetCameraTriggerRef.current = false
        }
      } else if (!isDragging && Math.abs(rotationVelocity) > 0.00001) {
        worldGroup.rotation.y += rotationVelocity
        rotationVelocity *= 0.93
      }

      // Advance simulation cycle
      const sim = simulationRef.current
      if (sim.isPlaying) {
        cycleProgressRef.current += delta / CYCLE_DURATION_SECONDS
        if (cycleProgressRef.current > 1) {
          cycleProgressRef.current -= 1
        }
      }

      const currentCycleProgress = cycleProgressRef.current

      // Sync React UI state at ~12fps for smooth progress slider & telemetry readouts
      if (elapsed - lastUiSyncTime > 0.08) {
        lastUiSyncTime = elapsed
        setCycleProgressUI(currentCycleProgress)
      }

      // Compute both cars' positions and states
      const nearState = computeCarCycleState(
        currentCycleProgress,
        sim.nearTimings,
        sim.distanceNearKm,
        sim.litersBoughtNear,
        sim.travelBurnNear,
      )
      const farState = computeCarCycleState(
        currentCycleProgress,
        sim.farTimings,
        sim.distanceFarKm,
        sim.litersBoughtFar,
        sim.travelBurnFar,
      )

      positionCarOnCurve(carNear, pathNear, nearState.curveT, nearState.isReturning, -1)
      positionCarOnCurve(carFar, pathFar, farState.curveT, farState.isReturning, 1)

      // Animate Origin Beacon
      originPinBeacon.rotation.y = elapsed * 1.4
      originPinBeacon.position.y = 1.32 + Math.sin(elapsed * 3) * 0.06

      // Animate Refueling Bay Rings & Winner Halos
      const pulse = 0.55 + Math.sin(elapsed * 3.5) * 0.35
      ;(stationNear.halo.material as THREE.MeshBasicMaterial).opacity =
        sim.winner === 'near' ? pulse : 0
      ;(stationFar.halo.material as THREE.MeshBasicMaterial).opacity =
        sim.winner === 'far' ? pulse : 0

      stationNear.bayRing.scale.setScalar(nearState.isRefueling ? 1 + Math.sin(elapsed * 8) * 0.14 : 1)
      stationFar.bayRing.scale.setScalar(farState.isRefueling ? 1 + Math.sin(elapsed * 8) * 0.14 : 1)

      scene.updateMatrixWorld()
      updateBothCarHudOverlays(nearState, farState)

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!container) return
      const width = container.clientWidth || 720
      const height = container.clientHeight || 420
      const aspect = width / height
      configureCameraForAspect(camera, aspect)
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      rebuildFarRoadRef.current = null
      cancelAnimationFrame(animationFrameId)
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      disposeThreeHierarchy(scene)
      renderer.dispose()
    }
  }, [isSupported])

  // Relative bar widths for comparative breakdown
  const maxLitersScale = Math.max(litersBoughtNear, litersBoughtFar, 1)
  const nearNetPct = Math.max(0, Math.min(100, (netNear / maxLitersScale) * 100))
  const nearBurnPct = Math.max(0, Math.min(100 - nearNetPct, (travelBurnNear / maxLitersScale) * 100))
  const farNetPct = Math.max(0, Math.min(100, (netFar / maxLitersScale) * 100))
  const farBurnPct = Math.max(0, Math.min(100 - farNetPct, (travelBurnFar / maxLitersScale) * 100))

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Simulatore 3D Interattivo in Tempo Reale
          </span>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Perché il distributore più economico può farti spendere di più?
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Osserva le due auto partire insieme da casa, fare rifornimento sotto la pensilina e tornare indietro: il vero risparmio si misura sui <strong>Litri Netti rimasti al ritorno</strong>.
          </p>
        </div>
      </div>

      {/* Preset Quick Scenarios */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Scenari tipo (clicca per simulare)
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Scenari preimpostati">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-950'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:border-emerald-700'
                }`}
              >
                <span>{preset.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    isSelected
                      ? 'bg-black/20 text-white dark:bg-black/15 dark:text-zinc-950'
                      : 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-88 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950/5 shadow-inner sm:h-108 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {!isSupported ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            WebGL non è disponibile sul tuo browser. Puoi comunque utilizzare gli scenari e verificare il confronto matematico in tempo reale qui sotto.
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

            {/* Live 3D-Anchored Car HUD Pills */}
            <div
              ref={carNearHudRef}
              className="pointer-events-none absolute top-0 left-0 z-10 flex flex-col items-center rounded-lg border border-emerald-500/80 bg-zinc-950/85 px-2 py-1 text-[10px] leading-tight text-white shadow-md backdrop-blur-xs will-change-transform"
            >
              <span data-hud-phase className="font-bold text-emerald-400">
                Auto A • {nearCycleState.telemetry.phaseLabel}
              </span>
              <span data-hud-fuel className="font-mono font-semibold text-zinc-100">
                {formatCarHudFuel(nearCycleState.telemetry)}
              </span>
            </div>

            <div
              ref={carFarHudRef}
              className="pointer-events-none absolute top-0 left-0 z-10 flex flex-col items-center rounded-lg border border-amber-500/80 bg-zinc-950/85 px-2 py-1 text-[10px] leading-tight text-white shadow-md backdrop-blur-xs will-change-transform"
            >
              <span data-hud-phase className="font-bold text-amber-400">
                Auto B • {farCycleState.telemetry.phaseLabel}
              </span>
              <span data-hud-fuel className="font-mono font-semibold text-zinc-100">
                {formatCarHudFuel(farCycleState.telemetry)}
              </span>
            </div>

            {/* Top-Left Station A Summary Overlay */}
            <div className="pointer-events-none absolute top-2.5 left-2.5 z-20 flex max-w-[46%] flex-col gap-1 text-[10px] sm:top-3 sm:left-3 sm:max-w-none sm:gap-1.5 sm:text-xs">
              <div
                className={`rounded-xl border p-1.5 backdrop-blur-md transition-all sm:p-2.5 ${
                  winner === 'near'
                    ? 'border-emerald-500 bg-emerald-950/85 text-emerald-100 shadow-lg ring-2 ring-emerald-500/80'
                    : 'border-zinc-700 bg-zinc-900/80 text-zinc-300'
                }`}
              >
                <div className="flex flex-wrap items-center gap-1 font-bold sm:gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-400 sm:size-2.5" />
                  <span>Stazione A (Vicina)</span>
                  {winner === 'near' && (
                    <span className="rounded bg-emerald-500 px-1 py-0.5 text-[9px] font-black text-zinc-950 sm:px-1.5 sm:text-[10px]">
                      VINCENTE
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-0.5 text-[10px] sm:text-[11px]">
                  <div>
                    Prezzo: <span className="font-semibold">{priceNear.toFixed(3)} €/L</span> • A/R:{' '}
                    <span className="font-semibold">{(distanceNearKm * 2).toFixed(1)} km</span>
                  </div>
                  <div className="hidden sm:block">
                    Pompa: <span className="font-semibold">+{litersBoughtNear.toFixed(2)} L</span> • Viaggio:{' '}
                    <span className="font-semibold text-rose-300">−{travelBurnNear.toFixed(2)} L</span>
                  </div>
                  <div>
                    Litri netti: <span className="font-bold text-emerald-400">{netNear.toFixed(2)} L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-Right Station B Summary Overlay */}
            <div className="pointer-events-none absolute top-2.5 right-2.5 z-20 flex max-w-[46%] flex-col gap-1 text-[10px] sm:top-3 sm:right-3 sm:max-w-none sm:gap-1.5 sm:text-xs">
              <div
                className={`rounded-xl border p-1.5 backdrop-blur-md transition-all sm:p-2.5 ${
                  winner === 'far'
                    ? 'border-amber-500 bg-amber-950/85 text-amber-100 shadow-lg ring-2 ring-amber-500/80'
                    : 'border-zinc-700 bg-zinc-900/80 text-zinc-300'
                }`}
              >
                <div className="flex flex-wrap items-center gap-1 font-bold sm:gap-1.5">
                  <span className="size-2 rounded-full bg-amber-400 sm:size-2.5" />
                  <span>Stazione B (Lontana)</span>
                  {winner === 'far' && (
                    <span className="rounded bg-amber-400 px-1 py-0.5 text-[9px] font-black text-zinc-950 sm:px-1.5 sm:text-[10px]">
                      VINCENTE
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-0.5 text-[10px] sm:text-[11px]">
                  <div>
                    Prezzo: <span className="font-semibold">{priceFar.toFixed(3)} €/L</span> • A/R:{' '}
                    <span className="font-semibold">{(distanceFarKm * 2).toFixed(1)} km</span>
                  </div>
                  <div className="hidden sm:block">
                    Pompa: <span className="font-semibold">+{litersBoughtFar.toFixed(2)} L</span> • Viaggio:{' '}
                    <span className="font-semibold text-rose-300">−{travelBurnFar.toFixed(2)} L</span>
                  </div>
                  <div>
                    Litri netti: <span className="font-bold text-amber-300">{netFar.toFixed(2)} L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom-Left Origin Badge & Bottom-Right Camera Reset */}
            <div className="pointer-events-none absolute bottom-3 left-3 z-20 hidden sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-zinc-900/85 px-3 py-1 text-[11px] font-medium text-blue-200 backdrop-blur-xs">
                <span className="size-2 rounded-full bg-blue-400" />
                Casa / Punto di Partenza (ciclo A/R)
              </span>
            </div>

            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetCamera}
                className="rounded-full border border-zinc-700 bg-zinc-900/85 px-3 py-1 text-[11px] font-semibold text-zinc-200 backdrop-blur-xs transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                Centra visuale 3D
              </button>
            </div>
          </>
        )}
      </div>

      {/* Playback & Cycle Phase Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <span>{isPlaying ? '⏸ Pausa' : '▶ Riprendi'}</span>
          </button>
          <button
            type="button"
            onClick={handleRestartCycle}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            ↺ Riavvia viaggio
          </button>
        </div>

        {/* Interactive Phase Jump Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { label: '1. Andata', target: 0.14, active: cycleProgressUI < 0.34 },
            { label: '2. Rifornimento alla pompa', target: 0.42, active: cycleProgressUI >= 0.34 && cycleProgressUI < 0.52 },
            { label: '3. Ritorno a casa', target: 0.6, active: cycleProgressUI >= 0.52 && cycleProgressUI < 0.86 },
            { label: '4. Bilancio finale', target: 0.94, active: cycleProgressUI >= 0.86 },
          ].map((step) => (
            <button
              key={step.label}
              type="button"
              onClick={() => {
                setIsPlaying(false)
                handleJumpToProgress(step.target)
              }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                step.active
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
                  : 'bg-zinc-200/70 text-zinc-600 hover:bg-zinc-300/70 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Comparative Equation Breakdown (Pump Liters - Road Burn = Net Liters) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="comparative-breakdown">
        {/* Station A Breakdown Card */}
        <div
          className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
            winner === 'near'
              ? 'border-emerald-500/80 bg-emerald-50/50 shadow-xs dark:border-emerald-500/60 dark:bg-emerald-950/25'
              : 'border-zinc-200 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/30'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-emerald-500" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Stazione A (Vicina • {distanceNearKm.toFixed(1)} km)
                </h4>
              </div>
              <span className="rounded-full bg-zinc-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Stato: {nearCycleState.telemetry.phaseLabel} ({nearCycleState.telemetry.kmDriven.toFixed(1)} km)
              </span>
            </div>

            {/* Equation Row */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white/90 p-2.5 text-center text-xs shadow-2xs dark:bg-zinc-900/80">
              <div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Erogati alla pompa</div>
                <div className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  +{litersBoughtNear.toFixed(2)} L
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Bruciati nel viaggio A/R</div>
                <div className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                  −{travelBurnNear.toFixed(2)} L
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Litri Netti finali</div>
                <div className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  {netNear.toFixed(2)} L
                </div>
              </div>
            </div>
          </div>

          {/* Stacked Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${nearNetPct}%` }}
                title={`Litri netti nel serbatoio: ${netNear.toFixed(2)} L`}
              />
              <div
                className="h-full bg-rose-500/85 transition-all duration-300"
                style={{ width: `${nearBurnPct}%` }}
                title={`Bruciati nel viaggio A/R: ${travelBurnNear.toFixed(2)} L`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>Verde = Nel serbatoio ({netNear.toFixed(2)} L)</span>
              <span>Rosso = Consumo strada ({travelBurnNear.toFixed(2)} L)</span>
            </div>
          </div>
        </div>

        {/* Station B Breakdown Card */}
        <div
          className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
            winner === 'far'
              ? 'border-amber-500/80 bg-amber-50/50 shadow-xs dark:border-amber-500/60 dark:bg-amber-950/25'
              : 'border-zinc-200 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/30'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-amber-500" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Stazione B (Lontana • {distanceFarKm.toFixed(1)} km)
                </h4>
              </div>
              <span className="rounded-full bg-zinc-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Stato: {farCycleState.telemetry.phaseLabel} ({farCycleState.telemetry.kmDriven.toFixed(1)} km)
              </span>
            </div>

            {/* Equation Row */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white/90 p-2.5 text-center text-xs shadow-2xs dark:bg-zinc-900/80">
              <div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Erogati alla pompa</div>
                <div className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  +{litersBoughtFar.toFixed(2)} L
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Bruciati nel viaggio A/R</div>
                <div className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                  −{travelBurnFar.toFixed(2)} L
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Litri Netti finali</div>
                <div className="font-mono text-sm font-extrabold text-amber-700 dark:text-amber-400">
                  {netFar.toFixed(2)} L
                </div>
              </div>
            </div>
          </div>

          {/* Stacked Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${farNetPct}%` }}
                title={`Litri netti nel serbatoio: ${netFar.toFixed(2)} L`}
              />
              <div
                className="h-full bg-rose-500/85 transition-all duration-300"
                style={{ width: `${farBurnPct}%` }}
                title={`Bruciati nel viaggio A/R: ${travelBurnFar.toFixed(2)} L`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>Ambra = Nel serbatoio ({netFar.toFixed(2)} L)</span>
              <span>Rosso = Consumo strada ({travelBurnFar.toFixed(2)} L)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      <div
        className={`rounded-2xl border p-4 transition-all ${
          winner === 'near'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
            : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{winner === 'near' ? '🏆' : '⛽'}</div>
          <div className="space-y-1">
            <h4 className="font-bold">
              {winner === 'near'
                ? `La Stazione Vicina vince di +${netDifferenceLiters.toFixed(2)} Litri netti (~${netDifferenceEuro.toFixed(2)} €)!`
                : `La Stazione Lontana conviene di +${netDifferenceLiters.toFixed(2)} Litri netti (~${netDifferenceEuro.toFixed(2)} €)!`}
            </h4>
            <p className="text-sm opacity-90">
              {winner === 'near' ? (
                <>
                  Alla pompa la Stazione B eroga <strong>+{grossPumpDiffFarVsNear.toFixed(2)} L in più</strong> grazie
                  allo sconto di <strong>{((priceNear - priceFar) * 100).toFixed(1)} cent/L</strong>, ma il tragitto di{' '}
                  <strong>{(distanceFarKm * 2).toFixed(1)} km A/R</strong> brucia{' '}
                  <strong>{travelBurnFar.toFixed(2)} L</strong> (+{extraBurnFarVsNear.toFixed(2)} L rispetto ad A).
                  Tornato a casa, con la Stazione A ti restano più litri nel serbatoio!
                </>
              ) : (
                <>
                  Con un rifornimento di <strong>{budget} €</strong> e una distanza di{' '}
                  <strong>{(distanceFarKm * 2).toFixed(1)} km A/R</strong>, i{' '}
                  <strong>+{grossPumpDiffFarVsNear.toFixed(2)} L extra</strong> erogati dalla Stazione B superano il
                  carburante consumato per la deviazione ({travelBurnFar.toFixed(2)} L).
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Sliders Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Budget */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <label htmlFor="sim-slider-budget">Budget Rifornimento</label>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{budget} €</span>
          </div>
          <input
            id="sim-slider-budget"
            aria-label="Budget Rifornimento"
            type="range"
            min={20}
            max={100}
            step={5}
            value={budget}
            onChange={(e) => {
              setActivePresetId(null)
              setBudget(Number(e.target.value))
            }}
            className="accent-emerald-600"
          />
          <span className="text-[11px] text-zinc-500">Un importo più alto ammortizza meglio i km percorsi.</span>
        </div>

        {/* Consumo */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <label htmlFor="sim-slider-consumption">Consumo Veicolo</label>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{consumption.toFixed(1)} L/100km</span>
          </div>
          <input
            id="sim-slider-consumption"
            aria-label="Consumo Veicolo"
            type="range"
            min={4.0}
            max={12.0}
            step={0.2}
            value={consumption}
            onChange={(e) => {
              setActivePresetId(null)
              setConsumption(Number(e.target.value))
            }}
            className="accent-emerald-600"
          />
          <span className="text-[11px] text-zinc-500">Auto più assetate subiscono maggiormente le deviazioni.</span>
        </div>

        {/* Distanza Lontana */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <label htmlFor="sim-slider-distance-far">Distanza Stazione B</label>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {distanceFarKm.toFixed(1)} km (A/R {(distanceFarKm * 2).toFixed(1)}km)
            </span>
          </div>
          <input
            id="sim-slider-distance-far"
            aria-label="Distanza Stazione B"
            type="range"
            min={4}
            max={25}
            step={1}
            value={distanceFarKm}
            onChange={(e) => {
              setActivePresetId(null)
              setDistanceFarKm(Number(e.target.value))
            }}
            className="accent-amber-500"
          />
          <span className="text-[11px] text-zinc-500">Allunga o accorcia fisicamente la strada 3D verso B.</span>
        </div>

        {/* Prezzo Lontana */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <label htmlFor="sim-slider-price-far">Prezzo Stazione B</label>
            <span className="font-bold text-amber-600 dark:text-amber-400">{priceFar.toFixed(3)} €/L</span>
          </div>
          <input
            id="sim-slider-price-far"
            aria-label="Prezzo Stazione B"
            type="range"
            min={1.65}
            max={1.82}
            step={0.01}
            value={priceFar}
            onChange={(e) => {
              setActivePresetId(null)
              setPriceFar(Number(e.target.value))
            }}
            className="accent-amber-500"
          />
          <span className="text-[11px] text-zinc-500">
            Prezzo più basso di {((priceNear - priceFar) * 100).toFixed(1)} c€ rispetto ad A.
          </span>
        </div>
      </div>
    </div>
  )
}

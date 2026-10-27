'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { isWebGLAvailable, getRecommendedDpr, disposeThreeHierarchy } from './webglUtils'

interface ConvenienceSimulator3DProps {
  initialBudget?: number
  initialConsumption?: number
}

export default function ConvenienceSimulator3D({
  initialBudget = 50,
  initialConsumption = 6.8,
}: ConvenienceSimulator3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Interactive controls
  const [budget, setBudget] = useState(initialBudget)
  const [consumption, setConsumption] = useState(initialConsumption)
  const [priceNear, setPriceNear] = useState(1.839)
  const [distanceNearKm, setDistanceNearKm] = useState(2.5) // A/R = 5km
  const [priceFar, setPriceFar] = useState(1.749)
  const [distanceFarKm, setDistanceFarKm] = useState(12.0) // A/R = 24km
  const [activeSimulation, setActiveSimulation] = useState<'both' | 'near' | 'far'>('both')
  const [isSupported, setIsSupported] = useState(true)

  // Core calculations
  const litersBoughtNear = budget / priceNear
  const travelBurnNear = ((distanceNearKm * 2) * consumption) / 100
  const netNear = litersBoughtNear - travelBurnNear

  const litersBoughtFar = budget / priceFar
  const travelBurnFar = ((distanceFarKm * 2) * consumption) / 100
  const netFar = litersBoughtFar - travelBurnFar

  const winner = netNear >= netFar ? 'near' : 'far'
  const netDifference = Math.abs(netNear - netFar)

  // Simulation references for Three.js
  const simulationRef = useRef({
    winner,
    distanceFarKm,
    activeSimulation,
  })

  useEffect(() => {
    simulationRef.current = { winner, distanceFarKm, activeSimulation }
  }, [winner, distanceFarKm, activeSimulation])

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setIsSupported(false)
      return
    }

    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    let animationFrameId: number
    const isDark = document.documentElement.classList.contains('dark')

    // Scene & Camera
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(isDark ? 0x09090b : 0xf8fafc)

    const aspect = container.clientWidth / (container.clientHeight || 420)
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100)
    camera.position.set(0, 9, 13)
    camera.lookAt(0, 0.5, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    })
    renderer.setPixelRatio(getRecommendedDpr())
    renderer.setSize(container.clientWidth, container.clientHeight || 420)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 0.9)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.4 : 1.6)
    sunLight.position.set(8, 14, 8)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 1024
    sunLight.shadow.mapSize.height = 1024
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 30
    sunLight.shadow.camera.left = -10
    sunLight.shadow.camera.right = 10
    sunLight.shadow.camera.top = 10
    sunLight.shadow.camera.bottom = -10
    scene.add(sunLight)

    // Ground Plane with grid
    const groundGeo = new THREE.PlaneGeometry(24, 20)
    const groundMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x18181b : 0xedebe4,
      roughness: 0.9,
      metalness: 0.1,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Roads
    const roadGroup = new THREE.Group()

    // Base origin road
    const createRoad = (width: number, length: number, posX: number, posZ: number, rotY = 0) => {
      const roadGeo = new THREE.PlaneGeometry(width, length)
      const roadMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x27272a : 0x3f3f46,
        roughness: 0.8,
      })
      const road = new THREE.Mesh(roadGeo, roadMat)
      road.rotation.x = -Math.PI / 2
      road.rotation.z = rotY
      road.position.set(posX, 0.01, posZ)
      road.receiveShadow = true
      return road
    }

    // Main road from user origin
    roadGroup.add(createRoad(1.2, 5, -4, 2, 0))
    // Short road to Station Near
    roadGroup.add(createRoad(1.2, 4, -2.5, -1, Math.PI / 4))
    // Highway to Station Far
    roadGroup.add(createRoad(1.2, 9, 1.5, -0.5, -Math.PI / 3.2))
    scene.add(roadGroup)

    // User Origin Marker
    const originPinGeo = new THREE.CylinderGeometry(0.3, 0.05, 0.8, 16)
    const originPinMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.4, roughness: 0.2 })
    const originPin = new THREE.Mesh(originPinGeo, originPinMat)
    originPin.position.set(-4, 0.6, 4)
    originPin.castShadow = true
    scene.add(originPin)

    // Station Creator Helper
    const createStation = (x: number, z: number, brandColor: number) => {
      const group = new THREE.Group()
      group.position.set(x, 0, z)

      // Canopy roof
      const roofGeo = new THREE.BoxGeometry(2.4, 0.2, 1.8)
      const roofMat = new THREE.MeshStandardMaterial({ color: brandColor, roughness: 0.3 })
      const roof = new THREE.Mesh(roofGeo, roofMat)
      roof.position.y = 1.6
      roof.castShadow = true
      group.add(roof)

      // Pillars
      const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8)
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x71717a })
      const p1 = new THREE.Mesh(pillarGeo, pillarMat)
      p1.position.set(-0.9, 0.8, -0.6)
      p1.castShadow = true
      const p2 = new THREE.Mesh(pillarGeo, pillarMat)
      p2.position.set(0.9, 0.8, -0.6)
      p2.castShadow = true
      const p3 = new THREE.Mesh(pillarGeo, pillarMat)
      p3.position.set(-0.9, 0.8, 0.6)
      p3.castShadow = true
      const p4 = new THREE.Mesh(pillarGeo, pillarMat)
      p4.position.set(0.9, 0.8, 0.6)
      p4.castShadow = true
      group.add(p1, p2, p3, p4)

      // Pump Island
      const pumpGeo = new THREE.BoxGeometry(0.4, 0.7, 0.3)
      const pumpMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
      const pump = new THREE.Mesh(pumpGeo, pumpMat)
      pump.position.set(0, 0.35, 0)
      pump.castShadow = true
      group.add(pump)

      // Price totem
      const totemPoleGeo = new THREE.BoxGeometry(0.3, 2.2, 0.2)
      const totemMat = new THREE.MeshStandardMaterial({ color: 0x18181b })
      const totem = new THREE.Mesh(totemPoleGeo, totemMat)
      totem.position.set(1.5, 1.1, 0.6)
      totem.castShadow = true
      group.add(totem)

      // Totem LED Board
      const boardGeo = new THREE.BoxGeometry(0.5, 0.8, 0.22)
      const boardMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.4,
      })
      const board = new THREE.Mesh(boardGeo, boardMat)
      board.position.set(1.5, 1.8, 0.6)
      group.add(board)

      // Winner Halo (glowing ring)
      const haloGeo = new THREE.RingGeometry(1.5, 1.7, 32)
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      })
      const halo = new THREE.Mesh(haloGeo, haloMat)
      halo.rotation.x = -Math.PI / 2
      halo.position.y = 0.05
      group.add(halo)

      return { group, halo, roof }
    }

    // Near station (Emerald / Green)
    const stationNear = createStation(-1.8, -2.2, 0x059669)
    scene.add(stationNear.group)

    // Far station (Amber / Yellow)
    const stationFar = createStation(5.2, -3.2, 0xf59e0b)
    scene.add(stationFar.group)

    // Car Model (Low Poly)
    const carGroup = new THREE.Group()
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.35, 1.5)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2, metalness: 0.6 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.3
    body.castShadow = true
    carGroup.add(body)

    const cabinGeo = new THREE.BoxGeometry(0.65, 0.28, 0.8)
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.1 })
    const cabin = new THREE.Mesh(cabinGeo, cabinMat)
    cabin.position.set(0, 0.55, -0.1)
    cabin.castShadow = true
    carGroup.add(cabin)

    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.08, 8, 8)
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb })
    const l1 = new THREE.Mesh(lightGeo, lightMat)
    l1.position.set(-0.25, 0.3, 0.75)
    const l2 = new THREE.Mesh(lightGeo, lightMat)
    l2.position.set(0.25, 0.3, 0.75)
    carGroup.add(l1, l2)

    carGroup.position.set(-4, 0, 4)
    scene.add(carGroup)

    // Animation progress and trajectory curves
    const pathNear = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4, 0, 4),
      new THREE.Vector3(-3.5, 0, 1.5),
      new THREE.Vector3(-2.2, 0, -0.5),
      new THREE.Vector3(-1.8, 0, -1.8),
    ])

    const pathFar = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4, 0, 4),
      new THREE.Vector3(-2, 0, 2),
      new THREE.Vector3(1, 0, 0.5),
      new THREE.Vector3(3.5, 0, -1.5),
      new THREE.Vector3(5.2, 0, -2.8),
    ])

    let progress = 0
    let currentPath = pathNear
    let isHeadingNear = true

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
      scene.rotation.y += deltaX * 0.006
      rotationVelocity = deltaX * 0.0005
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
      scene.rotation.y += deltaX * 0.008
      rotationVelocity = deltaX * 0.0006
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

    // Visibility observer to pause animation when off-screen
    let isVisible = true
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    })
    observer.observe(container)

    // Render loop
    const clock = new THREE.Clock()
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (!isVisible) return

      const delta = clock.getDelta()
      const time = clock.getElapsedTime()

      // Damped rotation inertia
      if (!isDragging && Math.abs(rotationVelocity) > 0.00001) {
        scene.rotation.y += rotationVelocity
        rotationVelocity *= 0.94
      }

      // Update Winner Halos
      const { winner: currentWinner } = simulationRef.current
      const pulse = 0.5 + Math.sin(time * 3) * 0.4
      if (currentWinner === 'near') {
        ;(stationNear.halo.material as THREE.MeshBasicMaterial).opacity = pulse
        ;(stationFar.halo.material as THREE.MeshBasicMaterial).opacity = 0
      } else {
        ;(stationNear.halo.material as THREE.MeshBasicMaterial).opacity = 0
        ;(stationFar.halo.material as THREE.MeshBasicMaterial).opacity = pulse
      }

      // Animate Car driving
      progress += delta * 0.35
      if (progress > 1) {
        progress = 0
        // Switch between near and far simulation paths
        if (simulationRef.current.activeSimulation === 'near') {
          currentPath = pathNear
        } else if (simulationRef.current.activeSimulation === 'far') {
          currentPath = pathFar
        } else {
          isHeadingNear = !isHeadingNear
          currentPath = isHeadingNear ? pathNear : pathFar
        }
      }

      const point = currentPath.getPointAt(progress)
      carGroup.position.copy(point)

      // Look slightly ahead on trajectory
      const lookAheadProgress = Math.min(progress + 0.04, 1)
      const nextPoint = currentPath.getPointAt(lookAheadProgress)
      carGroup.lookAt(nextPoint.x, carGroup.position.y, nextPoint.z)

      renderer.render(scene, camera)
    }

    animate()

    // Resize Handler
    const handleResize = () => {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight || 420
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
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
  }, [])

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Simulatore 3D Interattivo
          </span>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Perché il distributore più economico può farti spendere di più?
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Trascina la scena 3D per esplorare l&apos;incrocio. Modifica i parametri sottostanti per verificare il calcolo matematico in tempo reale.
          </p>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-80 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950/5 shadow-inner sm:h-96 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {!isSupported ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            WebGL non è disponibile sul tuo browser. Puoi comunque visualizzare i risultati matematici nel pannello sottostante.
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

            {/* 3D Floating Overlays / Badges */}
            <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-2 text-xs">
              <div
                className={`rounded-xl border p-2.5 backdrop-blur-md transition-all ${
                  winner === 'near'
                    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-100 shadow-lg ring-2 ring-emerald-500'
                    : 'border-zinc-700 bg-zinc-900/75 text-zinc-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                  Stazione A (Vicina)
                  {winner === 'near' && (
                    <span className="rounded bg-emerald-500 px-1.5 py-0.2 text-[10px] font-black text-zinc-950">
                      VINCENTE
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-0.5 text-[11px]">
                  <div>Prezzo: <span className="font-semibold">{priceNear.toFixed(3)} €/L</span></div>
                  <div>Distanza A/R: <span className="font-semibold">{(distanceNearKm * 2).toFixed(1)} km</span></div>
                  <div>Litri netti: <span className="font-bold text-emerald-400">{netNear.toFixed(2)} L</span></div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute top-3 right-3 flex flex-col gap-2 text-xs">
              <div
                className={`rounded-xl border p-2.5 backdrop-blur-md transition-all ${
                  winner === 'far'
                    ? 'border-amber-500 bg-amber-950/80 text-amber-100 shadow-lg ring-2 ring-amber-500'
                    : 'border-zinc-700 bg-zinc-900/75 text-zinc-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  Stazione B (Lontana)
                  {winner === 'far' && (
                    <span className="rounded bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-zinc-950">
                      VINCENTE
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-0.5 text-[11px]">
                  <div>Prezzo: <span className="font-semibold">{priceFar.toFixed(3)} €/L</span></div>
                  <div>Distanza A/R: <span className="font-semibold">{(distanceFarKm * 2).toFixed(1)} km</span></div>
                  <div>Litri netti: <span className="font-bold text-amber-300">{netFar.toFixed(2)} L</span></div>
                </div>
              </div>
            </div>

            {/* Bottom floating hint */}
            <div className="pointer-events-none absolute bottom-3 inset-x-0 flex justify-center">
              <span className="rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-medium text-zinc-300 backdrop-blur-sm">
                Trascina per ruotare la visuale 3D
              </span>
            </div>
          </>
        )}
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
                ? `La Stazione Vicina vince di +${netDifference.toFixed(2)} Litri netti effettivi!`
                : `La Stazione Lontana conviene di +${netDifference.toFixed(2)} Litri netti effettivi!`}
            </h4>
            <p className="text-sm opacity-90">
              {winner === 'near' ? (
                <>
                  Anche se il prezzo alla pompa della Stazione B è inferiore di{' '}
                  <strong>{((priceNear - priceFar) * 100).toFixed(1)} centesimi/litro</strong>,
                  la deviazione stradale di <strong>{(distanceFarKm * 2).toFixed(1)} km A/R</strong> brucia{' '}
                  <strong>{travelBurnFar.toFixed(2)} Litri</strong> solo per il tragitto. Alla Stazione A ti rimangono più litri nel serbatoio!
                </>
              ) : (
                <>
                  Con una spesa elevata di {budget}€ o una deviazione contenuta, lo sconto della Stazione B supera il consumo di viaggio.{' '}
                  Rifornio trova esattamente questa soglia di convenienza matematica per ogni tuo viaggio.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Budget */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Budget Rifornimento</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{budget} €</span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            step={5}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="accent-emerald-600"
          />
          <span className="text-[11px] text-zinc-500">Un importo più alto ammortizza meglio i km percorsi.</span>
        </div>

        {/* Consumo */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Consumo Veicolo</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{consumption.toFixed(1)} L/100km</span>
          </div>
          <input
            type="range"
            min={4.0}
            max={12.0}
            step={0.2}
            value={consumption}
            onChange={(e) => setConsumption(Number(e.target.value))}
            className="accent-emerald-600"
          />
          <span className="text-[11px] text-zinc-500">Auto più assetate subiscono maggiormente le deviazioni.</span>
        </div>

        {/* Distanza Lontana */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Distanza Stazione B</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{distanceFarKm.toFixed(1)} km (A/R {(distanceFarKm * 2).toFixed(1)}km)</span>
          </div>
          <input
            type="range"
            min={4}
            max={25}
            step={1}
            value={distanceFarKm}
            onChange={(e) => setDistanceFarKm(Number(e.target.value))}
            className="accent-amber-500"
          />
          <span className="text-[11px] text-zinc-500">Aumenta la distanza per vedere quando la convenienza si azzera.</span>
        </div>

        {/* Prezzo Lontana */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Prezzo Stazione B</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{priceFar.toFixed(3)} €/L</span>
          </div>
          <input
            type="range"
            min={1.65}
            max={1.82}
            step={0.01}
            value={priceFar}
            onChange={(e) => setPriceFar(Number(e.target.value))}
            className="accent-amber-500"
          />
          <span className="text-[11px] text-zinc-500">Prezzo più basso di {((priceNear - priceFar) * 100).toFixed(1)} c€ rispetto ad A.</span>
        </div>
      </div>
    </div>
  )
}

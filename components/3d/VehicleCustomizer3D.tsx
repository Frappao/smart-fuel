'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { isWebGLAvailable, getRecommendedDpr, disposeThreeHierarchy } from './webglUtils'
import type { SupportedFuelType } from '../../lib/fuels/supportedFuelTypes'

export type VehicleBodyType = 'utilitaria' | 'berlina' | 'suv' | 'station_wagon'

interface VehicleCustomizer3DProps {
  initialBodyType?: VehicleBodyType
  initialColor?: string
  fuelType?: SupportedFuelType
  consumptionL100km?: number
  vehicleName?: string
  onBodyTypeChange?: (bodyType: VehicleBodyType) => void
  onColorChange?: (colorHex: string) => void
}

const BODY_TYPES: { id: VehicleBodyType; label: string; icon: string }[] = [
  { id: 'utilitaria', label: 'Utilitaria', icon: '🚗' },
  { id: 'berlina', label: 'Berlina', icon: '🚘' },
  { id: 'suv', label: 'SUV', icon: '🚙' },
  { id: 'station_wagon', label: 'Station Wagon', icon: '🚐' },
]

const COLORS = [
  { hex: '#059669', name: 'Smeraldo Rifornio' },
  { hex: '#2563eb', name: 'Blu Oceano' },
  { hex: '#dc2626', name: 'Rosso Corsa' },
  { hex: '#71717a', name: 'Grigio Titanio' },
  { hex: '#18181b', name: 'Nero Notte' },
  { hex: '#f8fafc', name: 'Bianco Perla' },
]

export default function VehicleCustomizer3D({
  initialBodyType = 'berlina',
  initialColor = '#059669',
  fuelType = 'Benzina',
  consumptionL100km = 6.2,
  vehicleName = 'La mia auto',
  onBodyTypeChange,
  onColorChange,
}: VehicleCustomizer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bodyType, setBodyType] = useState<VehicleBodyType>(initialBodyType)
  const [color, setColor] = useState(initialColor)
  const [isSupported, setIsSupported] = useState(true)

  const stateRef = useRef({ bodyType, color })
  useEffect(() => {
    stateRef.current = { bodyType, color }
  }, [bodyType, color])

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

    const scene = new THREE.Scene()
    const aspect = container.clientWidth / (container.clientHeight || 320)
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50)
    camera.position.set(3.8, 2.2, 4.2)
    camera.lookAt(0, 0.4, 0)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(getRecommendedDpr())
    renderer.setSize(container.clientWidth, container.clientHeight || 320)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.1)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
    keyLight.position.set(5, 7, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8)
    fillLight.position.set(-5, 2, -4)
    scene.add(fillLight)

    // Stylized Showroom Turntable Floor
    const turntableGeo = new THREE.CylinderGeometry(2.4, 2.5, 0.1, 48)
    const turntableMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x27272a : 0xe4e4e7,
      metalness: 0.3,
      roughness: 0.4,
    })
    const turntable = new THREE.Mesh(turntableGeo, turntableMat)
    turntable.position.y = -0.05
    turntable.receiveShadow = true
    scene.add(turntable)

    const ringGlowGeo = new THREE.RingGeometry(2.35, 2.45, 48)
    const ringGlowMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    })
    const ringGlow = new THREE.Mesh(ringGlowGeo, ringGlowMat)
    ringGlow.rotation.x = -Math.PI / 2
    ringGlow.position.y = 0.005
    scene.add(ringGlow)

    // Vehicle Group on turntable
    const vehicleGroup = new THREE.Group()
    scene.add(vehicleGroup)

    let currentVehicleMeshGroup: THREE.Group | null = null

    const createWheel = (x: number, y: number, z: number, radius = 0.28, width = 0.18) => {
      const wheelGroup = new THREE.Group()
      wheelGroup.position.set(x, y, z)

      // Tire
      const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24)
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 })
      const tire = new THREE.Mesh(tireGeo, tireMat)
      tire.rotation.z = Math.PI / 2
      tire.castShadow = true
      wheelGroup.add(tire)

      // Rim
      const rimGeo = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, width * 1.05, 16)
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.9, roughness: 0.1 })
      const rim = new THREE.Mesh(rimGeo, rimMat)
      rim.rotation.z = Math.PI / 2
      wheelGroup.add(rim)

      return wheelGroup
    }

    const buildVehicleModel = (type: VehicleBodyType, colorHex: string) => {
      const car = new THREE.Group()
      const carColor = new THREE.Color(colorHex)
      const bodyMat = new THREE.MeshStandardMaterial({
        color: carColor,
        metalness: 0.6,
        roughness: 0.25,
      })
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        metalness: 0.8,
        roughness: 0.1,
      })

      if (type === 'utilitaria') {
        // Compact Hatchback
        const lowerGeo = new THREE.BoxGeometry(1.4, 0.45, 2.6)
        const lower = new THREE.Mesh(lowerGeo, bodyMat)
        lower.position.y = 0.4
        lower.castShadow = true
        car.add(lower)

        const cabinGeo = new THREE.BoxGeometry(1.25, 0.45, 1.4)
        const cabin = new THREE.Mesh(cabinGeo, glassMat)
        cabin.position.set(0, 0.8, -0.2)
        cabin.castShadow = true
        car.add(cabin)

        // Wheels
        car.add(createWheel(-0.75, 0.28, 0.8))
        car.add(createWheel(0.75, 0.28, 0.8))
        car.add(createWheel(-0.75, 0.28, -0.8))
        car.add(createWheel(0.75, 0.28, -0.8))
      } else if (type === 'suv') {
        // High-riding SUV
        const lowerGeo = new THREE.BoxGeometry(1.5, 0.6, 3.0)
        const lower = new THREE.Mesh(lowerGeo, bodyMat)
        lower.position.y = 0.55
        lower.castShadow = true
        car.add(lower)

        const cabinGeo = new THREE.BoxGeometry(1.35, 0.55, 1.9)
        const cabin = new THREE.Mesh(cabinGeo, glassMat)
        cabin.position.set(0, 1.05, -0.2)
        cabin.castShadow = true
        car.add(cabin)

        // Roof rails
        const railGeo = new THREE.BoxGeometry(0.06, 0.06, 1.8)
        const railMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.8 })
        const r1 = new THREE.Mesh(railGeo, railMat)
        r1.position.set(-0.6, 1.35, -0.2)
        const r2 = new THREE.Mesh(railGeo, railMat)
        r2.position.set(0.6, 1.35, -0.2)
        car.add(r1, r2)

        // Larger SUV Wheels
        car.add(createWheel(-0.8, 0.35, 0.95, 0.34, 0.22))
        car.add(createWheel(0.8, 0.35, 0.95, 0.34, 0.22))
        car.add(createWheel(-0.8, 0.35, -0.95, 0.34, 0.22))
        car.add(createWheel(0.8, 0.35, -0.95, 0.34, 0.22))
      } else if (type === 'station_wagon') {
        // Elongated Wagon
        const lowerGeo = new THREE.BoxGeometry(1.4, 0.45, 3.3)
        const lower = new THREE.Mesh(lowerGeo, bodyMat)
        lower.position.y = 0.4
        lower.castShadow = true
        car.add(lower)

        const cabinGeo = new THREE.BoxGeometry(1.22, 0.45, 2.1)
        const cabin = new THREE.Mesh(cabinGeo, glassMat)
        cabin.position.set(0, 0.8, -0.3)
        cabin.castShadow = true
        car.add(cabin)

        // Wheels
        car.add(createWheel(-0.75, 0.28, 1.0))
        car.add(createWheel(0.75, 0.28, 1.0))
        car.add(createWheel(-0.75, 0.28, -1.0))
        car.add(createWheel(0.75, 0.28, -1.0))
      } else {
        // Sleek Berlina (Sedan)
        const lowerGeo = new THREE.BoxGeometry(1.42, 0.45, 3.1)
        const lower = new THREE.Mesh(lowerGeo, bodyMat)
        lower.position.y = 0.4
        lower.castShadow = true
        car.add(lower)

        const cabinGeo = new THREE.BoxGeometry(1.22, 0.42, 1.5)
        const cabin = new THREE.Mesh(cabinGeo, glassMat)
        cabin.position.set(0, 0.8, -0.1)
        cabin.castShadow = true
        car.add(cabin)

        // Wheels
        car.add(createWheel(-0.75, 0.28, 0.95))
        car.add(createWheel(0.75, 0.28, 0.95))
        car.add(createWheel(-0.75, 0.28, -0.95))
        car.add(createWheel(0.75, 0.28, -0.95))
      }

      // Headlights & Taillights
      const hlGeo = new THREE.BoxGeometry(0.25, 0.1, 0.05)
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef08a })
      const hl1 = new THREE.Mesh(hlGeo, hlMat)
      hl1.position.set(-0.45, 0.45, 1.45)
      const hl2 = new THREE.Mesh(hlGeo, hlMat)
      hl2.position.set(0.45, 0.45, 1.45)
      car.add(hl1, hl2)

      const tlGeo = new THREE.BoxGeometry(0.25, 0.08, 0.05)
      const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 })
      const tl1 = new THREE.Mesh(tlGeo, tlMat)
      tl1.position.set(-0.45, 0.45, -1.45)
      const tl2 = new THREE.Mesh(tlGeo, tlMat)
      tl2.position.set(0.45, 0.45, -1.45)
      car.add(tl1, tl2)

      // Fuel flap indicator (Right rear quarter)
      const flapGeo = new THREE.CircleGeometry(0.08, 16)
      const flapColor = fuelType === 'Gasolio' ? 0xeab308 : fuelType === 'GPL' ? 0x06b6d4 : 0x10b981
      const flapMat = new THREE.MeshBasicMaterial({ color: flapColor, side: THREE.DoubleSide })
      const flap = new THREE.Mesh(flapGeo, flapMat)
      flap.position.set(0.72, 0.5, -0.7)
      flap.rotation.y = Math.PI / 2
      car.add(flap)

      return car
    }

    const updateVehicle = () => {
      if (currentVehicleMeshGroup) {
        vehicleGroup.remove(currentVehicleMeshGroup)
        disposeThreeHierarchy(currentVehicleMeshGroup)
      }
      currentVehicleMeshGroup = buildVehicleModel(stateRef.current.bodyType, stateRef.current.color)
      vehicleGroup.add(currentVehicleMeshGroup)
    }

    updateVehicle()

    // Interactive Drag
    let isDragging = false
    let prevX = 0
    let angularVel = 0

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevX = e.clientX
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const delta = e.clientX - prevX
      prevX = e.clientX
      vehicleGroup.rotation.y += delta * 0.012
      angularVel = delta * 0.001
    }
    const onMouseUp = () => { isDragging = false }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true
        prevX = e.touches[0].clientX
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return
      const delta = e.touches[0].clientX - prevX
      prevX = e.touches[0].clientX
      vehicleGroup.rotation.y += delta * 0.015
      angularVel = delta * 0.001
    }
    const onTouchEnd = () => { isDragging = false }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    // Visibility Observer
    let isVisible = true
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    })
    observer.observe(container)

    let lastBody = stateRef.current.bodyType
    let lastColor = stateRef.current.color

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (!isVisible) return

      // Check if state changed
      if (stateRef.current.bodyType !== lastBody || stateRef.current.color !== lastColor) {
        lastBody = stateRef.current.bodyType
        lastColor = stateRef.current.color
        updateVehicle()
      }

      // Idle auto-spin
      if (!isDragging) {
        vehicleGroup.rotation.y += 0.005 + angularVel
        angularVel *= 0.95
      }

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight || 320
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
  }, [fuelType])

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Garage 3D
          </span>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 sm:text-xl">
            {vehicleName}
          </h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          <span>Consumo stimato:</span>
          <span className="text-emerald-600 dark:text-emerald-400">{consumptionL100km} L/100km</span>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-64 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-zinc-100 shadow-inner sm:h-72 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900"
      >
        {!isSupported ? (
          <div className="flex h-full items-center justify-center p-4 text-xs text-zinc-500">
            Visualizzazione 3D non disponibile
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
            <div className="pointer-events-none absolute bottom-3 inset-x-0 text-center">
              <span className="rounded-full bg-zinc-900/75 px-3 py-1 text-[11px] font-medium text-zinc-200 backdrop-blur-sm">
                Trascina l&apos;auto a 360°
              </span>
            </div>
            {/* Fuel badge floating */}
            <div className="pointer-events-none absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/60 bg-white/80 px-2.5 py-1 text-xs font-bold text-zinc-800 backdrop-blur-md shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200">
                <span className={`size-2 rounded-full ${fuelType === 'Gasolio' ? 'bg-amber-400' : fuelType === 'GPL' ? 'bg-sky-400' : 'bg-emerald-500'}`} />
                {fuelType}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Customizer Controls */}
      <div className="space-y-3">
        {/* Body Types */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
            Modello Carrozzeria
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BODY_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setBodyType(type.id)
                  onBodyTypeChange?.(type.id)
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition active:scale-[0.98] ${
                  bodyType === type.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colors Palette */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
            Vernice Carrozzeria
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => {
                  setColor(c.hex)
                  onColorChange?.(c.hex)
                }}
                title={c.name}
                aria-label={c.name}
                className={`size-8 rounded-full border-2 transition-transform active:scale-90 ${
                  color === c.hex
                    ? 'border-emerald-600 scale-110 shadow-md ring-2 ring-emerald-400/50 dark:border-emerald-400'
                    : 'border-zinc-300 hover:scale-105 dark:border-zinc-700'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

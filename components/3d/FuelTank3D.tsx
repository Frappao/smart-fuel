'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { isWebGLAvailable, getRecommendedDpr, disposeThreeHierarchy } from './webglUtils'

interface FuelTank3DProps {
  litersPurchased: number
  travelFuelLiters: number
  netFuelLiters: number
  tankCapacity?: number // default 50L
  stationName?: string
}

export default function FuelTank3D({
  litersPurchased,
  travelFuelLiters,
  netFuelLiters,
  tankCapacity = 50,
  stationName,
}: FuelTank3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSupported, setIsSupported] = useState(true)

  const capacity = Math.max(tankCapacity, litersPurchased * 1.15)
  const netRatio = Math.max(0, Math.min(netFuelLiters / capacity, 1))
  const burnRatio = Math.max(0, Math.min(travelFuelLiters / capacity, 1))

  const metricsRef = useRef({ netRatio, burnRatio })
  useEffect(() => {
    metricsRef.current = { netRatio, burnRatio }
  }, [netRatio, burnRatio])

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
    const aspect = container.clientWidth / (container.clientHeight || 260)
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50)
    camera.position.set(0, 1.2, 5.2)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(getRecommendedDpr())
    renderer.setSize(container.clientWidth, container.clientHeight || 260)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.1)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
    keyLight.position.set(3, 4, 3)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x10b981, 1.2)
    rimLight.position.set(-3, -2, -2)
    scene.add(rimLight)

    const tankGroup = new THREE.Group()

    const tankTotalHeight = 2.6
    const tankRadius = 0.9

    // Outer Glass Cylinder
    const glassGeo = new THREE.CylinderGeometry(tankRadius, tankRadius, tankTotalHeight, 32, 1, true)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      opacity: 0.45,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.4,
      side: THREE.DoubleSide,
    })
    const glassMesh = new THREE.Mesh(glassGeo, glassMat)
    tankGroup.add(glassMesh)

    // Metallic Rim Top & Bottom
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.85,
      roughness: 0.25,
    })
    const capGeo = new THREE.CylinderGeometry(tankRadius * 1.05, tankRadius * 1.05, 0.14, 32)
    const topCap = new THREE.Mesh(capGeo, metalMat)
    topCap.position.y = tankTotalHeight / 2 + 0.07
    const botCap = new THREE.Mesh(capGeo, metalMat)
    botCap.position.y = -tankTotalHeight / 2 - 0.07
    tankGroup.add(topCap, botCap)

    // Graduation Tick Marks
    for (let i = 1; i <= 4; i++) {
      const ringGeo = new THREE.RingGeometry(tankRadius * 0.99, tankRadius * 1.01, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x52525b : 0xa1a1aa,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = -tankTotalHeight / 2 + (tankTotalHeight / 5) * i
      tankGroup.add(ring)
    }

    // Dynamic Liquid Layers
    // Net Fuel (Emerald Green, bottom)
    const netLiquidGeo = new THREE.CylinderGeometry(tankRadius * 0.95, tankRadius * 0.95, 1, 32)
    const netLiquidMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    })
    const netLiquidMesh = new THREE.Mesh(netLiquidGeo, netLiquidMat)
    tankGroup.add(netLiquidMesh)

    // Travel Burned Fuel (Coral/Amber, stacked right on top of net fuel)
    const burnLiquidGeo = new THREE.CylinderGeometry(tankRadius * 0.95, tankRadius * 0.95, 1, 32)
    const burnLiquidMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7,
    })
    const burnLiquidMesh = new THREE.Mesh(burnLiquidGeo, burnLiquidMat)
    tankGroup.add(burnLiquidMesh)

    scene.add(tankGroup)

    // Interactive Drag to Rotate
    let isDragging = false
    let previousX = 0
    let velocity = 0

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      previousX = e.clientX
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const delta = e.clientX - previousX
      previousX = e.clientX
      tankGroup.rotation.y += delta * 0.012
      velocity = delta * 0.001
    }
    const onMouseUp = () => { isDragging = false }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true
        previousX = e.touches[0].clientX
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return
      const delta = e.touches[0].clientX - previousX
      previousX = e.touches[0].clientX
      tankGroup.rotation.y += delta * 0.014
      velocity = delta * 0.001
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

    const clock = new THREE.Clock()
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (!isVisible) return

      const time = clock.getElapsedTime()

      // Damped auto rotation
      if (!isDragging) {
        tankGroup.rotation.y += 0.003 + velocity
        velocity *= 0.95
      }

      // Update liquid heights and positions based on live metrics
      const { netRatio: currentNet, burnRatio: currentBurn } = metricsRef.current

      const baseFloor = -tankTotalHeight / 2
      const netHeight = Math.max(0.02, currentNet * tankTotalHeight)
      netLiquidMesh.scale.set(1, netHeight, 1)
      netLiquidMesh.position.y = baseFloor + netHeight / 2

      const burnHeight = Math.max(0.01, currentBurn * tankTotalHeight)
      burnLiquidMesh.scale.set(1, burnHeight, 1)
      burnLiquidMesh.position.y = baseFloor + netHeight + burnHeight / 2

      // Gentle wave float
      tankGroup.position.y = Math.sin(time * 1.5) * 0.04

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight || 260
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
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-6 dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* 3D Visualizer Canvas */}
      <div
        ref={containerRef}
        className="relative h-60 w-full shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950/5 sm:w-56 dark:border-zinc-800 dark:bg-zinc-950/60"
      >
        {!isSupported ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-zinc-500">
            Visualizzazione 3D non disponibile
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
            <div className="pointer-events-none absolute bottom-2 inset-x-0 text-center">
              <span className="rounded-full bg-zinc-900/70 px-2 py-0.5 text-[10px] text-zinc-300">
                Ruota 3D
              </span>
            </div>
          </>
        )}
      </div>

      {/* Breakdown Metrics */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Analisi Visiva Serbatoio 3D
          </span>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {stationName ? `Rifornimento a ${stationName}` : 'Cosa entra davvero nel serbatoio'}
          </h4>
        </div>

        <div className="space-y-2 text-xs">
          {/* Net Liters */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/50">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-emerald-500 shadow-sm" />
              <span className="font-medium text-emerald-950 dark:text-emerald-100">Litri Netti utilizzabili</span>
            </div>
            <span className="font-bold text-sm text-emerald-700 tabular-nums dark:text-emerald-400">
              {netFuelLiters.toFixed(2)} L
            </span>
          </div>

          {/* Travel Burn */}
          <div className="flex items-center justify-between rounded-lg bg-rose-50 p-2.5 dark:bg-rose-950/40">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-rose-500 shadow-sm" />
              <span className="font-medium text-rose-950 dark:text-rose-100">Carburante bruciato per il viaggio A/R</span>
            </div>
            <span className="font-bold text-sm text-rose-600 tabular-nums dark:text-rose-400">
              −{travelFuelLiters.toFixed(2)} L
            </span>
          </div>

          {/* Purchased */}
          <div className="flex items-center justify-between border-t border-zinc-200/80 px-2 pt-1 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            <span>Carburante acquistato alla pompa:</span>
            <span className="font-semibold tabular-nums">{litersPurchased.toFixed(2)} L</span>
          </div>
        </div>
      </div>
    </div>
  )
}

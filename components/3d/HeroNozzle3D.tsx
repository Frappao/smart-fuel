'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { isWebGLAvailable, getRecommendedDpr, disposeThreeHierarchy } from './webglUtils'

export default function HeroNozzle3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSupported, setIsSupported] = useState(true)

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
    const aspect = container.clientWidth / (container.clientHeight || 200)
    const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 50)
    camera.position.set(0, 0, 4.5)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(getRecommendedDpr())
    renderer.setSize(container.clientWidth, container.clientHeight || 200)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.2)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
    keyLight.position.set(4, 5, 4)
    scene.add(keyLight)

    const emeraldGlow = new THREE.PointLight(0x10b981, 3.5, 6)
    emeraldGlow.position.set(0, 0, 1)
    scene.add(emeraldGlow)

    // Nozzle Group
    const nozzleGroup = new THREE.Group()

    // Grip Handle
    const gripGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.4, 16)
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.35,
      metalness: 0.2,
    })
    const grip = new THREE.Mesh(gripGeo, gripMat)
    grip.rotation.z = Math.PI / 6
    grip.position.set(-0.35, -0.4, 0)
    nozzleGroup.add(grip)

    // Body Block
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.5, 0.4)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.2,
      metalness: 0.8,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.set(0, 0.2, 0)
    nozzleGroup.add(body)

    // Glowing core band
    const bandGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.45, 16)
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    })
    const band = new THREE.Mesh(bandGeo, bandMat)
    band.rotation.x = Math.PI / 2
    band.position.set(0, 0.2, 0)
    nozzleGroup.add(band)

    // Spout / Barrel
    const spoutGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.5, 16)
    const spoutMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.15,
      metalness: 0.95,
    })
    const spout = new THREE.Mesh(spoutGeo, spoutMat)
    spout.rotation.z = -Math.PI / 3.5
    spout.position.set(0.75, 0.7, 0)
    nozzleGroup.add(spout)

    // Spout tip angle
    const tipGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.5, 16)
    const tip = new THREE.Mesh(tipGeo, spoutMat)
    tip.rotation.z = -Math.PI / 1.6
    tip.position.set(1.5, 1.15, 0)
    nozzleGroup.add(tip)

    // Trigger Guard
    const guardGeo = new THREE.TorusGeometry(0.3, 0.04, 8, 16, Math.PI)
    const guardMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.7 })
    const guard = new THREE.Mesh(guardGeo, guardMat)
    guard.rotation.z = -Math.PI / 2
    guard.position.set(-0.1, -0.05, 0)
    nozzleGroup.add(guard)

    nozzleGroup.scale.set(0.9, 0.9, 0.9)
    scene.add(nozzleGroup)

    // Parallax tracking
    let targetRotX = 0
    let targetRotY = 0

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      targetRotY = x * 0.45
      targetRotX = -y * 0.35
    }

    container.addEventListener('mousemove', onPointerMove)

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

      // Zero-g floating
      nozzleGroup.position.y = Math.sin(time * 1.8) * 0.1
      nozzleGroup.position.x = Math.cos(time * 1.2) * 0.05

      // Smooth parallax lerp
      nozzleGroup.rotation.x += (targetRotX + Math.sin(time * 1.4) * 0.05 - nozzleGroup.rotation.x) * 0.06
      nozzleGroup.rotation.y += (targetRotY + Math.cos(time * 1.0) * 0.15 - nozzleGroup.rotation.y) * 0.06

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight || 200
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousemove', onPointerMove)
      disposeThreeHierarchy(scene)
      renderer.dispose()
    }
  }, [])

  if (!isSupported) {
    return (
      <div className="flex size-32 items-center justify-center rounded-2xl bg-emerald-50 text-3xl dark:bg-emerald-950/40">
        ⛽
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative h-44 w-44 sm:h-52 sm:w-52 shrink-0 cursor-pointer select-none"
      title="Rifornio 3D Experience"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}

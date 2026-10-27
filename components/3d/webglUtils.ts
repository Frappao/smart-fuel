import * as THREE from 'three'

/**
 * Checks whether WebGL is available on the current client.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    )
  } catch {
    return false
  }
}

/**
 * Returns a performance-optimized device pixel ratio (capped at 1 for mobile, max 1.5 for desktop).
 */
export function getRecommendedDpr(): number {
  if (typeof window === 'undefined') return 1
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768
  if (isMobile) return 1
  return Math.min(window.devicePixelRatio || 1, 1.5)
}

/**
 * Disposes an Object3D hierarchy to prevent memory and WebGL context leaks.
 */
export function disposeThreeHierarchy(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose()
      }
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => mat.dispose())
      } else if (child.material) {
        child.material.dispose()
      }
    }
  })
}

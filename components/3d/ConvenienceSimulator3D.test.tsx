// @vitest-environment jsdom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import * as THREE from 'three'
import ConvenienceSimulator3D, {
  computeCarCycleState,
  buildFarRouteData,
  createRibbonGeometry,
  createDashedCenterlineGeometry,
  formatCarHudFuel,
  computeHudScreenPositions,
  configureCameraForAspect,
  disposeGroupGeometries,
} from './ConvenienceSimulator3D'

afterEach(() => {
  cleanup()
})

describe('computeCarCycleState & formatCarHudFuel', () => {
  const timings = { outboundEnd: 0.34, refuelEnd: 0.52, returnEnd: 0.86 }
  const oneWayKm = 10
  const litersBought = 28.0
  const roundTripBurn = 1.4 // 0.7 L each way

  it('starts at origin (curveT = 0) with 0 fuel burned at progress = 0', () => {
    const state = computeCarCycleState(0, timings, oneWayKm, litersBought, roundTripBurn)
    expect(state.curveT).toBe(0)
    expect(state.isReturning).toBe(false)
    expect(state.isRefueling).toBe(false)
    expect(state.telemetry.phase).toBe('outbound')
    expect(state.telemetry.fuelBurnedLiters).toBeCloseTo(0, 5)
    expect(state.telemetry.fuelAddedLiters).toBe(0)
    expect(formatCarHudFuel(state.telemetry)).toBe('−0.00 L viaggio')
  })

  it('reaches station canopy (curveT = 1) at end of outbound leg with half of round-trip fuel burned', () => {
    const state = computeCarCycleState(timings.outboundEnd, timings, oneWayKm, litersBought, roundTripBurn)
    expect(state.curveT).toBeCloseTo(1, 5)
    expect(state.telemetry.phase).toBe('outbound')
    expect(state.telemetry.kmDriven).toBeCloseTo(oneWayKm, 5)
    expect(state.telemetry.fuelBurnedLiters).toBeCloseTo(0.7, 5)
    expect(state.telemetry.currentTankLiters).toBeCloseTo(-0.7, 5)
    expect(formatCarHudFuel(state.telemetry)).toBe('−0.70 L viaggio')
  })

  it('refuels under the canopy (curveT = 1, isRefueling = true) during the refueling phase', () => {
    const midRefuel = (timings.outboundEnd + timings.refuelEnd) / 2
    const state = computeCarCycleState(midRefuel, timings, oneWayKm, litersBought, roundTripBurn)
    expect(state.curveT).toBe(1)
    expect(state.isRefueling).toBe(true)
    expect(state.telemetry.phase).toBe('refueling')
    expect(state.telemetry.fuelAddedLiters).toBeCloseTo(14.0, 4)
    expect(state.telemetry.currentTankLiters).toBeCloseTo(14.0 - 0.7, 4)
    expect(formatCarHudFuel(state.telemetry)).toBe('+14.0 L pompa')
  })

  it('drives back toward origin (isReturning = true) and burns remaining travel fuel during return phase', () => {
    const midReturn = (timings.refuelEnd + timings.returnEnd) / 2
    const state = computeCarCycleState(midReturn, timings, oneWayKm, litersBought, roundTripBurn)
    expect(state.isReturning).toBe(true)
    expect(state.isRefueling).toBe(false)
    expect(state.telemetry.phase).toBe('return')
    expect(state.curveT).toBeCloseTo(0.5, 4)
    expect(state.telemetry.fuelBurnedLiters).toBeCloseTo(1.05, 4)
    expect(state.telemetry.currentTankLiters).toBeCloseTo(28.0 - 1.05, 4)
    expect(formatCarHudFuel(state.telemetry)).toBe('26.95 L (−1.05 L)')
  })

  it('arrives back at origin (curveT = 0) with exact netFuelLiters at end of cycle and clamps out-of-range progress', () => {
    const state = computeCarCycleState(1.25, timings, oneWayKm, litersBought, roundTripBurn)
    expect(state.curveT).toBe(0)
    expect(state.isReturning).toBe(false)
    expect(state.telemetry.phase).toBe('complete')
    expect(state.telemetry.kmDriven).toBeCloseTo(20, 5)
    expect(state.telemetry.fuelBurnedLiters).toBeCloseTo(1.4, 5)
    expect(state.telemetry.currentTankLiters).toBeCloseTo(26.6, 5)
    expect(formatCarHudFuel(state.telemetry)).toBe('Netti: 26.60 L')

    const negState = computeCarCycleState(-0.5, timings, oneWayKm, litersBought, roundTripBurn)
    expect(negState.curveT).toBe(0)
    expect(negState.telemetry.phase).toBe('outbound')
  })
})

describe('3D Road Curve, Canopy Collinearity, Camera Frustum & Resource Disposal', () => {
  it('centers the Far Route endpoint at Station B with zero lateral overshoot inside the canopy corridor', () => {
    for (const distKm of [4, 10, 14, 20, 25]) {
      const farData = buildFarRouteData(distKm)
      const originPt = farData.drivingCurve.getPointAt(0)
      const endPt = farData.drivingCurve.getPointAt(1)
      const endTangent = farData.drivingCurve.getTangentAt(1)

      // Origin is shared at (-4.2, 0, 3.6)
      expect(originPt.x).toBeCloseTo(-4.2, 4)
      expect(originPt.z).toBeCloseTo(3.6, 4)

      // Endpoint at t = 1 matches Station B center (stationFarX, 0, stationFarZ)
      expect(endPt.x).toBeCloseTo(farData.stationFarX, 4)
      expect(endPt.z).toBeCloseTo(farData.stationFarZ, 4)

      // Approach tangent into the station forecourt points straight along -Z
      expect(Math.abs(endTangent.x)).toBeLessThan(0.005)
      expect(endTangent.z).toBeLessThan(-0.999)

      // Zero lateral overshoot across the entire canopy island corridor (z <= stationFarZ + 0.85)
      for (let t = 0.75; t <= 1.0; t += 0.01) {
        const pt = farData.drivingCurve.getPointAt(t)
        if (pt.z <= farData.stationFarZ + 0.85) {
          expect(Math.abs(pt.x - farData.stationFarX)).toBeLessThan(0.001)
        }
      }
    }
  })

  it('scales Station B physical 3D distance monotonically as distanceFarKm increases', () => {
    const shortData = buildFarRouteData(4)
    const midData = buildFarRouteData(14)
    const longData = buildFarRouteData(25)

    expect(midData.drivingCurve.getLength()).toBeGreaterThan(shortData.drivingCurve.getLength())
    expect(longData.drivingCurve.getLength()).toBeGreaterThan(midData.drivingCurve.getLength())
    expect(longData.dashCount).toBeGreaterThan(shortData.dashCount)
  })

  it('generates finite, indexed BufferGeometries for continuous road ribbons and partial-start dashed centerlines', () => {
    const farData = buildFarRouteData(14)
    const ribbonGeo = createRibbonGeometry(farData.roadMeshCurve, 1.24, 0.02, 32, 0.18)
    const posAttr = ribbonGeo.getAttribute('position')
    expect(posAttr.count).toBe((32 + 1) * 2)
    for (let i = 0; i < posAttr.array.length; i++) {
      expect(Number.isFinite(posAttr.array[i])).toBe(true)
    }

    const fullDashGeo = createDashedCenterlineGeometry(farData.roadMeshCurve, 24, 0.06, 0.03, 0)
    const branchDashGeo = createDashedCenterlineGeometry(farData.roadMeshCurve, 24, 0.06, 0.03, 0.25)
    const fullCount = fullDashGeo.getAttribute('position').count
    const branchCount = branchDashGeo.getAttribute('position').count
    expect(branchCount).toBeGreaterThan(0)
    expect(branchCount).toBeLessThan(fullCount)

    ribbonGeo.dispose()
    fullDashGeo.dispose()
    branchDashGeo.dispose()
  })

  it('disposes only geometries in disposeGroupGeometries while keeping shared materials intact', () => {
    const sharedMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const geo = new THREE.BoxGeometry(1, 1, 1)
    const mesh = new THREE.Mesh(geo, sharedMat)
    const group = new THREE.Group()
    group.add(mesh)

    const geoDisposeSpy = vi.spyOn(geo, 'dispose')
    const matDisposeSpy = vi.spyOn(sharedMat, 'dispose')

    disposeGroupGeometries(group)

    expect(geoDisposeSpy).toHaveBeenCalledTimes(1)
    expect(matDisposeSpy).not.toHaveBeenCalled()

    sharedMat.dispose()
  })

  it('keeps Origin, Station A, and 25km Station B inside the camera frustum across mobile and desktop aspect ratios', () => {
    for (const aspect of [0.75, 0.91, 1.2, 1.7]) {
      const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100)
      configureCameraForAspect(camera, aspect)
      camera.updateMatrixWorld()

      const originNdc = new THREE.Vector3(-5.15, 0.5, 4.15).project(camera)
      const stationANdc = new THREE.Vector3(-4.75, 1.8, -2.3).project(camera)
      const stationB25kmNdc = new THREE.Vector3(7.05, 1.8, -3.2).project(camera)

      for (const pt of [originNdc, stationANdc, stationB25kmNdc]) {
        expect(pt.x).toBeGreaterThan(-0.95)
        expect(pt.x).toBeLessThan(0.95)
        expect(pt.y).toBeGreaterThan(-0.95)
        expect(pt.y).toBeLessThan(0.95)
      }
    }
  })

  it('prevents floating HUD overlap when cars are close or aligned along a rotated camera ray', () => {
    // Coincident projected coords on a narrow 320x352 mobile viewport
    const resolvedMobile = computeHudScreenPositions(
      { x: 160, y: 180 },
      { x: 168, y: 184 },
      320,
      352,
    )
    expect(Math.abs(resolvedMobile.a.y - resolvedMobile.b.y)).toBeGreaterThanOrEqual(36)
    expect(resolvedMobile.a.x).toBeGreaterThanOrEqual(44)
    expect(resolvedMobile.b.x).toBeLessThanOrEqual(320 - 44)

    // Distant projected coords remain unperturbed when within safe margins
    const resolvedFarApart = computeHudScreenPositions(
      { x: 140, y: 120 },
      { x: 520, y: 210 },
      720,
      420,
    )
    expect(resolvedFarApart.a).toEqual({ x: 140, y: 120 })
    expect(resolvedFarApart.b).toEqual({ x: 520, y: 210 })
  })
})

describe('ConvenienceSimulator3D component', () => {
  it('renders default scenario where Station A (Near) wins despite Station B having a lower pump price', () => {
    render(<ConvenienceSimulator3D />)

    expect(
      screen.getByText('Perché il distributore più economico può farti spendere di più?'),
    ).toBeTruthy()

    // Default: budget 50€, consumption 6.8 L/100km, near 2.5km @ 1.839, far 14km @ 1.749
    // Near: 50 / 1.839 = 27.19 L - 0.34 L = 26.85 L
    // Far:  50 / 1.749 = 28.59 L - 1.90 L = 26.68 L
    expect(screen.getAllByText(/\+27\.19 L/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/\+28\.59 L/).length).toBeGreaterThan(0)
    expect(screen.getByText(/La Stazione Vicina vince di \+0\.16 Litri netti/)).toBeTruthy()
  })

  it('switches to preset scenarios and updates winner and comparative breakdown', () => {
    render(<ConvenienceSimulator3D />)

    const maxiPresetBtn = screen.getByRole('button', { name: /Maxi pieno \(80€\)/i })
    fireEvent.click(maxiPresetBtn)

    // Maxi pieno: 80€, 6.0 L/100km, 8km far @ 1.719 €/L -> Far station wins!
    expect(screen.getByText(/La Stazione Lontana conviene di \+/i)).toBeTruthy()

    const rabboccoPresetBtn = screen.getByRole('button', { name: /Rabbocco veloce \(20€\)/i })
    fireEvent.click(rabboccoPresetBtn)

    // Rabbocco 20€: Near station wins again
    expect(screen.getByText(/La Stazione Vicina vince di \+/i)).toBeTruthy()
  })

  it('updates calculations dynamically when sliders are adjusted', () => {
    render(<ConvenienceSimulator3D />)

    const distanceSlider = screen.getByLabelText('Distanza Stazione B')
    fireEvent.change(distanceSlider, { target: { value: '5' } })

    // At 5km (A/R 10km), travel burn for B is only 0.68 L, so Station B wins
    expect(screen.getByText(/La Stazione Lontana conviene di \+/i)).toBeTruthy()

    const consumptionSlider = screen.getByLabelText('Consumo Veicolo')
    fireEvent.change(consumptionSlider, { target: { value: '12' } })
    fireEvent.change(distanceSlider, { target: { value: '22' } })

    // At 22km and 12 L/100km, Station A wins by a large margin
    expect(screen.getByText(/La Stazione Vicina vince di \+/i)).toBeTruthy()
  })

  it('synchronizes both cars into each phase when clicking play/pause, restart, and all 4 phase jump buttons', () => {
    render(<ConvenienceSimulator3D />)

    const pauseBtn = screen.getByRole('button', { name: /Pausa/i })
    fireEvent.click(pauseBtn)
    expect(screen.getByRole('button', { name: /Riprendi/i })).toBeTruthy()

    const refuelPhaseBtn = screen.getByRole('button', { name: /2\. Rifornimento alla pompa/i })
    fireEvent.click(refuelPhaseBtn)
    expect(screen.getAllByText(/Stato: Rifornimento/i)).toHaveLength(2)

    const returnPhaseBtn = screen.getByRole('button', { name: /3\. Ritorno a casa/i })
    fireEvent.click(returnPhaseBtn)
    expect(screen.getAllByText(/Stato: Ritorno/i)).toHaveLength(2)

    const finalPhaseBtn = screen.getByRole('button', { name: /4\. Bilancio finale/i })
    fireEvent.click(finalPhaseBtn)
    expect(screen.getAllByText(/Stato: Arrivata/i)).toHaveLength(2)

    const restartBtn = screen.getByRole('button', { name: /Riavvia viaggio/i })
    fireEvent.click(restartBtn)
    expect(screen.getAllByText(/Stato: Andata/i)).toHaveLength(2)
  })
})


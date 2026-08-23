import { describe, expect, it } from 'vitest'
import {
  canStartPull,
  MAX_PULL,
  pullDistance,
  pullPhase,
  pullProgress,
  PULL_THRESHOLD,
} from '@/lib/pullToRefresh'

describe('pullDistance', () => {
  it('ignores an upward drag', () => {
    expect(pullDistance(0)).toBe(0)
    expect(pullDistance(-50)).toBe(0)
  })

  it('follows the finger closely at the start', () => {
    // Within a couple of pixels of 1:1 — the gesture has to feel attached
    // before it starts resisting.
    expect(pullDistance(10)).toBeGreaterThan(9)
    expect(pullDistance(10)).toBeLessThanOrEqual(10)
  })

  it('resists more the further it is pulled', () => {
    const first = pullDistance(20) - pullDistance(10)
    const later = pullDistance(220) - pullDistance(210)

    expect(later).toBeLessThan(first)
  })

  it('never reaches the ceiling, however hard the pull', () => {
    expect(pullDistance(10_000)).toBeLessThan(MAX_PULL)
    expect(pullDistance(10_000)).toBeGreaterThan(MAX_PULL * 0.98)
  })

  it('is monotonic', () => {
    let previous = 0
    for (let travel = 1; travel <= 500; travel += 7) {
      const distance = pullDistance(travel)
      expect(distance).toBeGreaterThan(previous)
      previous = distance
    }
  })
})

describe('pullPhase', () => {
  it('is idle at rest', () => {
    expect(pullPhase(0, false)).toBe('idle')
  })

  it('announces readiness before the release, not after', () => {
    expect(pullPhase(PULL_THRESHOLD - 1, false)).toBe('pulling')
    expect(pullPhase(PULL_THRESHOLD, false)).toBe('ready')
  })

  it('lets refreshing win over any distance', () => {
    expect(pullPhase(0, true)).toBe('refreshing')
    expect(pullPhase(PULL_THRESHOLD * 2, true)).toBe('refreshing')
  })
})

describe('canStartPull', () => {
  it('only starts from the top', () => {
    expect(canStartPull(0)).toBe(true)
    expect(canStartPull(1)).toBe(false)
  })

  it('allows the negative scrollTop a rubber-banding browser reports', () => {
    expect(canStartPull(-12)).toBe(true)
  })
})

describe('pullProgress', () => {
  it('runs 0 to 1 across the threshold and then stops', () => {
    expect(pullProgress(0)).toBe(0)
    expect(pullProgress(PULL_THRESHOLD / 2)).toBeCloseTo(0.5)
    expect(pullProgress(PULL_THRESHOLD)).toBe(1)
    expect(pullProgress(PULL_THRESHOLD * 10)).toBe(1)
  })
})

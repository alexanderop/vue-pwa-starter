import { describe, expect, it } from 'vitest'
import {
  AXIS_THRESHOLD,
  clampOffset,
  latchesOpen,
  LATCH_FRACTION,
  resolveAxis,
} from '@/lib/swipeRow'

describe('resolveAxis', () => {
  it('stays undecided until the drag is long enough to have a direction', () => {
    expect(resolveAxis(0, 0)).toBe('undecided')
    expect(resolveAxis(AXIS_THRESHOLD - 1, AXIS_THRESHOLD - 1)).toBe('undecided')
    expect(resolveAxis(-(AXIS_THRESHOLD - 1), 0)).toBe('undecided')
  })

  it('commits once either axis clears the threshold', () => {
    expect(resolveAxis(-AXIS_THRESHOLD, 0)).toBe('horizontal')
    expect(resolveAxis(0, AXIS_THRESHOLD)).toBe('vertical')
  })

  it('gives a tie to the list rather than to the row', () => {
    // Scrolling is the behaviour nobody had to learn, so an ambiguous drag
    // does that instead of revealing actions.
    expect(resolveAxis(20, 20)).toBe('vertical')
    expect(resolveAxis(-20, 20)).toBe('vertical')
  })

  it('reads a drag by distance, not by sign', () => {
    expect(resolveAxis(-30, 5)).toBe('horizontal')
    expect(resolveAxis(30, -5)).toBe('horizontal')
  })
})

describe('clampOffset', () => {
  it('follows the finger inside the revealed range', () => {
    expect(clampOffset(0, -40, 96)).toBe(-40)
    expect(clampOffset(-96, 30, 96)).toBe(-66)
  })

  it('never slides right, because nothing is revealed on that side', () => {
    expect(clampOffset(0, 50, 96)).toBe(0)
    expect(clampOffset(-20, 100, 96)).toBe(0)
  })

  it('never travels past the actions', () => {
    expect(clampOffset(0, -500, 96)).toBe(-96)
    expect(clampOffset(-96, -10, 96)).toBe(-96)
  })

  it('is exact at both ends', () => {
    expect(clampOffset(0, -96, 96)).toBe(-96)
    expect(clampOffset(0, 0, 96)).toBe(0)
  })
})

describe('latchesOpen', () => {
  it('opens past the latch point and springs back before it', () => {
    const width = 96
    const latch = -width * LATCH_FRACTION

    expect(latchesOpen(latch - 1, width)).toBe(true)
    expect(latchesOpen(latch + 1, width)).toBe(false)
  })

  it('treats the latch point itself as not yet open', () => {
    // A drag that stops exactly halfway is a drag the user did not finish.
    expect(latchesOpen(-48, 96)).toBe(false)
  })

  it('never opens from rest', () => {
    expect(latchesOpen(0, 96)).toBe(false)
  })
})

/**
 * The arithmetic behind a swipe-to-reveal row, with no DOM in it.
 *
 * Extracted for the usual two reasons: the component that drives it is a
 * handful of pointer handlers and stays readable at that size, and gesture
 * arithmetic is exactly the kind of thing that is cheap to test at every
 * boundary and expensive to test through a browser. `MoleculeSwipeableRow` is
 * the only consumer.
 */

/**
 * How far a drag must travel before it is committed to an axis.
 *
 * The decision is made once and then held. Re-deciding on every frame is what
 * makes a row fight the list it is scrolling inside: a drag that wanders a few
 * pixels either side of the diagonal flickers between panning the list and
 * opening the row, and does neither.
 */
export const AXIS_THRESHOLD = 8

/** Past this fraction of the revealed width, releasing latches the row open. */
export const LATCH_FRACTION = 0.5

export type DragAxis = 'horizontal' | 'vertical' | 'undecided'

/**
 * Which way this drag is going, or `undecided` while it is still too short to
 * say. A tie goes to `vertical`, because the list scrolling is the behaviour
 * the user did not have to learn.
 */
export function resolveAxis(dx: number, dy: number): DragAxis {
  if (Math.abs(dx) < AXIS_THRESHOLD && Math.abs(dy) < AXIS_THRESHOLD) return 'undecided'

  return Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
}

/**
 * Where the row sits during a drag, clamped to the range it may occupy.
 *
 * Never positive (the row does not slide right, because there is nothing
 * revealed on that side) and never past `-width` (the actions are fully shown
 * and further travel would expose the list background). No rubber-banding: an
 * overshoot that springs back belongs to a drawer, and a list row that behaves
 * like one reads as broken rather than as playful.
 */
export function clampOffset(base: number, dx: number, width: number): number {
  return Math.min(0, Math.max(-width, base + dx))
}

/** Whether releasing here should leave the row open rather than springing back. */
export function latchesOpen(offset: number, width: number): boolean {
  return offset < -width * LATCH_FRACTION
}

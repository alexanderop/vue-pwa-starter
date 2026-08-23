/**
 * The arithmetic behind pull-to-refresh, with no DOM in it.
 *
 * Same split as `swipeRow.ts`, and for the same reasons: the resistance curve
 * and the threshold are the parts that are wrong in most implementations, and
 * they are cheap to check here and expensive to check through a browser.
 * `OrganismPullToRefresh` is the only consumer.
 */

/** How far the indicator travels before a release refreshes. */
export const PULL_THRESHOLD = 64

/** The furthest the indicator can be dragged, however hard the pull. */
export const MAX_PULL = 120

export type PullPhase = 'idle' | 'pulling' | 'ready' | 'refreshing'

/**
 * How far the indicator has actually moved for a given finger travel.
 *
 * Damped rather than one-to-one, and this is the whole feel of the gesture:
 * the further you pull the less the sheet follows, so the surface reads as
 * attached to something. A linear pull reads as a bug — the content simply
 * detaches from the top of the screen and floats.
 *
 * The curve is `distance / (1 + distance / MAX_PULL)`, which is 1:1 at the
 * start, approaches `MAX_PULL` asymptotically, and never needs clamping.
 */
export function pullDistance(travel: number): number {
  if (travel <= 0) return 0

  return travel / (1 + travel / MAX_PULL)
}

/**
 * Which phase a given pull is in.
 *
 * `ready` is separate from `pulling` because the user has to be told *before*
 * they let go: an indicator that only changes on release has already missed
 * the moment it exists for.
 */
export function pullPhase(distance: number, isRefreshing: boolean): PullPhase {
  if (isRefreshing) return 'refreshing'
  if (distance <= 0) return 'idle'

  return distance >= PULL_THRESHOLD ? 'ready' : 'pulling'
}

/**
 * Whether a gesture may start at all.
 *
 * Only from the very top of the scroll container. A pull that begins mid-list
 * is someone scrolling up, and hijacking it is how a refresh fires every time
 * a user reaches the top of a long list.
 */
export function canStartPull(scrollTop: number): boolean {
  return scrollTop <= 0
}

/** How far round the indicator has turned, as a fraction of the threshold. */
export function pullProgress(distance: number): number {
  return Math.min(1, distance / PULL_THRESHOLD)
}

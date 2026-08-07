import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Runs axe-core against an element and fails with a readable list of
 * violations (rule id + offending selectors) instead of a generic diff.
 */
export async function assertNoViolations(context: Element): Promise<void> {
  const results = await axe.run(context, { resultTypes: ['violations'] })
  const violations = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target),
  }))
  expect(violations).toEqual([])
}

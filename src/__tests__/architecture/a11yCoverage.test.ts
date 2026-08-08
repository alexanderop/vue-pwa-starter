/**
 * Holds `a11y/coverage.ts` to being complete and honest.
 *
 * The a11y tier can tell you that the screens it sweeps are clean. It cannot
 * tell you that it sweeps every screen — a component added to the app with no
 * sweep rendering it makes the tier no redder than before, so the tier's own
 * gap is invisible from inside it. That is what this file closes: it is a test
 * about the tests, and it lives here for the same reason `boundaries.test.ts`
 * does — "the codebase has no violations" also passes when nothing is being
 * checked.
 *
 * It runs in the arch tier rather than the a11y tier on purpose: it is
 * filesystem analysis over the whole project, needs no browser, and would be
 * circular if the tier it grades had to be green for it to run.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { A11Y_COVERAGE, A11Y_SKIPPED, SWEEPS, type SweepId } from '../a11y/coverage'

const SOURCE_ROOT = fileURLToPath(new URL('../../', import.meta.url))
const A11Y_TIER = fileURLToPath(new URL('../a11y/', import.meta.url))

/**
 * Directories whose `.vue` files are not the app's own screens.
 *
 * `components/ui` is the vendored primitive layer (see docs/ui-components.md):
 * shadcn-style wrappers around reka-ui, which no view renders on its own and
 * which every screen sweep already covers transitively. Grading them
 * individually would be grading reka-ui.
 */
const EXCLUDED = ['components/ui/', '__tests__/']

function componentFiles(directory: string, prefix = ''): Array<string> {
  const found: Array<string> = []

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relativePath = `${prefix}${entry.name}`

    if (entry.isDirectory()) {
      found.push(...componentFiles(`${directory}${entry.name}/`, `${relativePath}/`))
    } else if (entry.name.endsWith('.vue')) {
      found.push(relativePath)
    }
  }

  return found.filter((file) => !EXCLUDED.some((excluded) => file.startsWith(excluded)))
}

/** Everything the a11y tier could sweep, as paths relative to `src/`. */
const COMPONENTS = componentFiles(SOURCE_ROOT)

/** The a11y specs' source, for finding which sweeps are actually declared. */
const a11ySpecSource = readdirSync(A11Y_TIER)
  .filter((file) => file.endsWith('.spec.ts'))
  .map((file) => readFileSync(`${A11Y_TIER}${file}`, 'utf8'))
  .join('\n')

describe('a11y coverage', () => {
  it('finds components to check at all', () => {
    // A broken glob would make every assertion below vacuously true.
    expect(COMPONENTS.length).toBeGreaterThan(0)
  })

  it('every component names the sweep that covers it', () => {
    const undeclared = COMPONENTS.filter(
      (file) => !(file in A11Y_COVERAGE) && !(file in A11Y_SKIPPED),
    )

    expect(undeclared, undeclaredMessage(undeclared)).toEqual([])
  })

  it('no component is both covered and skipped', () => {
    const both = COMPONENTS.filter((file) => file in A11Y_COVERAGE && file in A11Y_SKIPPED)

    expect(
      both,
      `Listed in both A11Y_COVERAGE and A11Y_SKIPPED — pick one:\n${list(both)}`,
    ).toEqual([])
  })

  it('has no entries for components that no longer exist', () => {
    const present = new Set(COMPONENTS)
    const obsolete = [...Object.keys(A11Y_COVERAGE), ...Object.keys(A11Y_SKIPPED)].filter(
      (file) => !present.has(file),
    )

    expect(
      obsolete,
      `These components are gone. Remove them from a11y/coverage.ts:\n${list(obsolete)}`,
    ).toEqual([])
  })

  it('every skip carries a reason', () => {
    const unexplained = Object.entries(A11Y_SKIPPED)
      .filter(([, reason]) => reason.trim().length === 0)
      .map(([file]) => file)

    expect(
      unexplained,
      `A skip without a justification is a hole with a comment shape:\n${list(unexplained)}`,
    ).toEqual([])
  })

  it('every declared sweep is actually run by the a11y tier', () => {
    // The maps can only name a sweep that exists — `SweepId` sees to that.
    // What the type system cannot see is a sweep id nobody ever ran, which is
    // how a "covered" component ends up covered by nothing.
    const unused = (Object.keys(SWEEPS) as Array<SweepId>).filter(
      (sweep) => !a11ySpecSource.includes(`SWEEPS.${sweep}`),
    )

    expect(
      unused,
      `Declared in SWEEPS but no a11y spec runs them:\n${list(unused)}\n\n` +
        'Either add the sweep to src/__tests__/a11y/, or drop the id.',
    ).toEqual([])
  })
})

function list(items: ReadonlyArray<string>): string {
  return items.map((item) => `  - ${item}`).join('\n')
}

function undeclaredMessage(undeclared: ReadonlyArray<string>): string {
  if (undeclared.length === 0) return ''

  return (
    `${undeclared.length} component(s) with no a11y sweep:\n${list(undeclared)}\n\n` +
    'In src/__tests__/a11y/coverage.ts, either:\n' +
    '  - add it to A11Y_COVERAGE naming the sweep that renders it (adding\n' +
    '    the sweep to a11y.spec.ts first if none does), or\n' +
    '  - add it to A11Y_SKIPPED with the reason a sweep would not be\n' +
    '    checking the shipped UI.'
  )
}

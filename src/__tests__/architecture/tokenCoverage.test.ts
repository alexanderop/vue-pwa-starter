/**
 * Holds the Foundations catalogue to the token layer in `src/style.css`.
 *
 * A design token that nobody documented is a literal with a longer name: the
 * next contributor cannot find it, so they type `shadow-lg` and the system
 * grows a sixth elevation level nobody decided on. This is the ledger that
 * catches it — every `--elevation-*`, `--z-*` and `--duration-*` declared in
 * the stylesheet has to appear in a story under `src/stories/foundations/`.
 *
 * It mirrors `a11yCoverage.test.ts` and lives in the architecture tier for the
 * same reason: it is filesystem analysis about the catalogue rather than a
 * test of any rendered component, and it must stay runnable when the tier it
 * grades is red.
 *
 * The other half of the rule — that a Foundations story renders the *live*
 * custom property rather than a copied value — is not machine-checkable and is
 * stated in docs/design-system.md.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const STYLESHEET = fileURLToPath(new URL('../../style.css', import.meta.url))
const FOUNDATIONS = fileURLToPath(new URL('../../stories/foundations/', import.meta.url))
const CLASS_MERGER = fileURLToPath(new URL('../../lib/utils.ts', import.meta.url))

/** The families whose members must each be documented, and where they live. */
const FAMILIES = ['elevation', 'z', 'duration'] as const

const stylesheet = readFileSync(STYLESHEET, 'utf8')

/**
 * Memoised because this file asks the same three questions fourteen times, and
 * the stylesheet is read once at module scope so the answer cannot change.
 */
const tokenCache = new Map<string, Array<string>>()

/**
 * Declarations only — a `var(--elevation-sheet)` reference inside the
 * `@theme inline` alias block is a *use*, and counting it would let a token
 * document itself.
 */
function declaredTokens(family: string): Array<string> {
  const cached = tokenCache.get(family)
  if (cached !== undefined) return cached

  const declaration = new RegExp(String.raw`^\s*(--${family}-[a-z-]+)\s*:`, 'gm')
  const found = [...stylesheet.matchAll(declaration)].map(([, name]) => name ?? '')
  const tokens = [...new Set(found)].toSorted()

  tokenCache.set(family, tokens)
  return tokens
}

const foundationsSource = readdirSync(FOUNDATIONS)
  .filter((file) => file.endsWith('.stories.ts') || file.endsWith('.mdx'))
  .map((file) => readFileSync(`${FOUNDATIONS}${file}`, 'utf8'))
  .join('\n')

describe('design token coverage', () => {
  it('finds the stylesheet and the Foundations catalogue', () => {
    // A moved file would make every assertion below vacuously true.
    expect(stylesheet.length).toBeGreaterThan(0)
    expect(foundationsSource.length).toBeGreaterThan(0)
  })

  it.each(FAMILIES)('declares at least one --%s-* token', (family) => {
    expect(
      declaredTokens(family).length,
      `No --${family}-* token found in src/style.css. Either the family was renamed or this regex is now checking nothing.`,
    ).toBeGreaterThan(0)
  })

  it.each(FAMILIES)('every --%s-* token appears in a Foundations story', (family) => {
    const undocumented = declaredTokens(family).filter(
      (token) => !foundationsSource.includes(token),
    )

    expect(
      undocumented,
      `${undocumented.length} token(s) declared in src/style.css but shown in no Foundations story:\n` +
        `${undocumented.map((token) => `  - ${token}`).join('\n')}\n\n` +
        'Add each to a story under src/stories/foundations/, rendering the live\n' +
        'custom property rather than a copied value. docs/design-system.md',
    ).toEqual([])
  })

  it('names no token the stylesheet does not declare', () => {
    const declared = new Set(FAMILIES.flatMap(declaredTokens))
    const referenced = [...foundationsSource.matchAll(/--(?:elevation|z|duration)-[a-z-]+/g)].map(
      ([token]) => token,
    )
    const stale = [...new Set(referenced)].filter((token) => !declared.has(token)).toSorted()

    expect(
      stale,
      `These tokens are documented but no longer declared in src/style.css:\n` +
        stale.map((token) => `  - ${token}`).join('\n'),
    ).toEqual([])
  })
})

/**
 * The `--text-*` and `--shadow-*` namespaces are also a tailwind-merge
 * problem, not only a documentation one.
 *
 * tailwind-merge classifies an unknown `text-*` or `shadow-*` by shape, and a
 * semantic name matches none of its size or length validators — so it lands in
 * the *colour* group and silently replaces the colour beside it. That is not
 * hypothetical: `cn('text-primary-foreground', 'text-label')` shipped a
 * primary button whose label inherited `--foreground`, at 3.6:1 on its own
 * fill. `src/lib/utils.ts` registers the names; this holds that list to the
 * stylesheet, because the failure mode of forgetting is a contrast bug rather
 * than a broken class.
 */
describe('the class merger knows every scale token', () => {
  const merger = readFileSync(CLASS_MERGER, 'utf8')

  it.each([
    ['text', 'font-size'],
    ['shadow', 'shadow'],
  ])('registers every --%s-* token in the %s group', (family) => {
    const declared = declaredTokens(family)
      .map((token) => token.replace(`--${family}-`, ''))
      // `--text-*--line-height` and friends are modifiers on a rung, not rungs.
      .filter((name) => !name.includes('--'))
    const missing = declared.filter((name) => !merger.includes(`'${name}'`))

    expect(
      missing,
      `${missing.length} ${family} token(s) the class merger does not know:\n` +
        `${missing.map((name) => `  - ${family}-${name}`).join('\n')}\n\n` +
        'Add each to src/lib/utils.ts. Until then tailwind-merge reads them as\n' +
        `colours and will drop the ${family} colour they are written beside.`,
    ).toEqual([])
  })
})

describe('the coverage rule catches omissions', () => {
  it('reads declarations, not the @theme inline aliases that reference them', () => {
    // `--shadow-sheet: var(--elevation-sheet)` must not register as a
    // declaration of `--elevation-sheet`, or a token could document itself.
    expect(declaredTokens('elevation')).toContain('--elevation-sheet')
    expect(declaredTokens('elevation')).not.toContain('--elevation-shadow')
  })

  it('collapses the light and dark declaration of the same token', () => {
    const raised = declaredTokens('elevation').filter((token) => token === '--elevation-raised')

    expect(stylesheet.match(/--elevation-raised\s*:/g)?.length).toBe(2)
    expect(raised).toEqual(['--elevation-raised'])
  })
})

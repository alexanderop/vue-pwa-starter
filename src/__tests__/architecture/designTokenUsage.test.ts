/**
 * Forbids raw depth, layer, and timing utilities in application source.
 *
 * Tokens that are not enforced come back as literals within two features.
 * `tokenCoverage.test.ts` grades the *catalogue* — that every declared token is
 * documented; this file grades the *call sites* — that no call site went around
 * the catalogue. Together they are the reason `shadow-lg` can no longer mean
 * "the FAB" and "the dialog" and "the sheet" in three different files.
 *
 * Scope is application source: `src/` minus the test tiers. A test may name a
 * utility it is asserting about, and grading the graders is how a rule ends up
 * unable to explain itself.
 *
 * Comments are stripped before scanning, for the same reason: a comment cannot
 * style anything, and a rule that forbids naming the thing it forbids cannot be
 * documented where it is enforced. The allowlist below is therefore genuinely
 * empty, which is the acceptance criterion.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SOURCE_ROOT = fileURLToPath(new URL('../../', import.meta.url))

/**
 * Files exempted from a rule, each with the reason it is exempt.
 *
 * Starts empty and should stay that way. The only candidate the design system
 * anticipates is a Foundations story that deliberately renders Tailwind's own
 * defaults beside the tokens for comparison — and even that has to say so here.
 */
const ALLOWLIST: Readonly<Record<string, string>> = {}

interface Rule {
  readonly id: string
  /** Written as a source, so each `matches` call gets a fresh lastIndex. */
  readonly pattern: string
  readonly instead: string
}

const RULES: ReadonlyArray<Rule> = [
  {
    id: 'depth',
    pattern: String.raw`\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl)\b`,
    instead: 'shadow-raised | shadow-sticky | shadow-floating | shadow-sheet | shadow-overlay',
  },
  {
    id: 'layer',
    pattern: String.raw`\bz-(?:\d+|\[\d+\])\b`,
    instead:
      'z-(--z-sticky) | z-(--z-nav) | z-(--z-floating) | z-(--z-overlay) | z-(--z-sheet) | z-(--z-toast)',
  },
  {
    id: 'timing',
    pattern: String.raw`\bduration-\d+\b`,
    instead:
      'duration-(--duration-instant) | -fast | -base | -sheet-in | -sheet-out, or transition-none for no motion at all',
  },
]

const SKIPPED_DIRECTORIES = new Set(['__tests__'])
const SCANNED_EXTENSIONS = ['.vue', '.ts']

function applicationSource(directory: string): Array<string> {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry.name)
        ? []
        : applicationSource(join(directory, entry.name))
    }

    const isScanned = SCANNED_EXTENSIONS.some((extension) => entry.name.endsWith(extension))
    return isScanned ? [join(directory, entry.name)] : []
  })
}

/** `/* … *\/`, `// …`, and `<!-- … -->`, replaced by blanks so lines still line up. */
function withoutComments(source: string): string {
  return source.replaceAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[\s\S]*?-->/g, (comment) =>
    comment.replaceAll(/[^\n]/g, ' '),
  )
}

interface Violation {
  readonly file: string
  readonly line: number
  readonly literal: string
}

interface ScannedFile {
  readonly file: string
  readonly lines: ReadonlyArray<string>
}

/**
 * Every scannable file, walked, read and comment-stripped exactly once.
 *
 * `violations()` used to do all three itself, so `it.each(RULES)` repeated the
 * whole tree walk and every `readFileSync` once per rule — four walks and
 * ~550 reads for a job that needs one walk and ~185. Hoisting it also removes
 * the second name for the same list, which is what made it easy to miss.
 */
const SOURCES: ReadonlyArray<ScannedFile> = applicationSource(SOURCE_ROOT)
  .map((path) => relative(SOURCE_ROOT, path))
  .filter((file) => !(file in ALLOWLIST))
  .map((file) => ({
    file,
    lines: withoutComments(readFileSync(join(SOURCE_ROOT, file), 'utf8')).split('\n'),
  }))

function violations(rule: Rule): Array<Violation> {
  // One regex per rule rather than one per line: `matchAll` does not mutate
  // `lastIndex`, so a shared `g` regex is safe here — which is why the pattern
  // can be stored as a string and compiled once instead of ~38,000 times.
  const pattern = new RegExp(rule.pattern, 'g')

  return SOURCES.flatMap(({ file, lines }) =>
    lines.flatMap((text, index) =>
      [...text.matchAll(pattern)].map(([literal]) => ({ file, line: index + 1, literal })),
    ),
  )
}

const FILES = SOURCES.map(({ file }) => file)

describe('design tokens are the only depth, layer, and timing at a call site', () => {
  it('finds application source to scan', () => {
    // A moved root would make every assertion below vacuously true.
    expect(FILES.length).toBeGreaterThan(0)
    expect(FILES.some((path) => path.endsWith('App.vue'))).toBe(true)
  })

  it.each(RULES)('has no raw $id utility', (rule) => {
    const found = violations(rule)

    expect(
      found,
      `${found.length} raw ${rule.id} utility/utilities in application source:\n` +
        `${found.map(({ file, line, literal }) => `  - ${file}:${line} → ${literal}`).join('\n')}\n\n` +
        `Use a token instead: ${rule.instead}\n` +
        'A level the five names do not cover is a design change: record the\n' +
        'reason in docs/design-system.md rather than adding a literal here.',
    ).toEqual([])
  })

  it('keeps the allowlist empty', () => {
    expect(
      Object.keys(ALLOWLIST),
      'An exemption is a hole. If one is genuinely needed, it belongs here with\n' +
        'its reason — and this assertion should be the thing that made you write it.',
    ).toEqual([])
  })
})

describe('the rule catches what it claims to', () => {
  it.each(RULES)('$id matches the literal it forbids', (rule) => {
    const sample = { depth: 'shadow-lg', layer: 'z-50', timing: 'duration-200' }[rule.id] ?? ''

    expect(new RegExp(rule.pattern).test(sample)).toBe(true)
  })

  it.each(RULES)('$id does not match the token that replaces it', (rule) => {
    const token =
      { depth: 'shadow-sheet', layer: 'z-(--z-sheet)', timing: 'duration-(--duration-base)' }[
        rule.id
      ] ?? ''

    expect(new RegExp(rule.pattern).test(token)).toBe(false)
  })

  it('blanks a comment rather than deleting it, so line numbers survive', () => {
    const source = 'a\n/* shadow-lg */\nb'

    expect(withoutComments(source).split('\n')).toHaveLength(3)
    expect(withoutComments(source)).not.toContain('shadow-lg')
  })
})

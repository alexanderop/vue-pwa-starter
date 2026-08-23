/**
 * Holds the Storybook component-state catalogue to the source tree.
 *
 * Stories are the rendered-state ledger for shared components, feature UI,
 * and route-level views. A green Storybook run cannot report a component it
 * never discovered, so completeness is graded here in the filesystem-aware
 * architecture tier. Compound primitives deliberately receive one story for
 * their provider tree rather than one disconnected story per internal part.
 * Full reasoning: docs/design-system.md.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SOURCE_ROOT = fileURLToPath(new URL('../../', import.meta.url))
const COMPONENTS_DIR = join(SOURCE_ROOT, 'components')
const COMPONENT_TESTS_DIR = join(SOURCE_ROOT, '__tests__/components')
const TOUCH_TESTS_DIR = join(SOURCE_ROOT, '__tests__/touch')
const FEATURE_COMPONENTS_DIR = join(SOURCE_ROOT, 'features')
const VIEWS_DIR = join(SOURCE_ROOT, 'views')

/** Stories that inherited executable contracts from the former isolated specs. */
const PLAY_REQUIRED = new Set([
  'components/atoms/AtomAvatar.stories.ts',
  'components/atoms/AtomCard.stories.ts',
  'components/atoms/AtomCheckbox.stories.ts',
  'components/atoms/AtomProgress.stories.ts',
  'components/atoms/AtomSeparator.stories.ts',
  'components/atoms/AtomSlider.stories.ts',
  'components/atoms/AtomBadge.stories.ts',
  'components/atoms/AtomRadioGroup/AtomRadioGroup.stories.ts',
  'components/atoms/AtomButton.stories.ts',
  'components/atoms/AtomInput.stories.ts',
  'components/atoms/AtomLabel.stories.ts',
  'components/atoms/AtomSelect.stories.ts',
  'components/atoms/AtomSkeleton.stories.ts',
  'components/atoms/AtomSpinner.stories.ts',
  'components/atoms/AtomSwitch.stories.ts',
  'components/atoms/AtomTextarea.stories.ts',
  'components/molecules/MoleculeAlert.stories.ts',
  'components/molecules/MoleculeEmptyState.stories.ts',
  'components/molecules/MoleculeSearchField.stories.ts',
  'components/molecules/MoleculePageHeader.stories.ts',
  'components/molecules/MoleculeToastViewport.stories.ts',
  'components/molecules/dialog/MoleculeDialog.stories.ts',
  'components/molecules/MoleculeSwipeableRow.stories.ts',
  'components/molecules/action-sheet/MoleculeActionSheet.stories.ts',
  'components/molecules/chip-row/MoleculeChipRow.stories.ts',
  'components/molecules/list/MoleculeList.stories.ts',
  'components/molecules/numeric-input/MoleculeNumericInput.stories.ts',
  'components/molecules/sheet/MoleculeSheet.stories.ts',
  'components/molecules/tabs/MoleculeTabs.stories.ts',
  'components/organisms/OrganismAppShell.stories.ts',
  'components/organisms/OrganismBottomNav.stories.ts',
  'components/organisms/OrganismOfflineBanner.stories.ts',
  'components/organisms/OrganismPullToRefresh.stories.ts',
  'components/templates/TemplatePageLayout.stories.ts',
])

/** Contracts an isolated story cannot prove faithfully. */
const COMPONENT_SPEC_EXCEPTIONS = [
  '__tests__/components/atoms/atomSwitch.spec.ts',
  '__tests__/components/organisms/pwaInstall.spec.ts',
  '__tests__/components/touchConventions.spec.ts',
] as const

/** App-composed coarse-pointer contracts that cannot be isolated in a story. */
const TOUCH_SPEC_BOUNDARIES = [
  '__tests__/touch/sheetFocus.spec.ts',
  '__tests__/touch/touchTargets.spec.ts',
] as const

interface StoryContract {
  owner: string
  story: string
}

const sourcePath = (path: string): string => relative(SOURCE_ROOT, path)

function filesBelow(directory: string, suffix: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return filesBelow(path, suffix)
    return entry.isFile() && entry.name.endsWith(suffix) ? [path] : []
  })
}

/** Flat components and feature/view components own a same-basename story. */
function directContracts(directory: string): StoryContract[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isFile() || !entry.name.endsWith('.vue')) return []

    const base = entry.name.slice(0, -'.vue'.length)
    return [
      {
        owner: sourcePath(join(directory, entry.name)),
        story: sourcePath(join(directory, `${base}.stories.ts`)),
      },
    ]
  })
}

function sharedComponentContracts(): StoryContract[] {
  return readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((tier) => {
      const tierDirectory = join(COMPONENTS_DIR, tier.name)
      const flat = directContracts(tierDirectory)
      const compounds = readdirSync(tierDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
          const directory = join(tierDirectory, entry.name)
          const stories = readdirSync(directory).filter((file) => file.endsWith('.stories.ts'))
          return {
            owner: `${sourcePath(directory)}/ provider tree`,
            story:
              stories.length === 1
                ? sourcePath(join(directory, stories[0] ?? ''))
                : `${sourcePath(directory)}/<exactly-one-provider-tree-story>`,
          }
        })

      return [...flat, ...compounds]
    })
}

function nestedComponentContracts(directory: string): StoryContract[] {
  return filesBelow(directory, '.vue').map((owner) => ({
    owner: sourcePath(owner),
    story: sourcePath(owner.replace(/\.vue$/, '.stories.ts')),
  }))
}

const CONTRACTS = [
  ...sharedComponentContracts(),
  ...nestedComponentContracts(FEATURE_COMPONENTS_DIR),
  ...directContracts(VIEWS_DIR),
]

describe('Storybook component-state coverage', () => {
  it('finds source components to catalogue', () => {
    expect(CONTRACTS.length).toBeGreaterThan(0)
  })

  it.each(CONTRACTS.map((contract) => [contract.owner, contract] as const))(
    '%s has its colocated story contract',
    (_owner, contract) => {
      expect(
        existsSync(join(SOURCE_ROOT, contract.story)),
        `${contract.owner} has no Storybook state catalogue at ${contract.story}. Add the required named states, interactions, and accessibility coverage there. Compound primitives get one story for the public provider tree. docs/design-system.md`,
      ).toBe(true)
    },
  )

  it.each(CONTRACTS.map((contract) => [contract.story, contract] as const))(
    '%s is explicit and documented',
    (_story, contract) => {
      if (!existsSync(join(SOURCE_ROOT, contract.story))) return

      const source = readFileSync(join(SOURCE_ROOT, contract.story), 'utf8')
      expect(
        source,
        `${contract.story} must declare an explicit title: the sidebar and permalink are public catalogue contracts. docs/design-system.md`,
      ).toMatch(/\btitle:\s*['"](?:Components|Features|Screens)\//)
      if (!contract.story.startsWith('views/')) {
        expect(
          source,
          `${contract.story} must opt into Autodocs with the autodocs tag. docs/design-system.md`,
        ).toMatch(/\btags:\s*\[\s*['"]autodocs['"]\s*\]/)
      }
      if (PLAY_REQUIRED.has(contract.story)) {
        expect(
          source,
          `${contract.story} lost every play function. Its interaction, semantic, or geometry contract belongs in the story; do not recreate a parallel isolated component spec. docs/design-system.md`,
        ).toMatch(/\bplay:\s*async\s*\(/)
      }
    },
  )

  it('keeps standalone component specs to the documented boundary exceptions', () => {
    expect(filesBelow(COMPONENT_TESTS_DIR, '.spec.ts').map(sourcePath).toSorted()).toEqual(
      [...COMPONENT_SPEC_EXCEPTIONS].toSorted(),
    )
  })

  it('keeps the touch tier for app-composed contracts rather than isolated components', () => {
    expect(filesBelow(TOUCH_TESTS_DIR, '.spec.ts').map(sourcePath).toSorted()).toEqual(
      [...TOUCH_SPEC_BOUNDARIES].toSorted(),
    )
  })
})

describe('the coverage rule catches omissions', () => {
  it('derives a same-basename story for a component', () => {
    expect(directContracts(join(COMPONENTS_DIR, 'atoms'))).toContainEqual({
      owner: 'components/atoms/AtomButton.vue',
      story: 'components/atoms/AtomButton.stories.ts',
    })
  })

  it('catalogues each compound primitive once, not each part', () => {
    const dialog = CONTRACTS.filter((contract) => contract.owner.includes('molecules/dialog'))
    expect(dialog).toEqual([
      {
        owner: 'components/molecules/dialog/ provider tree',
        story: 'components/molecules/dialog/MoleculeDialog.stories.ts',
      },
    ])
  })

  it('recognises a migrated story as an executable contract', () => {
    expect(PLAY_REQUIRED).toContain('components/atoms/AtomButton.stories.ts')
  })
})

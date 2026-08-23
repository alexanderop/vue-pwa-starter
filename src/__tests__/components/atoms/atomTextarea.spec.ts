import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import { describe, expect } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import AtomTextarea from '@/components/atoms/AtomTextarea.vue'
import { assertNoViolations } from '../../helpers/a11y'
import { it as base } from '../../fixtures'

/**
 * Everything `AtomInput` promises, plus the one thing that makes a textarea a
 * textarea: Enter belongs to the text, not to the form. That is the claim
 * that breaks when someone reaches for a single-line control and styles it
 * taller — the field looks identical, accepts one line, and swallows the
 * user's note the first time they press Enter to start a paragraph.
 *
 * It is also a claim only a real form in a real browser can make. The
 * behaviour is the browser's implicit-submission rule, not a handler this
 * component runs, so there is nothing to assert against short of pressing the
 * key and seeing what the page does.
 */

/** `min-h-24`, in px at the 16px root — room for more than one line. */
const MIN_HEIGHT = 96

/** Below this, mobile Safari zooms the page on focus and never zooms back. */
const NO_ZOOM_FONT_SIZE = 16

const Harness = defineComponent({
  setup() {
    const body = ref('')
    const submitted = ref(false)
    return { body, submitted }
  },
  render() {
    return h(
      'form',
      {
        onSubmit: (event: Event) => {
          event.preventDefault()
          this.submitted = true
        },
      },
      [
        h('label', { for: 'body' }, 'Note'),
        h(AtomTextarea, {
          id: 'body',
          modelValue: this.body,
          'onUpdate:modelValue': (value: string) => {
            this.body = value
          },
        }),
        h('output', this.submitted ? 'submitted' : 'editing'),
      ],
    )
  },
})

const it = base.extend('note', async ({}, { onCleanup }) => {
  const mounted = render(Harness)
  onCleanup(() => mounted.unmount())

  return {
    container: mounted.container,
    control: page.getByRole('textbox', { name: 'Note' }),
    form: page.getByRole('status'),
  }
})

describe('AtomTextarea', () => {
  it('has no accessibility violations', async ({ note }) => {
    await assertNoViolations(note.container)
  })

  it('is named by the label pointing at it', async ({ note }) => {
    await expect.element(note.control).toHaveAccessibleName('Note')
  })

  /**
   * Two claims in one press, because they are the same failure seen from
   * either side: Enter has to reach the value, and it has to *not* reach the
   * form. A single-line control swapped in here passes neither, and passes
   * every other test in this file.
   */
  it('takes a newline from Enter instead of submitting the form', async ({ note }) => {
    await note.control.fill('first line')
    await userEvent.keyboard('{Enter}second line')

    await expect.element(note.control).toHaveValue('first line\nsecond line')
    await expect
      .element(note.form, {
        message:
          'Enter submitted the form — this is a single-line control wearing a textarea’s styling',
      })
      .toHaveTextContent('editing')
  })

  it('does not zoom the page when a phone focuses it', ({ note }) => {
    const fontSize = Number.parseFloat(getComputedStyle(note.control.element()).fontSize)

    expect(
      fontSize,
      'the field renders below 16px — mobile Safari zooms the page in on focus and never zooms back out',
    ).toBeGreaterThanOrEqual(NO_ZOOM_FONT_SIZE)
  })

  /**
   * The minimum is the whole reason to reach for this over an input: a
   * multi-line field that opens one line tall tells the user to be brief.
   */
  it('opens tall enough to show more than one line', ({ note }) => {
    expect(
      Math.round(note.control.element().getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(MIN_HEIGHT)
  })
})

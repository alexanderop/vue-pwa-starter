import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import AtomLabel from './AtomLabel.vue'
import AtomSelect from './AtomSelect.vue'

const meta = {
  title: 'Components/Atoms/Select',
  component: AtomSelect,
  tags: ['autodocs'],
  args: { modelValue: '' },
  render: (args) => ({
    components: { AtomSelect },
    setup: () => ({ args }),
    template: `<AtomSelect v-bind="args" aria-label="Language">
      <option value="" disabled>Choose a language</option><option value="en">English</option><option value="de">Deutsch</option>
    </AtomSelect>`,
  }),
} satisfies Meta<typeof AtomSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Selected: Story = { args: { modelValue: 'de' } }
export const Disabled: Story = {
  render: () => ({
    components: { AtomSelect },
    template:
      '<AtomSelect model-value="en" aria-label="Language" disabled><option value="en">English</option></AtomSelect>',
  }),
}
export const LongOption: Story = {
  render: (args) => ({
    components: { AtomSelect },
    setup: () => ({ args }),
    template: `<AtomSelect v-bind="args" aria-label="Workspace"><option value="long">A very long option showing how native selection handles constrained mobile layouts</option></AtomSelect>`,
  }),
}
export const Labeled: Story = {
  args: { modelValue: 'en' },
  render: (args) => ({
    components: { AtomLabel, AtomSelect },
    setup: () => ({ args, value: ref(String(args.modelValue ?? 'en')) }),
    template: `<div class="flex max-w-sm flex-col gap-2"><AtomLabel for="locale-story">Language</AtomLabel><AtomSelect id="locale-story" v-model="value"><option value="en">English</option><option value="de">Deutsch</option></AtomSelect><output>{{ value }}</output></div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const select = canvas.getByRole('combobox', { name: 'Language' })
    await expect(select).toHaveValue('en')
    await userEvent.selectOptions(select, 'de')
    await expect(select).toHaveValue('de')
    await expect(canvas.getByRole('status')).toHaveTextContent('de')

    const icon = canvasElement.querySelector('[data-slot="select-icon"]')
    if (icon === null) throw new Error('select icon not found')
    const box = icon.getBoundingClientRect()
    await expect(
      document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.tagName,
    ).toBe('SELECT')
  },
}

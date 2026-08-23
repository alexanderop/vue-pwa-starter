import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import QuickAddNoteSheet from './QuickAddNoteSheet.vue'

const meta = {
  title: 'Features/Notes/Quick-add sheet',
  component: QuickAddNoteSheet,
  tags: ['autodocs'],
  args: { open: false },
} satisfies Meta<typeof QuickAddNoteSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}
export const Empty: Story = { args: { open: true } }
export const DisabledSave: Story = {
  args: { open: true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await expect(body.getByRole('button', { name: 'Save' })).toBeDisabled()
  },
}
export const Filled: Story = {
  args: { open: true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.type(body.getByRole('textbox', { name: 'Title' }), 'Buy oat milk')
    await userEvent.type(body.getByRole('textbox', { name: 'Note' }), 'Unsweetened')
    await expect(body.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}
export const SuccessfulSave: Story = {
  args: { open: true },
  render: (args) => ({
    components: { QuickAddNoteSheet },
    setup: () => ({ args }),
    template: '<div><QuickAddNoteSheet v-bind="args" /><div id="toast-root"></div></div>',
  }),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.type(body.getByRole('textbox', { name: 'Title' }), 'Buy oat milk')
    await userEvent.click(body.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}

import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, When, Then } = createBdd()

Given('I open the app', async ({ page }) => {
  await page.goto('/')
})

When('I add a note titled {string}', async ({ page }, title: string) => {
  await page.getByRole('button', { name: 'Add a note' }).click()
  await page.getByLabel('Title').fill(title)
  await page.getByRole('button', { name: 'Save' }).click()
})

When('I reload the app', async ({ page }) => {
  await page.reload()
})

Then('I see a note titled {string}', async ({ page }, title: string) => {
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})

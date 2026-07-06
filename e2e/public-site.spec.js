import { test, expect } from '@playwright/test'

test.describe('Public site', () => {
  test('loads the hero and can open the join modal', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /ceylon\s+badminton club/i })).toBeVisible()

    await page.getByRole('button', { name: /join the club/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('scrolls to a section via the nav', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Sections').getByRole('link', { name: 'Sessions', exact: true }).click()
    await expect(page.locator('#sessions')).toBeInViewport()
  })

  test('has no horizontal overflow at common viewport widths', async ({ page }) => {
    for (const width of [390, 820, 1180, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
    }
  })
})

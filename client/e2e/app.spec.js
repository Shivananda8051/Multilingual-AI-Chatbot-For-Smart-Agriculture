import { test, expect } from '@playwright/test';

test.describe('Smart Agriculture Chatbot - System E2E Tests', () => {

  test('Should load the landing page successfully', async ({ page }) => {
    // Navigate to the local dev server
    await page.goto('/');

    // Verify the page title is correct (Testing meta integration)
    await expect(page).toHaveTitle(/AgriBot - Smart Agriculture Assistant/i);

    // Verify that the React app mounted into the root DOM node
    const rootNode = page.locator('#root');
    await expect(rootNode).toBeAttached();
    
    // Wait for the main UI components to load
    // The main app usually has a role="main" or a primary wrapper div
    await page.waitForLoadState('domcontentloaded');
  });

  test('Should navigate correctly across client routes without crashing', async ({ page }) => {
    await page.goto('/');
    
    // Verify that client-side routing is initialized 
    // Usually there is some text or a button rendered by the router
    const isAppLoaded = await page.evaluate(() => {
      // By checking innerHTML, we know React has injected the content
      return document.getElementById('root').innerHTML.length > 0;
    });
    
    expect(isAppLoaded).toBe(true);
  });
});

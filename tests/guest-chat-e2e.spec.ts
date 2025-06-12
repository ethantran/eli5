import { test, expect } from '@playwright/test';

test.describe('Guest Chat - End-to-End Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000'); // Updated to correct port from your logs
    });

    test.describe('Message Creation and Basic Flow', () => {
        test('should create a message and get AI response', async ({ page }) => {
            // Navigate to guest chat interface
            await page.click('text=Try Guest Mode');

            // Wait for the guest chat interface to load
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

            // Type a message
            const chatInput = page.locator('input[placeholder*="Ask me anything"]');
            await chatInput.fill('explain photosynthesis');

            // Send the message
            await page.keyboard.press('Enter');

            // Verify user message appears
            await expect(page.locator('text=explain photosynthesis')).toBeVisible();

            // Verify that we eventually get an AI response
            await expect(page.locator('text*="photosynthesis"')).toBeVisible({ timeout: 35000 });

            // Verify no pending/loading states remain
            await expect(page.locator('[data-status="pending"]')).toHaveCount(0);

            console.log('✅ Basic message creation and response flow works');
        });

        test('should handle multiple rapid messages without getting stuck', async ({ page }) => {
            // Navigate to guest chat interface
            await page.click('text=Try Guest Mode');
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

            const chatInput = page.locator('input[placeholder*="Ask me anything"]');

            // Send multiple messages rapidly to test race conditions
            const messages = [
                'what is AI',
                'explain computers',
                'how does internet work'
            ];

            for (const message of messages) {
                await chatInput.fill(message);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(100); // Small delay between messages
            }

            // Wait for all messages to be processed (allow up to 60 seconds total)
            await page.waitForTimeout(5000); // Initial wait

            // Check for any stuck loading bubbles
            const pendingBubbles = page.locator('[data-status="pending"]');
            const pendingCount = await pendingBubbles.count();

            if (pendingCount > 0) {
                console.log(`❌ Found ${pendingCount} stuck loading bubbles`);

                // Wait a bit more to see if they resolve
                await page.waitForTimeout(30000);

                const stillPendingCount = await pendingBubbles.count();
                if (stillPendingCount > 0) {
                    await page.screenshot({ path: 'multiple-stuck-loading-bubbles.png' });
                    throw new Error(`${stillPendingCount} loading bubbles are still stuck after rapid message sending`);
                }
            }

            console.log('✅ Multiple message test passed: No stuck loading bubbles');
        });
    });

    test.describe('Level Changing - Method 1: Dropdown Button', () => {
        test('should change level using dropdown button', async ({ page }) => {
            // Navigate to guest chat and create a message
            await page.click('text=Try Guest Mode');
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

            const chatInput = page.locator('input[placeholder*="Ask me anything"]');
            await chatInput.fill('explain gravity');
            await page.keyboard.press('Enter');

            // Wait for AI response
            await expect(page.locator('text*="gravity"')).toBeVisible({ timeout: 35000 });

            // Find the first message's "Change level" button
            const changeLevelButton = page.locator('button:has-text("Change level")').first();
            await expect(changeLevelButton).toBeVisible();

            // Click the change level button
            await changeLevelButton.click();

            // Verify dropdown opens
            await expect(page.locator('text=Choose level')).toBeVisible();

            // Click on a different level (e.g., College)
            await page.locator('text=College').click();

            // Verify dropdown closes and new explanation appears
            await expect(page.locator('text=Choose level')).not.toBeVisible();

            // Wait for regenerated message at college level
            await expect(page.locator('text*="gravity"')).toBeVisible({ timeout: 35000 });

            // Verify the level badge shows "College"
            await expect(page.locator('text=College').first()).toBeVisible();

            console.log('✅ Level change via dropdown button works');
        });

        test('CRITICAL: dropdown should not flash when clicking change level button', async ({ page }) => {
            // This test specifically prevents the flashing dropdown regression
            await page.click('text=Try Guest Mode');
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

            const chatInput = page.locator('input[placeholder*="Ask me anything"]');
            await chatInput.fill('test message');
            await page.keyboard.press('Enter');

            // Wait for AI response
            await expect(page.locator('text*="test"')).toBeVisible({ timeout: 35000 });

            const changeLevelButton = page.locator('button:has-text("Change level")').first();
            await expect(changeLevelButton).toBeVisible();

            // Click the change level button
            await changeLevelButton.click();

            // The dropdown should appear and stay visible (not flash)
            await expect(page.locator('text=Choose level')).toBeVisible();

            // Wait a moment to ensure it doesn't disappear immediately
            await page.waitForTimeout(1000);

            // Dropdown should still be visible (no flashing)
            await expect(page.locator('text=Choose level')).toBeVisible();

            // Click outside to close
            await page.click('body');
            await expect(page.locator('text=Choose level')).not.toBeVisible();

            console.log('✅ No dropdown flashing detected - regression prevented');
        });
    });

    test.describe('Level Changing - Method 2: Text Selection', () => {
        test('should change level by selecting text', async ({ page }) => {
            // Navigate to guest chat and create a message
            await page.click('text=Try Guest Mode');
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

            const chatInput = page.locator('input[placeholder*="Ask me anything"]');
            await chatInput.fill('explain DNA');
            await page.keyboard.press('Enter');

            // Wait for AI response
            await expect(page.locator('text*="DNA"')).toBeVisible({ timeout: 35000 });

            // Find the AI message content
            const messageContent = page.locator('[data-status="complete"]').last();
            await expect(messageContent).toBeVisible();

            // Select some text in the message (simulate highlighting)
            await messageContent.click();

            // Simulate text selection by triple-clicking to select paragraph
            await messageContent.click({ clickCount: 3 });

            // Wait for text selection dropdown to appear
            await expect(page.locator('text=Choose level')).toBeVisible({ timeout: 5000 });

            // Click on a different level (e.g., PhD)
            await page.locator('text=PhD').click();

            // Verify dropdown closes and new explanation appears
            await expect(page.locator('text=Choose level')).not.toBeVisible();

            // Wait for regenerated message at PhD level
            await expect(page.locator('text*="DNA"')).toBeVisible({ timeout: 35000 });

            // Verify the level badge shows "PhD"
            await expect(page.locator('text=PhD').first()).toBeVisible();

            console.log('✅ Level change via text selection works');
        });

        test('CRITICAL: text selection dropdown should not flash', async ({ page }) => {
            // This test prevents the text selection dropdown flashing regression
            await page.click('text=Try Guest Mode');
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

            const chatInput = page.locator('input[placeholder*="Ask me anything"]');
            await chatInput.fill('short test');
            await page.keyboard.press('Enter');

            // Wait for AI response
            await expect(page.locator('text*="test"')).toBeVisible({ timeout: 35000 });

            const messageContent = page.locator('[data-status="complete"]').last();
            await expect(messageContent).toBeVisible();

            // Simulate text selection
            await messageContent.click({ clickCount: 3 });

            // The dropdown should appear and stay visible (not flash)
            const dropdown = page.locator('text=Choose level');
            await expect(dropdown).toBeVisible({ timeout: 5000 });

            // Wait to ensure it doesn't disappear immediately
            await page.waitForTimeout(1000);

            // Dropdown should still be visible (no flashing)
            await expect(dropdown).toBeVisible();

            console.log('✅ No text selection dropdown flashing detected');
        });
    });

    test.describe('Error Handling', () => {
        test('should handle errors gracefully without stuck loading states', async ({ page }) => {
            // Navigate to guest chat interface
            await page.click('text=Try Guest Mode');
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

            // Intercept the API call and make it fail
            await page.route('**/api/**', route => {
                route.abort('failed');
            });

            const chatInput = page.locator('input[placeholder*="Ask me anything"]');
            await chatInput.fill('this should cause an error');
            await page.keyboard.press('Enter');

            // Wait for error handling
            await page.waitForTimeout(10000);

            // Check if there are any stuck loading bubbles
            const pendingBubbles = page.locator('[data-status="pending"]');
            const pendingCount = await pendingBubbles.count();

            if (pendingCount > 0) {
                await page.screenshot({ path: 'error-stuck-loading-bubble.png' });
                throw new Error('Loading bubble got stuck even after error condition');
            }

            // Should show an error message instead
            await expect(page.locator('text*="error", text*="Error", text*="Sorry"')).toBeVisible({ timeout: 15000 });

            console.log('✅ Error handling test passed: No stuck loading bubbles on error');
        });
    });

    test.describe('Level Badge Display', () => {
        test('should show correct level badges for messages', async ({ page }) => {
            await page.click('text=Try Guest Mode');
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

            const chatInput = page.locator('input[placeholder*="Ask me anything"]');
            await chatInput.fill('explain atoms');
            await page.keyboard.press('Enter');

            // Wait for AI response (default should be Elementary)
            await expect(page.locator('text*="atoms"')).toBeVisible({ timeout: 35000 });

            // Verify the default level badge
            await expect(page.locator('text=Elementary').first()).toBeVisible();

            // Change to a different level and verify the badge updates
            const changeLevelButton = page.locator('button:has-text("Change level")').first();
            await changeLevelButton.click();
            await page.locator('text=High School').click();

            // Wait for regenerated message
            await expect(page.locator('text*="atoms"')).toBeVisible({ timeout: 35000 });

            // Verify the updated level badge
            await expect(page.locator('text=High School').first()).toBeVisible();

            console.log('✅ Level badge display works correctly');
        });
    });

    test.describe('Guest Mode Features', () => {
        test('should show guest mode notifications in dropdown', async ({ page }) => {
            await page.click('text=Try Guest Mode');
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

            const chatInput = page.locator('input[placeholder*="Ask me anything"]');
            await chatInput.fill('test guest mode');
            await page.keyboard.press('Enter');

            // Wait for AI response
            await expect(page.locator('text*="test"')).toBeVisible({ timeout: 35000 });

            // Open dropdown
            const changeLevelButton = page.locator('button:has-text("Change level")').first();
            await changeLevelButton.click();

            // Verify guest mode notice appears
            await expect(page.locator('text*="guest mode"')).toBeVisible();

            console.log('✅ Guest mode notifications display correctly');
        });
    });
}); 
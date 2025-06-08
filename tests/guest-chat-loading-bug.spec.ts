import { test, expect } from '@playwright/test';

test.describe('Guest Chat Loading Bubble Bug Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3002'); // Use the correct port from dev server
    });

    test('should not get stuck with loading bubble when sending a message', async ({ page }) => {
        // Navigate to guest chat interface
        await page.click('text=Try Guest Mode');

        // Wait for the guest chat interface to load
        await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();

        // Type a message
        const chatInput = page.locator('input[placeholder*="Ask me anything"]');
        await chatInput.fill('explain quantum physics');

        // Send the message
        await page.keyboard.press('Enter');

        // Verify user message appears
        await expect(page.locator('text=explain quantum physics')).toBeVisible();

        // Check if there's a loading/pending message bubble
        const loadingBubble = page.locator('[data-status="pending"]').first();

        if (await loadingBubble.isVisible()) {
            console.log('Loading bubble found, waiting for it to resolve...');

            // Wait up to 30 seconds for the loading bubble to be replaced with actual content
            // This should be enough time for the AI to respond
            const startTime = Date.now();
            let isStillLoading = true;

            while (isStillLoading && (Date.now() - startTime) < 30000) {
                await page.waitForTimeout(1000); // Wait 1 second
                isStillLoading = await loadingBubble.isVisible();

                // Also check if we have a completed message
                const completedMessage = page.locator('[data-status="complete"]').last();
                if (await completedMessage.isVisible()) {
                    isStillLoading = false;
                    break;
                }
            }

            // If still loading after 30 seconds, the bug is present
            if (isStillLoading) {
                console.log('❌ BUG CONFIRMED: Loading bubble is stuck after 30 seconds');

                // Take a screenshot for debugging
                await page.screenshot({ path: 'stuck-loading-bubble.png' });

                // Log the current state
                const allMessages = await page.locator('[role="article"], [data-testid*="message"]').all();
                console.log(`Total messages found: ${allMessages.length}`);

                for (let i = 0; i < allMessages.length; i++) {
                    const messageText = await allMessages[i].textContent();
                    const messageStatus = await allMessages[i].getAttribute('data-status');
                    console.log(`Message ${i}: "${messageText}" (status: ${messageStatus})`);
                }

                throw new Error('Loading bubble got stuck - the bug is still present!');
            } else {
                console.log('✅ Loading bubble resolved successfully');
            }
        }

        // Verify that we eventually get an AI response
        await expect(page.locator('text*="quantum"')).toBeVisible({ timeout: 35000 });

        // Verify no pending/loading states remain
        await expect(page.locator('[data-status="pending"]')).toHaveCount(0);

        console.log('✅ Test passed: No stuck loading bubbles found');
    });

    test('should handle multiple rapid messages without getting stuck', async ({ page }) => {
        // Navigate to guest chat interface
        await page.click('text=Try Guest Mode');

        // Wait for the guest chat interface to load
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

    test('should handle errors gracefully without stuck loading states', async ({ page }) => {
        // Navigate to guest chat interface
        await page.click('text=Try Guest Mode');

        // Wait for the guest chat interface to load
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
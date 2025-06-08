import { convexTest } from "convex-test";
import { expect, test, describe, vi, beforeEach, afterEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// Mock Anthropic response
const mockAnthropicResponse = {
    content: [
        {
            type: 'text',
            text: 'This is a mock explanation for testing the frontend integration workflow.'
        }
    ],
    usage: { input_tokens: 10, output_tokens: 20 },
    model: 'claude-3-5-sonnet-20241022'
};

// Define global process for edge-runtime environment
// @ts-ignore
if (typeof process === 'undefined') {
    // @ts-ignore
    globalThis.process = { env: {} };
}

// Mock the Anthropic module
vi.mock('@anthropic-ai/sdk', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            messages: {
                create: vi.fn().mockResolvedValue(mockAnthropicResponse)
            }
        }))
    };
});

describe("Frontend Integration Workflow Tests", () => {
    beforeEach(() => {
        if (process?.env) {
            process.env.ANTHROPIC_API_KEY = "sk-test-key-for-mocking";
        }
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (process?.env) {
            delete process.env.ANTHROPIC_API_KEY;
        }
    });

    test("simulate exact frontend handleSendMessage workflow", async () => {
        const t = convexTest(schema);

        // Simulate the exact parameters the frontend sends
        const userInput = "How do computers work?";
        const sessionId = "guest-session-12345";
        const level = "elementary";

        console.log("=== SIMULATING FRONTEND WORKFLOW ===");
        console.log("User input:", userInput);
        console.log("Session ID:", sessionId);
        console.log("Level:", level);

        // This is exactly what the frontend does in handleSendMessage
        try {
            console.log("Calling generateGuestExplanation...");

            const response = await t.action(api.guest.generateGuestExplanation, {
                content: userInput,
                level,
                sessionId,
            });

            console.log("Response received:", {
                hasId: !!response.id,
                hasContent: !!response.content,
                hasLevel: !!response.level,
                hasMetadata: !!response.metadata,
                contentLength: response.content.length,
                idFormat: response.id,
                level: response.level
            });

            // Verify the response structure the frontend expects
            expect(response).toHaveProperty('id');
            expect(response).toHaveProperty('content');
            expect(response).toHaveProperty('level');
            expect(response).toHaveProperty('metadata');

            // Verify the types are correct
            expect(typeof response.id).toBe('string');
            expect(typeof response.content).toBe('string');
            expect(response.level).toBe(level);
            expect(typeof response.metadata).toBe('object');

            // Verify the ID format is what frontend expects for updating
            expect(response.id).toMatch(/^response-\d+-[a-z0-9]+$/);

            // Verify content is not empty (frontend checks this)
            expect(response.content.length).toBeGreaterThan(0);

            console.log("✅ Response structure matches frontend expectations");

            return response; // Return for potential follow-up tests

        } catch (error) {
            console.error("❌ Action failed:", error);
            throw error;
        }
    });

    test("simulate exact frontend handleLevelChange workflow", async () => {
        const t = convexTest(schema);

        // First, simulate getting a response (like the frontend would have)
        const originalResponse = await t.action(api.guest.generateGuestExplanation, {
            content: "Explain quantum physics",
            level: "elementary",
            sessionId: "level-change-session",
        });

        console.log("=== SIMULATING LEVEL CHANGE WORKFLOW ===");
        console.log("Original level:", originalResponse.level);
        console.log("Original message ID:", originalResponse.id);

        // Now simulate changing the level (exactly what frontend does)
        const newLevel = "college";
        const originalContent = "Explain quantum physics"; // Frontend finds this from message history

        try {
            console.log("Calling regenerateAtLevel...");

            const regeneratedResponse = await t.action(api.guest.regenerateAtLevel, {
                originalContent,
                newLevel,
                sessionId: "level-change-session",
            });

            console.log("Regenerated response received:", {
                hasId: !!regeneratedResponse.id,
                hasContent: !!regeneratedResponse.content,
                hasLevel: !!regeneratedResponse.level,
                hasMetadata: !!regeneratedResponse.metadata,
                newLevel: regeneratedResponse.level,
                hasRegeneratedFrom: !!regeneratedResponse.metadata.regeneratedFrom
            });

            // Verify the regenerated response structure
            expect(regeneratedResponse).toHaveProperty('id');
            expect(regeneratedResponse).toHaveProperty('content');
            expect(regeneratedResponse).toHaveProperty('level');
            expect(regeneratedResponse).toHaveProperty('metadata');

            // Verify level was changed correctly
            expect(regeneratedResponse.level).toBe(newLevel);
            expect(regeneratedResponse.metadata.regeneratedFrom).toBe(newLevel);

            // Verify new ID was generated
            expect(regeneratedResponse.id).toMatch(/^regenerated-\d+-[a-z0-9]+$/);
            expect(regeneratedResponse.id).not.toBe(originalResponse.id);

            console.log("✅ Level change workflow works correctly");

        } catch (error) {
            console.error("❌ Level change failed:", error);
            throw error;
        }
    });

    test("simulate multiple concurrent requests like real usage", async () => {
        const t = convexTest(schema);

        console.log("=== SIMULATING CONCURRENT USAGE ===");

        // Simulate multiple users asking questions simultaneously
        const requests = [
            { content: "How does the internet work?", level: "middle", sessionId: "session-1" },
            { content: "What is artificial intelligence?", level: "high", sessionId: "session-2" },
            { content: "Explain photosynthesis", level: "elementary", sessionId: "session-3" }
        ] as const;

        console.log("Sending concurrent requests:", requests.length);

        try {
            const responses = await Promise.all(
                requests.map(req =>
                    t.action(api.guest.generateGuestExplanation, req)
                )
            );

            console.log("All concurrent requests completed");

            // Verify all responses are valid
            expect(responses).toHaveLength(3);

            responses.forEach((response, index) => {
                const expectedLevel = requests[index].level;

                expect(response).toHaveProperty('id');
                expect(response).toHaveProperty('content');
                expect(response.level).toBe(expectedLevel);
                expect(response.content.length).toBeGreaterThan(0);

                console.log(`✅ Response ${index + 1} valid: ${response.id.substring(0, 20)}...`);
            });

            // Verify all IDs are unique (critical for frontend message tracking)
            const ids = responses.map(r => r.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(responses.length);

            console.log("✅ All concurrent responses have unique IDs");

        } catch (error) {
            console.error("❌ Concurrent requests failed:", error);
            throw error;
        }
    });

    test("verify response timing expectations", async () => {
        const t = convexTest(schema);

        console.log("=== TESTING RESPONSE TIMING ===");

        const startTime = Date.now();

        const response = await t.action(api.guest.generateGuestExplanation, {
            content: "What is machine learning?",
            level: "college",
            sessionId: "timing-test-session",
        });

        const endTime = Date.now();
        const actualTime = endTime - startTime;
        const reportedTime = response.metadata.processingTime;

        console.log("Timing results:", {
            actualTime: `${actualTime}ms`,
            reportedTime: `${reportedTime}ms`,
            model: response.metadata.model,
            tokenCount: response.metadata.tokenCount
        });

        // Verify timing metadata is reasonable
        expect(response.metadata.processingTime).toBeGreaterThan(0);
        expect(response.metadata.processingTime).toBeLessThan(30000); // Should be under 30 seconds

        // Verify other metadata
        expect(response.metadata.model).toBe('claude-3-5-sonnet-20241022');
        expect(response.metadata.tokenCount).toBeGreaterThan(0);

        console.log("✅ Response timing is within expected bounds");
    });

    test("verify error handling doesn't break the workflow", async () => {
        const t = convexTest(schema);

        console.log("=== TESTING ERROR HANDLING ===");

        // Test empty content (should throw)
        try {
            await t.action(api.guest.generateGuestExplanation, {
                content: "",
                level: "elementary",
                sessionId: "error-test-session",
            });

            // If we get here, the test should fail
            expect(true).toBe(false); // Force failure
        } catch (error) {
            console.log("✅ Empty content correctly rejected:", error instanceof Error ? error.message : error);
            expect(error instanceof Error ? error.message : '').toContain('Content cannot be empty');
        }

        // Test overly long content (should throw)
        try {
            const longContent = "a".repeat(5001);
            await t.action(api.guest.generateGuestExplanation, {
                content: longContent,
                level: "elementary",
                sessionId: "error-test-session",
            });

            // If we get here, the test should fail
            expect(true).toBe(false); // Force failure
        } catch (error) {
            console.log("✅ Long content correctly rejected:", error instanceof Error ? error.message : error);
            expect(error instanceof Error ? error.message : '').toContain('Content too long');
        }

        console.log("✅ Error handling works as expected");
    });
}) 
import { convexTest } from "convex-test";
import { expect, test, describe, vi, beforeEach, afterEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// Mock the Anthropic client response
const mockAnthropicResponse = {
    content: [
        {
            type: 'text',
            text: 'This is a mock explanation for testing purposes. It demonstrates how the content would be returned from Claude AI.'
        }
    ],
    usage: {
        input_tokens: 10,
        output_tokens: 20
    },
    model: 'claude-3-5-sonnet-20241022'
};

// Define a global process for edge-runtime environment if it doesn't exist
// @ts-ignore
if (typeof process === 'undefined') {
    // @ts-ignore
    globalThis.process = {
        env: {}
    };
}

// Store original environment variable
const originalApiKey = process?.env?.ANTHROPIC_API_KEY;

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

describe("Guest Actions - Response Structure Tests", () => {
    beforeEach(() => {
        // Set a mock API key for tests
        if (process?.env) {
            process.env.ANTHROPIC_API_KEY = "sk-test-key-for-mocking";
        }
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original environment
        if (process?.env) {
            process.env.ANTHROPIC_API_KEY = originalApiKey;
        }
    });

    test("generateGuestExplanation returns expected response structure", async () => {
        const t = convexTest(schema);

        const response = await t.action(api.guest.generateGuestExplanation, {
            content: "How do computers work?",
            level: "elementary",
            sessionId: "test-session-123"
        });

        console.log("Response structure:", response);

        // Test the exact structure that frontend expects
        expect(response).toHaveProperty('id');
        expect(response).toHaveProperty('content');
        expect(response).toHaveProperty('level');
        expect(response).toHaveProperty('metadata');

        // Validate types
        expect(typeof response.id).toBe('string');
        expect(typeof response.content).toBe('string');
        expect(response.level).toBe('elementary');
        expect(typeof response.metadata).toBe('object');

        // Validate metadata structure
        expect(response.metadata).toHaveProperty('processingTime');
        expect(response.metadata).toHaveProperty('model');
        expect(response.metadata).toHaveProperty('tokenCount');
        expect(typeof response.metadata.processingTime).toBe('number');
        expect(typeof response.metadata.model).toBe('string');
        expect(typeof response.metadata.tokenCount).toBe('number');

        // Validate content is not empty
        expect(response.content.length).toBeGreaterThan(0);

        // Validate ID format (should be unique)
        expect(response.id).toMatch(/^response-\d+-[a-z0-9]+$/);
    });

    test("regenerateAtLevel returns expected response structure", async () => {
        const t = convexTest(schema);

        const response = await t.action(api.guest.regenerateAtLevel, {
            originalContent: "Explain quantum physics",
            newLevel: "college",
            sessionId: "test-session-456"
        });

        console.log("Regeneration response structure:", response);

        // Test the exact structure that frontend expects
        expect(response).toHaveProperty('id');
        expect(response).toHaveProperty('content');
        expect(response).toHaveProperty('level');
        expect(response).toHaveProperty('metadata');

        // Validate types
        expect(typeof response.id).toBe('string');
        expect(typeof response.content).toBe('string');
        expect(response.level).toBe('college');
        expect(typeof response.metadata).toBe('object');

        // Validate metadata structure for regeneration
        expect(response.metadata).toHaveProperty('processingTime');
        expect(response.metadata).toHaveProperty('model');
        expect(response.metadata).toHaveProperty('tokenCount');
        expect(response.metadata).toHaveProperty('regeneratedFrom');
        expect(response.metadata.regeneratedFrom).toBe('college');

        // Validate ID format for regeneration
        expect(response.id).toMatch(/^regenerated-\d+-[a-z0-9]+$/);
    });

    test("all education levels are supported", async () => {
        const t = convexTest(schema);
        const levels = ["preschool", "elementary", "middle", "high", "college", "phd"] as const;

        for (const level of levels) {
            const response = await t.action(api.guest.generateGuestExplanation, {
                content: "Test content",
                level,
                sessionId: `test-session-${level}`
            });

            expect(response.level).toBe(level);
            expect(response.content).toBeTruthy();
            console.log(`✓ Level ${level} works correctly`);
        }
    });
});

describe("Guest Actions - Error Handling Tests", () => {
    beforeEach(() => {
        if (process?.env) {
            process.env.ANTHROPIC_API_KEY = "sk-test-key-for-mocking";
        }
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (process?.env) {
            process.env.ANTHROPIC_API_KEY = originalApiKey;
        }
    });

    test("generateGuestExplanation handles empty content", async () => {
        const t = convexTest(schema);

        await expect(
            t.action(api.guest.generateGuestExplanation, {
                content: "",
                level: "elementary",
                sessionId: "test-session"
            })
        ).rejects.toThrow("Content cannot be empty");

        await expect(
            t.action(api.guest.generateGuestExplanation, {
                content: "   ",
                level: "elementary",
                sessionId: "test-session"
            })
        ).rejects.toThrow("Content cannot be empty");
    });

    test("generateGuestExplanation handles content too long", async () => {
        const t = convexTest(schema);
        const longContent = "a".repeat(5001);

        await expect(
            t.action(api.guest.generateGuestExplanation, {
                content: longContent,
                level: "elementary",
                sessionId: "test-session"
            })
        ).rejects.toThrow("Content too long. Please limit to 5000 characters.");
    });

    test("generateGuestExplanation handles API errors gracefully", async () => {
        const t = convexTest(schema);

        // Mock API failure
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('Network error');
        }));

        await expect(
            t.action(api.guest.generateGuestExplanation, {
                content: "Test content",
                level: "elementary",
                sessionId: "test-session"
            })
        ).rejects.toThrow("Failed to generate explanation:");
    });

    test("regenerateAtLevel handles API errors gracefully", async () => {
        const t = convexTest(schema);

        // Mock API failure
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('API rate limit exceeded');
        }));

        await expect(
            t.action(api.guest.regenerateAtLevel, {
                originalContent: "Test content",
                newLevel: "college",
                sessionId: "test-session"
            })
        ).rejects.toThrow("Failed to regenerate explanation:");
    });

    test("specific error messages for rate limits", async () => {
        const t = convexTest(schema);

        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('rate_limit exceeded');
        }));

        await expect(
            t.action(api.guest.generateGuestExplanation, {
                content: "Test content",
                level: "elementary",
                sessionId: "test-session"
            })
        ).rejects.toThrow("AI service is currently busy. Please try again in a moment.");
    });

    test("specific error messages for authentication", async () => {
        const t = convexTest(schema);

        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('invalid_api_key');
        }));

        await expect(
            t.action(api.guest.generateGuestExplanation, {
                content: "Test content",
                level: "elementary",
                sessionId: "test-session"
            })
        ).rejects.toThrow("AI service configuration error. Please contact support.");
    });
});

describe("Guest Actions - Integration Debugging", () => {
    beforeEach(() => {
        if (process?.env) {
            process.env.ANTHROPIC_API_KEY = "sk-test-key-for-mocking";
        }
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (process?.env) {
            process.env.ANTHROPIC_API_KEY = originalApiKey;
        }
    });

    test("response timing and performance", async () => {
        const t = convexTest(schema);

        const startTime = Date.now();
        const response = await t.action(api.guest.generateGuestExplanation, {
            content: "Explain photosynthesis",
            level: "middle",
            sessionId: "perf-test-session"
        });
        const endTime = Date.now();

        console.log(`Action completed in ${endTime - startTime}ms`);
        console.log(`Metadata reports ${response.metadata.processingTime}ms`);

        // Response should contain processing time
        expect(response.metadata.processingTime).toBeGreaterThan(0);
        expect(response.metadata.processingTime).toBeLessThan(10000); // Should be under 10s
    });

    test("response content quality and format", async () => {
        const t = convexTest(schema);

        const response = await t.action(api.guest.generateGuestExplanation, {
            content: "What is gravity?",
            level: "elementary",
            sessionId: "quality-test-session"
        });

        // Content should be substantial
        expect(response.content.length).toBeGreaterThan(50);

        // Should not contain null or undefined values
        expect(response.content).not.toContain('null');
        expect(response.content).not.toContain('undefined');

        // Should be a string
        expect(typeof response.content).toBe('string');

        console.log("Content preview:", response.content.substring(0, 100));
    });

    test("sessionId is properly passed through", async () => {
        const t = convexTest(schema);

        const sessionId = "debug-session-12345";
        const response = await t.action(api.guest.generateGuestExplanation, {
            content: "Test session tracking",
            level: "high",
            sessionId
        });

        // Response should be generated successfully with the session ID
        expect(response).toBeTruthy();
        expect(response.id).toBeTruthy();

        console.log(`Session ${sessionId} processed successfully`);
    });

    test("concurrent requests handling", async () => {
        const t = convexTest(schema);

        // Send multiple requests concurrently
        const requests = Array.from({ length: 3 }, (_, i) =>
            t.action(api.guest.generateGuestExplanation, {
                content: `Test content ${i + 1}`,
                level: "elementary",
                sessionId: `concurrent-session-${i + 1}`
            })
        );

        const responses = await Promise.all(requests);

        // All should succeed
        expect(responses).toHaveLength(3);

        // All should have unique IDs
        const ids = responses.map(r => r.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(3);

        console.log("Concurrent request IDs:", ids);
    });

    test("response matches expected interface for frontend", async () => {
        const t = convexTest(schema);

        const response = await t.action(api.guest.generateGuestExplanation, {
            content: "Explain machine learning",
            level: "college",
            sessionId: "interface-test-session"
        });

        // This is the exact structure the frontend expects
        // Based on the guest-chat-interface.tsx file
        interface ExpectedResponse {
            id: string;
            content: string;
            level: string;
            metadata: {
                processingTime: number;
                model: string;
                tokenCount: number;
            };
        }

        // Type check - this should not throw
        const typedResponse: ExpectedResponse = response;

        expect(typedResponse.id).toBeTruthy();
        expect(typedResponse.content).toBeTruthy();
        expect(typedResponse.level).toBe('college');
        expect(typedResponse.metadata.processingTime).toBeGreaterThan(0);
        expect(typedResponse.metadata.model).toBe('claude-3-5-sonnet-20241022');
        expect(typedResponse.metadata.tokenCount).toBeGreaterThan(0);

        console.log("Response matches expected interface ✓");
    });
});

describe("Guest Actions - Health Check", () => {
    test("guestHealthCheck returns proper status", async () => {
        const t = convexTest(schema);

        const health = await t.action(api.guest.guestHealthCheck);

        expect(health).toHaveProperty('status');
        expect(health).toHaveProperty('timestamp');
        expect(health).toHaveProperty('features');
        expect(health).toHaveProperty('environment');

        expect(health.status).toBe('healthy');
        expect(typeof health.timestamp).toBe('number');

        // Check features
        expect(health.features.guestSessions).toBe(true);
        expect(health.features.aiGeneration).toBe(true);
        expect(health.features.levelSwitching).toBe(true);
        expect(health.features.claudeIntegration).toBe(true);

        console.log("Health check result:", health);
    });
}) 
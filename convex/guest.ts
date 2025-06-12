import { action } from './_generated/server';
import { v } from 'convex/values';
import Anthropic from '@anthropic-ai/sdk';
import { Effect, Context, Layer, Data, Logger } from 'effect';

// Error types for better error management
export class AnthropicConfigError extends Data.TaggedError("AnthropicConfigError")<{
    readonly message: string;
}> { }

export class AnthropicApiError extends Data.TaggedError("AnthropicApiError")<{
    readonly message: string;
    readonly statusCode?: number;
    readonly errorType?: string;
}> { }

export class ContentValidationError extends Data.TaggedError("ContentValidationError")<{
    readonly message: string;
}> { }

// Configuration service interface for requirements management
export interface ConfigService {
    readonly getAnthropicApiKey: Effect.Effect<string, AnthropicConfigError>;
}

export const ConfigService = Context.GenericTag<ConfigService>("ConfigService");

// Anthropic service interface
export interface AnthropicService {
    readonly generateCompletion: (
        prompt: string
    ) => Effect.Effect<string, AnthropicApiError | AnthropicConfigError>;
}

export const AnthropicService = Context.GenericTag<AnthropicService>("AnthropicService");

// Configuration service implementation
const ConfigServiceLive = Layer.succeed(
    ConfigService,
    ConfigService.of({
        getAnthropicApiKey: Effect.gen(function* () {
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) {
                yield* Effect.logError("ANTHROPIC_API_KEY environment variable not found");
                return yield* new AnthropicConfigError({
                    message: "ANTHROPIC_API_KEY environment variable not configured"
                });
            }
            yield* Effect.log(`API key configured with prefix: ${apiKey.substring(0, 10)}...`);
            return apiKey;
        })
    })
);

// Anthropic service implementation with resource management
const AnthropicServiceLive = Layer.effect(
    AnthropicService,
    Effect.gen(function* () {
        const config = yield* ConfigService;

        return AnthropicService.of({
            generateCompletion: (prompt) => Effect.gen(function* () {
                const apiKey = yield* config.getAnthropicApiKey;

                // Resource management: create and manage client
                yield* Effect.log("Creating Anthropic client");
                const anthropic = new Anthropic({ apiKey });

                const requestConfig = {
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 1000,
                    temperature: 0.7,
                    messages: [{ role: 'user' as const, content: prompt }]
                };

                yield* Effect.log(`Making API request - prompt length: ${prompt.length}`);

                const response = yield* Effect.tryPromise({
                    try: () => anthropic.messages.create(requestConfig),
                    catch: (error) => {
                        if (error instanceof Error) {
                            if (error.message.includes('rate_limit')) {
                                return new AnthropicApiError({
                                    message: 'Rate limit exceeded',
                                    errorType: 'rate_limit'
                                });
                            } else if (error.message.includes('invalid_api_key') || error.message.includes('authentication')) {
                                return new AnthropicApiError({
                                    message: 'Invalid API key or authentication failed',
                                    errorType: 'authentication'
                                });
                            } else if (error.message.includes('content_policy')) {
                                return new AnthropicApiError({
                                    message: 'Content violates policy restrictions',
                                    errorType: 'content_policy'
                                });
                            }
                        }

                        return new AnthropicApiError({
                            message: error instanceof Error ? error.message : 'Unknown API error'
                        });
                    }
                });

                yield* Effect.log(`API response received - content blocks: ${response.content.length}`);

                // Extract and validate text content
                const textContent = response.content
                    .filter((block: any) => block.type === 'text')
                    .map((block: any) => block.text)
                    .join('\n');

                if (!textContent.trim()) {
                    yield* Effect.logError("No text content in Claude response");
                    return yield* new AnthropicApiError({
                        message: "No text content found in Claude response"
                    });
                }

                yield* Effect.log(`Generated text content: ${textContent.length} characters`);
                return textContent;
            })
        });
    })
).pipe(Layer.provide(ConfigServiceLive));

// Main service layer
const MainLayer = AnthropicServiceLive;

// Level-specific prompts for Claude
function buildLevelPrompt(content: string, level: string): string {
    console.log(`Building prompt for level: ${level}, content length: ${content.length}`);

    const levelInstructions: Record<string, string> = {
        preschool: "Explain this like you're talking to a 3-5 year old child. Use very simple words, fun analogies, and maybe mention toys or familiar things. Keep it short and playful with emojis.",

        elementary: "Explain this for a child in elementary school (ages 6-10). Use simple language they can understand, relate it to things they might know from school or everyday life. Be encouraging and use some emojis.",

        middle: "Explain this for a middle school student (ages 11-13). Use clear language but you can introduce some more complex concepts. Break it down step by step and relate it to things they're learning in school.",

        high: "Explain this for a high school student (ages 14-18). You can use more sophisticated vocabulary and concepts. Provide good detail and examples that would help them understand for tests or essays.",

        college: "Explain this at a college/university level. Use academic language and terminology. Provide comprehensive analysis and connect to broader theoretical frameworks. Include nuanced details and implications.",

        phd: "Explain this at an expert/graduate level. Use sophisticated academic language, discuss methodology, theoretical implications, and connections to current research. Assume deep subject knowledge."
    };

    const basePrompt = levelInstructions[level] || levelInstructions.elementary;

    const fullPrompt = `${basePrompt}

Content to explain: "${content}"

Please provide a clear, engaging explanation at the requested level. Make sure your response is appropriate for the target audience and educational level.`;

    console.log(`Generated prompt: ${fullPrompt.substring(0, 200)}...`);
    return fullPrompt;
}

// Generate explanation using Effect-based Claude AI service
const generateClaudeExplanation = (content: string, level: string) =>
    Effect.gen(function* () {
        yield* Effect.log(`Starting Claude explanation generation for level: ${level}`);

        // Input validation with observability
        if (!content.trim()) {
            yield* Effect.logError("Content validation failed: empty content");
            return yield* new ContentValidationError({ message: "Content cannot be empty" });
        }

        if (content.length > 5000) {
            yield* Effect.logError(`Content validation failed: too long (${content.length} chars)`);
            return yield* new ContentValidationError({
                message: `Content too long: ${content.length} characters (max 5000)`
            });
        }

        yield* Effect.log("Content validation passed");

        const anthropicService = yield* AnthropicService;
        const prompt = buildLevelPrompt(content, level);

        yield* Effect.log(`Generated prompt for level ${level}: ${prompt.length} characters`);

        const explanation = yield* anthropicService.generateCompletion(prompt);

        yield* Effect.log(`Successfully generated explanation: ${explanation.length} characters`);
        return explanation;
    }).pipe(Effect.provide(MainLayer));

export const generateGuestExplanation = action({
    args: {
        content: v.string(),
        level: v.union(
            v.literal("preschool"),
            v.literal("elementary"),
            v.literal("middle"),
            v.literal("high"),
            v.literal("college"),
            v.literal("phd")
        ),
        sessionId: v.string(),
    },
    handler: async (ctx, { content, level, sessionId }) => {
        console.log('=== generateGuestExplanation called ===');
        console.log('Input params:', {
            content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            level,
            sessionId,
            contentLength: content.length
        });

        try {
            const startTime = Date.now();
            console.log('Starting explanation generation with Effect...');

            // Run the Effect and handle the result
            const result = await Effect.runPromise(generateClaudeExplanation(content, level));

            const processingTime = Date.now() - startTime;
            console.log(`Explanation generated successfully in ${processingTime}ms`);

            const response = {
                id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: result,
                level,
                metadata: {
                    processingTime,
                    model: "claude-3-5-sonnet-20241022",
                    tokenCount: Math.floor(result.length / 4), // Rough estimate
                }
            };

            console.log('Returning result:', {
                id: response.id,
                contentLength: response.content.length,
                level: response.level,
                metadata: response.metadata
            });

            return response;
        } catch (error) {
            console.error('=== Error in generateGuestExplanation ===');
            console.error('Error details:', error);

            // Handle Effect errors with better error messages
            if (error instanceof AnthropicConfigError) {
                throw new Error('AI service configuration error. Please contact support.');
            } else if (error instanceof AnthropicApiError) {
                if (error.errorType === 'rate_limit') {
                    throw new Error('AI service is currently busy. Please try again in a moment.');
                } else if (error.errorType === 'authentication') {
                    throw new Error('AI service configuration error. Please contact support.');
                } else if (error.errorType === 'content_policy') {
                    throw new Error('This content cannot be processed due to content policy restrictions.');
                }
                throw new Error(`AI service error: ${error.message}`);
            } else if (error instanceof ContentValidationError) {
                throw new Error(error.message);
            }

            throw new Error(`Failed to generate explanation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});

export const regenerateAtLevel = action({
    args: {
        originalContent: v.string(),
        newLevel: v.union(
            v.literal("preschool"),
            v.literal("elementary"),
            v.literal("middle"),
            v.literal("high"),
            v.literal("college"),
            v.literal("phd")
        ),
        sessionId: v.string(),
    },
    handler: async (ctx, { originalContent, newLevel, sessionId }) => {
        console.log('=== regenerateAtLevel called ===');
        console.log('Input params:', {
            originalContent: originalContent.substring(0, 100) + (originalContent.length > 100 ? '...' : ''),
            newLevel,
            sessionId,
            contentLength: originalContent.length
        });

        try {
            const startTime = Date.now();
            console.log('Starting regeneration with Effect...');

            // Run the Effect for regeneration
            const result = await Effect.runPromise(generateClaudeExplanation(originalContent, newLevel));

            const processingTime = Date.now() - startTime;
            console.log(`Regeneration completed successfully in ${processingTime}ms`);

            const response = {
                id: `regenerated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: result,
                level: newLevel,
                metadata: {
                    processingTime,
                    model: "claude-3-5-sonnet-20241022",
                    tokenCount: Math.floor(result.length / 4),
                    regeneratedFrom: newLevel,
                }
            };

            console.log('Returning regeneration result:', {
                id: response.id,
                contentLength: response.content.length,
                level: response.level,
                metadata: response.metadata
            });

            return response;
        } catch (error) {
            console.error('=== Error in regenerateAtLevel ===');
            console.error('Error details:', error);

            // Handle Effect errors with better error messages
            if (error instanceof AnthropicConfigError) {
                throw new Error('AI service configuration error. Please contact support.');
            } else if (error instanceof AnthropicApiError) {
                if (error.errorType === 'rate_limit') {
                    throw new Error('AI service is currently busy. Please try again in a moment.');
                } else if (error.errorType === 'authentication') {
                    throw new Error('AI service configuration error. Please contact support.');
                } else if (error.errorType === 'content_policy') {
                    throw new Error('This content cannot be processed due to content policy restrictions.');
                }
                throw new Error(`AI service error: ${error.message}`);
            } else if (error instanceof ContentValidationError) {
                throw new Error(error.message);
            }

            throw new Error(`Failed to regenerate explanation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});

// Health check for guest mode functionality
export const guestHealthCheck = action({
    args: {},
    handler: async () => {
        console.log('=== guestHealthCheck called ===');

        const healthStatus = {
            status: 'healthy',
            timestamp: Date.now(),
            features: {
                guestSessions: true,
                aiGeneration: true,
                levelSwitching: true,
                claudeIntegration: true,
                effectIntegration: true,
            },
            environment: {
                apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
                apiKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...'
            }
        };

        console.log('Health check result:', healthStatus);
        return healthStatus;
    },
}); 
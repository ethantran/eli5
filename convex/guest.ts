import { action } from './_generated/server';
import { v } from 'convex/values';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client with environment variable
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

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

// Generate explanation using Claude AI
async function generateClaudeExplanation(content: string, level: string): Promise<string> {
    console.log(`Starting Claude API call for level: ${level}`);
    console.log(`API Key available: ${!!process.env.ANTHROPIC_API_KEY}`);
    console.log(`API Key prefix: ${process.env.ANTHROPIC_API_KEY?.substring(0, 10)}...`);

    try {
        const prompt = buildLevelPrompt(content, level);

        console.log('Calling Claude API with config:', {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            temperature: 0.7,
            promptLength: prompt.length
        });

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        console.log('Claude API response received:', {
            contentBlocks: response.content.length,
            usage: response.usage,
            model: response.model
        });

        // Extract text content from the response
        const textContent = response.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('\n');

        console.log(`Extracted text content length: ${textContent.length}`);
        console.log(`Text content preview: ${textContent.substring(0, 100)}...`);

        if (!textContent) {
            console.error('No text content in Claude response');
            throw new Error('No text content in Claude response');
        }

        return textContent;
    } catch (error) {
        console.error('Claude API error details:', {
            error: error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            type: typeof error
        });
        throw error;
    }
}

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

        // Validate input
        if (!content.trim()) {
            console.error('Content validation failed: empty content');
            throw new Error("Content cannot be empty");
        }

        if (content.length > 5000) {
            console.error(`Content validation failed: too long (${content.length} chars)`);
            throw new Error("Content too long. Please limit to 5000 characters.");
        }

        console.log('Input validation passed');

        try {
            const startTime = Date.now();
            console.log('Starting explanation generation...');

            // Generate explanation using Claude AI
            const explanation = await generateClaudeExplanation(content, level);

            const processingTime = Date.now() - startTime;
            console.log(`Explanation generated successfully in ${processingTime}ms`);

            const result = {
                id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: explanation,
                level,
                metadata: {
                    processingTime,
                    model: "claude-3-5-sonnet-20241022",
                    tokenCount: Math.floor(explanation.length / 4), // Rough estimate
                }
            };

            console.log('Returning result:', {
                id: result.id,
                contentLength: result.content.length,
                level: result.level,
                metadata: result.metadata
            });

            return result;
        } catch (error) {
            console.error('=== Error in generateGuestExplanation ===');
            console.error('Error details:', {
                error: error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                type: typeof error,
                name: error instanceof Error ? error.name : undefined
            });

            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('rate_limit')) {
                    console.error('Rate limit error detected');
                    throw new Error('AI service is currently busy. Please try again in a moment.');
                } else if (error.message.includes('invalid_api_key') || error.message.includes('authentication')) {
                    console.error('Authentication error detected');
                    throw new Error('AI service configuration error. Please contact support.');
                } else if (error.message.includes('content_policy')) {
                    console.error('Content policy error detected');
                    throw new Error('This content cannot be processed due to content policy restrictions.');
                }
            }

            console.error('Throwing generic error');
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
            console.log('Starting regeneration...');

            // Generate explanation at new level using Claude AI
            const explanation = await generateClaudeExplanation(originalContent, newLevel);

            const processingTime = Date.now() - startTime;
            console.log(`Regeneration completed successfully in ${processingTime}ms`);

            const result = {
                id: `regenerated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: explanation,
                level: newLevel,
                metadata: {
                    processingTime,
                    model: "claude-3-5-sonnet-20241022",
                    tokenCount: Math.floor(explanation.length / 4),
                    regeneratedFrom: newLevel,
                }
            };

            console.log('Returning regeneration result:', {
                id: result.id,
                contentLength: result.content.length,
                level: result.level,
                metadata: result.metadata
            });

            return result;
        } catch (error) {
            console.error('=== Error in regenerateAtLevel ===');
            console.error('Error details:', {
                error: error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                type: typeof error
            });

            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('rate_limit')) {
                    console.error('Rate limit error detected in regeneration');
                    throw new Error('AI service is currently busy. Please try again in a moment.');
                } else if (error.message.includes('invalid_api_key') || error.message.includes('authentication')) {
                    console.error('Authentication error detected in regeneration');
                    throw new Error('AI service configuration error. Please contact support.');
                } else if (error.message.includes('content_policy')) {
                    console.error('Content policy error detected in regeneration');
                    throw new Error('This content cannot be processed due to content policy restrictions.');
                }
            }

            console.error('Throwing generic regeneration error');
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
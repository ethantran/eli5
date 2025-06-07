import { action } from './_generated/server';
import { v } from 'convex/values';

// Mock AI response generation for now (will integrate with Claude later)
function generateMockExplanation(content: string, level: string): string {
    const explanations: Record<string, string> = {
        preschool: `🧸 Let me explain this like you're very little! ${content} is like when you play with toys. It's something really simple and fun that even tiny kids can understand!`,

        elementary: `📚 Okay, here's how I'd explain this to someone in elementary school: ${content} is like something you might learn about in your favorite class. Think of it as a puzzle piece that helps you understand the bigger picture!`,

        middle: `🎯 Here's a middle school level explanation: ${content} involves several key concepts that work together. It's more complex than basic ideas, but not too hard to understand when you break it down step by step.`,

        high: `🎓 At a high school level: ${content} represents a sophisticated concept that requires understanding multiple components and their relationships. This involves analytical thinking and application of learned principles.`,

        college: `🎯 From a college perspective: ${content} is a multifaceted subject that requires comprehensive analysis, critical thinking, and understanding of theoretical frameworks. It involves nuanced interpretation and practical application.`,

        phd: `🔬 At an expert/PhD level: ${content} represents a complex theoretical construct requiring deep understanding of underlying mechanisms, methodological considerations, and implications for broader theoretical frameworks within the field.`
    };

    return explanations[level] || explanations.elementary;
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
        // Validate input
        if (!content.trim()) {
            throw new Error("Content cannot be empty");
        }

        if (content.length > 5000) {
            throw new Error("Content too long. Please limit to 5000 characters.");
        }

        try {
            // For now, generate mock response
            // TODO: Integrate with Claude API
            const explanation = generateMockExplanation(content, level);

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

            return {
                id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: explanation,
                level,
                metadata: {
                    processingTime: Math.floor(1000 + Math.random() * 2000),
                    model: "mock-model-v1",
                    tokenCount: Math.floor(explanation.length / 4), // Rough estimate
                }
            };
        } catch (error) {
            console.error('Error generating explanation:', error);
            throw new Error('Failed to generate explanation. Please try again.');
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
        try {
            // For now, generate mock response at new level
            // TODO: Integrate with Claude API and include context about level change
            const explanation = generateMockExplanation(originalContent, newLevel);

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

            return {
                id: `regenerated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: explanation,
                level: newLevel,
                metadata: {
                    processingTime: Math.floor(800 + Math.random() * 1200),
                    model: "mock-model-v1",
                    tokenCount: Math.floor(explanation.length / 4),
                    regeneratedFrom: newLevel,
                }
            };
        } catch (error) {
            console.error('Error regenerating explanation:', error);
            throw new Error('Failed to regenerate explanation. Please try again.');
        }
    },
});

// Health check for guest mode functionality
export const guestHealthCheck = action({
    args: {},
    handler: async () => {
        return {
            status: 'healthy',
            timestamp: Date.now(),
            features: {
                guestSessions: true,
                aiGeneration: true,
                levelSwitching: true,
            }
        };
    },
}); 
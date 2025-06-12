import { useMachine } from '@xstate/react';
import { createMachine, assign, fromPromise } from 'xstate';
import type { GuestSession, Message, EducationLevel } from '../types';
import {
    getOrCreateGuestSession,
    addMessageToGuestSession,
    updateMessageInGuestSession,
    updateGuestSessionLevel,
    clearGuestSession,
    migrateGuestSession,
} from '../guest-session';
import { generateGuestExplanation, regenerateGuestAtLevel } from '../services/guest-convex-service';

// Define the machine context
interface GuestSessionContext {
    session: GuestSession | null;
    error: string | null;
    lastAddedMessage: Message | null;
    isGenerating: boolean;
    pendingMessageId: string | null;
    pendingUserMessage: string | null;
}

// Define the machine events
type GuestSessionEvent =
    | { type: 'INITIALIZE' }
    | { type: 'CLEAR' }
    | { type: 'ADD_MESSAGE'; message: Omit<Message, 'id' | 'createdAt'> }
    | { type: 'UPDATE_MESSAGE'; messageId: string; updates: Partial<Message> }
    | { type: 'UPDATE_LEVEL'; level: EducationLevel }
    | { type: 'SET_ERROR'; error: string }
    | { type: 'CLEAR_ERROR' }
    | { type: 'SEND_MESSAGE'; content: string }
    | { type: 'REGENERATE_MESSAGE'; messageId: string; newLevel: EducationLevel };

// Create the guest session machine
const guestSessionMachine = createMachine({
    id: 'guestSession',
    initial: 'initializing',
    context: {
        session: null,
        error: null,
        lastAddedMessage: null,
        isGenerating: false,
        pendingMessageId: null,
        pendingUserMessage: null,
    } as GuestSessionContext,
    states: {
        initializing: {
            invoke: {
                src: 'initializeSession',
                onDone: {
                    target: 'ready',
                    actions: assign({
                        session: ({ event }) => event.output,
                        error: () => null,
                    }),
                },
                onError: {
                    target: 'error',
                    actions: assign({
                        error: ({ event }) => (event.error as Error)?.message || 'Failed to initialize session',
                    }),
                },
            },
        },
        ready: {
            on: {
                ADD_MESSAGE: {
                    actions: assign(({ context, event }) => {
                        if (!context.session) {
                            return {
                                session: context.session,
                                lastAddedMessage: null,
                                error: context.error,
                                isGenerating: context.isGenerating,
                                pendingMessageId: context.pendingMessageId,
                                pendingUserMessage: context.pendingUserMessage,
                            };
                        }

                        try {
                            // Call addMessageToGuestSession only once
                            const result = addMessageToGuestSession(context.session, event.message);

                            return {
                                session: result.session,
                                lastAddedMessage: result.message,
                                error: null,
                                isGenerating: context.isGenerating,
                                pendingMessageId: context.pendingMessageId,
                                pendingUserMessage: context.pendingUserMessage,
                            };
                        } catch (error) {
                            console.error('Failed to add message:', error);
                            return {
                                session: context.session,
                                lastAddedMessage: null,
                                error: context.error,
                                isGenerating: context.isGenerating,
                                pendingMessageId: context.pendingMessageId,
                                pendingUserMessage: context.pendingUserMessage,
                            };
                        }
                    }),
                },
                UPDATE_MESSAGE: {
                    actions: assign({
                        session: ({ context, event }) => {
                            if (!context.session) return context.session;

                            try {
                                return updateMessageInGuestSession(
                                    context.session,
                                    event.messageId,
                                    event.updates
                                );
                            } catch (error) {
                                console.error('Failed to update message:', error);
                                return context.session;
                            }
                        },
                        error: () => null,
                    }),
                },
                UPDATE_LEVEL: {
                    actions: assign({
                        session: ({ context, event }) => {
                            if (!context.session) return context.session;

                            try {
                                return updateGuestSessionLevel(context.session, event.level);
                            } catch (error) {
                                console.error('Failed to update level:', error);
                                return context.session;
                            }
                        },
                        error: () => null,
                    }),
                },
                SEND_MESSAGE: {
                    target: 'generating',
                    actions: assign({
                        pendingUserMessage: ({ event }) => event.content,
                        isGenerating: () => true,
                        error: () => null,
                    }),
                },
                REGENERATE_MESSAGE: {
                    target: 'regenerating',
                    actions: assign({
                        pendingMessageId: ({ event }) => event.messageId,
                        isGenerating: () => true,
                        error: () => null,
                    }),
                },
                CLEAR: {
                    actions: [
                        () => {
                            try {
                                clearGuestSession();
                            } catch (error) {
                                console.error('Failed to clear session:', error);
                            }
                        },
                        assign({
                            session: () => null,
                            error: () => null,
                            lastAddedMessage: () => null,
                            isGenerating: () => false,
                            pendingMessageId: () => null,
                            pendingUserMessage: () => null,
                        }),
                    ],
                },
                SET_ERROR: {
                    actions: assign({
                        error: ({ event }) => event.error,
                    }),
                },
                CLEAR_ERROR: {
                    actions: assign({
                        error: () => null,
                    }),
                },
            },
        },
        generating: {
            invoke: {
                src: 'generateExplanation',
                input: ({ context }) => ({
                    content: context.pendingUserMessage!,
                    level: context.session!.currentLevel,
                    sessionId: context.session!.sessionId,
                }),
                onDone: {
                    target: 'ready',
                    actions: [
                        assign(({ context, event }) => {
                            // Update the pending message with the response
                            if (context.session && context.pendingMessageId) {
                                try {
                                    const updatedSession = updateMessageInGuestSession(
                                        context.session,
                                        context.pendingMessageId,
                                        {
                                            content: event.output.content,
                                            status: 'complete' as const,
                                            metadata: event.output.metadata,
                                        }
                                    );
                                    return {
                                        ...context,
                                        session: updatedSession,
                                        isGenerating: false,
                                        pendingUserMessage: null,
                                        pendingMessageId: null,
                                        error: null,
                                    };
                                } catch (error) {
                                    console.error('Failed to update message with response:', error);
                                    return {
                                        ...context,
                                        isGenerating: false,
                                        pendingUserMessage: null,
                                        error: 'Failed to update message with response',
                                    };
                                }
                            }
                            return {
                                ...context,
                                isGenerating: false,
                                pendingUserMessage: null,
                                error: null,
                            };
                        }),
                    ],
                },
                onError: {
                    target: 'ready',
                    actions: assign(({ context, event }) => {
                        // Update the pending message with error state
                        if (context.session && context.pendingMessageId) {
                            try {
                                const updatedSession = updateMessageInGuestSession(
                                    context.session,
                                    context.pendingMessageId,
                                    {
                                        content: 'Sorry, I encountered an error while generating your explanation. Please try again.',
                                        status: 'error' as const,
                                        errorMessage: (event.error as Error)?.message || 'Unknown error',
                                    }
                                );
                                return {
                                    ...context,
                                    session: updatedSession,
                                    isGenerating: false,
                                    pendingUserMessage: null,
                                    pendingMessageId: null,
                                    error: (event.error as Error)?.message || 'Failed to generate explanation',
                                };
                            } catch (updateError) {
                                console.error('Failed to update message with error:', updateError);
                                return {
                                    ...context,
                                    isGenerating: false,
                                    pendingUserMessage: null,
                                    error: 'Failed to generate explanation',
                                };
                            }
                        }
                        return {
                            ...context,
                            isGenerating: false,
                            pendingUserMessage: null,
                            error: (event.error as Error)?.message || 'Failed to generate explanation',
                        };
                    }),
                },
            },
            entry: [
                // Add user message and pending AI message
                assign(({ context }) => {
                    if (!context.session || !context.pendingUserMessage) {
                        return context;
                    }

                    try {
                        // Add user message first
                        const userMessage = {
                            content: context.pendingUserMessage,
                            role: 'user' as const,
                            status: 'complete' as const,
                        };
                        const userResult = addMessageToGuestSession(context.session, userMessage);

                        // Add pending AI message
                        const pendingMessage = {
                            content: '',
                            role: 'assistant' as const,
                            level: context.session.currentLevel,
                            status: 'pending' as const,
                        };
                        const aiResult = addMessageToGuestSession(userResult.session, pendingMessage);

                        return {
                            ...context,
                            session: aiResult.session,
                            pendingMessageId: aiResult.message.id,
                        };
                    } catch (error) {
                        console.error('Failed to add messages:', error);
                        return {
                            ...context,
                            error: 'Failed to add messages',
                        };
                    }
                }),
            ],
        },
        regenerating: {
            invoke: {
                src: 'regenerateAtLevel',
                input: ({ context, event }) => {
                    // Find the original user message
                    if (!context.session || !context.pendingMessageId) {
                        throw new Error('Invalid state for regeneration');
                    }

                    const messageIndex = context.session.messages.findIndex(m => m.id === context.pendingMessageId);
                    const userMessage = context.session.messages
                        .slice(0, messageIndex)
                        .reverse()
                        .find(m => m.role === 'user');

                    if (!userMessage) {
                        throw new Error('No user message found for regeneration');
                    }

                    return {
                        originalContent: userMessage.content,
                        newLevel: (event as any).newLevel,
                        sessionId: context.session.sessionId,
                    };
                },
                onDone: {
                    target: 'ready',
                    actions: assign(({ context, event }) => {
                        // Update the message with the new response
                        if (context.session && context.pendingMessageId) {
                            try {
                                const updatedSession = updateMessageInGuestSession(
                                    context.session,
                                    context.pendingMessageId,
                                    {
                                        content: event.output.content,
                                        level: event.output.level,
                                        status: 'complete' as const,
                                        metadata: event.output.metadata,
                                    }
                                );
                                return {
                                    ...context,
                                    session: updatedSession,
                                    isGenerating: false,
                                    pendingMessageId: null,
                                    error: null,
                                };
                            } catch (error) {
                                console.error('Failed to update message with regenerated response:', error);
                                return {
                                    ...context,
                                    isGenerating: false,
                                    pendingMessageId: null,
                                    error: 'Failed to update message with regenerated response',
                                };
                            }
                        }
                        return {
                            ...context,
                            isGenerating: false,
                            pendingMessageId: null,
                            error: null,
                        };
                    }),
                },
                onError: {
                    target: 'ready',
                    actions: assign(({ context, event }) => {
                        // Update the message with error state
                        if (context.session && context.pendingMessageId) {
                            try {
                                const updatedSession = updateMessageInGuestSession(
                                    context.session,
                                    context.pendingMessageId,
                                    {
                                        status: 'error' as const,
                                        errorMessage: (event.error as Error)?.message || 'Failed to regenerate explanation',
                                    }
                                );
                                return {
                                    ...context,
                                    session: updatedSession,
                                    isGenerating: false,
                                    pendingMessageId: null,
                                    error: (event.error as Error)?.message || 'Failed to regenerate explanation',
                                };
                            } catch (updateError) {
                                console.error('Failed to update message with error:', updateError);
                                return {
                                    ...context,
                                    isGenerating: false,
                                    pendingMessageId: null,
                                    error: 'Failed to regenerate explanation',
                                };
                            }
                        }
                        return {
                            ...context,
                            isGenerating: false,
                            pendingMessageId: null,
                            error: (event.error as Error)?.message || 'Failed to regenerate explanation',
                        };
                    }),
                },
            },
            entry: [
                // Update current message to pending and set new level
                assign(({ context, event }) => {
                    if (!context.session || !context.pendingMessageId) {
                        return context;
                    }

                    try {
                        const newLevel = (event as any).newLevel;

                        // Update level first
                        const sessionWithNewLevel = updateGuestSessionLevel(context.session, newLevel);

                        // Then update message to pending
                        const updatedSession = updateMessageInGuestSession(
                            sessionWithNewLevel,
                            context.pendingMessageId,
                            {
                                status: 'pending' as const,
                                level: newLevel,
                            }
                        );

                        return {
                            ...context,
                            session: updatedSession,
                        };
                    } catch (error) {
                        console.error('Failed to update message to pending state:', error);
                        return {
                            ...context,
                            error: 'Failed to update message to pending state',
                        };
                    }
                }),
            ],
        },
        error: {
            on: {
                INITIALIZE: 'initializing',
                CLEAR_ERROR: {
                    target: 'ready',
                    actions: assign({
                        error: () => null,
                    }),
                },
            },
        },
    },
}, {
    actors: {
        initializeSession: fromPromise(async () => {
            try {
                return getOrCreateGuestSession();
            } catch (error) {
                throw new Error(error instanceof Error ? error.message : 'Failed to initialize session');
            }
        }),
        generateExplanation: fromPromise(async ({ input }: { input: { content: string; level: EducationLevel; sessionId: string } }) => {
            return generateGuestExplanation(input);
        }),
        regenerateAtLevel: fromPromise(async ({ input }: { input: { originalContent: string; newLevel: EducationLevel; sessionId: string } }) => {
            return regenerateGuestAtLevel(input);
        }),
    },
});

// Hook interface
interface useGuestSessionReturn {
    session: GuestSession | null;
    isLoading: boolean;
    isGenerating: boolean;
    error: string | null;

    // Session management
    initializeSession: () => void;
    clearSession: () => void;
    migrateSession: () => ReturnType<typeof migrateGuestSession>;

    // Message management - simplified for components
    sendMessage: (content: string) => void;
    regenerateMessage: (messageId: string, newLevel: EducationLevel) => void;
    addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => Message | null;
    updateMessage: (messageId: string, updates: Partial<Message>) => void;

    // Level management
    updateLevel: (level: EducationLevel) => void;

    // Helper functions
    isGuest: boolean;
    messageCount: number;
    canConvert: boolean;
}

export function useGuestSession(): useGuestSessionReturn {
    const [state, send] = useMachine(guestSessionMachine);

    const { session, error, lastAddedMessage, isGenerating } = state.context;
    const isLoading = state.matches('initializing');

    // Session management functions
    const initializeSession = () => send({ type: 'INITIALIZE' });

    const clearSession = () => send({ type: 'CLEAR' });

    const migrateSession = () => {
        try {
            const migrationData = migrateGuestSession();
            send({ type: 'CLEAR' });
            return migrationData;
        } catch (error) {
            console.error('Failed to migrate session:', error);
            send({ type: 'SET_ERROR', error: 'Failed to migrate session' });
            return null;
        }
    };

    // New simplified message management for components
    const sendMessage = (content: string) => {
        if (!session || isGenerating) return;
        send({ type: 'SEND_MESSAGE', content });
    };

    const regenerateMessage = (messageId: string, newLevel: EducationLevel) => {
        if (!session || isGenerating) return;
        send({ type: 'REGENERATE_MESSAGE', messageId, newLevel });
    };

    // Legacy message management functions (for direct manipulation)
    const addMessage = (message: Omit<Message, 'id' | 'createdAt'>): Message | null => {
        if (!session) {
            console.error('No active session to add message to');
            return null;
        }

        try {
            send({ type: 'ADD_MESSAGE', message });
            return state.context.lastAddedMessage;
        } catch (error) {
            console.error('Failed to add message:', error);
            send({ type: 'SET_ERROR', error: 'Failed to add message' });
            return null;
        }
    };

    const updateMessage = (messageId: string, updates: Partial<Message>) => {
        if (!session) {
            console.error('No active session to update message in');
            return;
        }

        send({ type: 'UPDATE_MESSAGE', messageId, updates });
    };

    // Level management functions
    const updateLevel = (level: EducationLevel) => {
        if (!session) {
            console.error('No active session to update level in');
            return;
        }

        send({ type: 'UPDATE_LEVEL', level });
    };

    // Computed values
    const isGuest = session !== null;
    const messageCount = session?.messageCount || 0;
    const canConvert = messageCount >= 3; // Suggest conversion after 3+ messages

    return {
        session,
        isLoading,
        isGenerating,
        error,

        // Session management
        initializeSession,
        clearSession,
        migrateSession,

        // Simplified message management for components
        sendMessage,
        regenerateMessage,

        // Legacy message management (for edge cases)
        addMessage,
        updateMessage,

        // Level management
        updateLevel,

        // Helper values
        isGuest,
        messageCount,
        canConvert,
    };
} 
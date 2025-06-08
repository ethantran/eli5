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

// Define the machine context
interface GuestSessionContext {
    session: GuestSession | null;
    error: string | null;
    lastAddedMessage: Message | null;
}

// Define the machine events
type GuestSessionEvent =
    | { type: 'INITIALIZE' }
    | { type: 'CLEAR' }
    | { type: 'ADD_MESSAGE'; message: Omit<Message, 'id' | 'createdAt'> }
    | { type: 'UPDATE_MESSAGE'; messageId: string; updates: Partial<Message> }
    | { type: 'UPDATE_LEVEL'; level: EducationLevel }
    | { type: 'SET_ERROR'; error: string }
    | { type: 'CLEAR_ERROR' };

// Create the guest session machine
const guestSessionMachine = createMachine({
    id: 'guestSession',
    initial: 'initializing',
    context: {
        session: null,
        error: null,
        lastAddedMessage: null,
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
                    actions: assign({
                        session: ({ context, event }) => {
                            if (!context.session) return context.session;

                            try {
                                const result = addMessageToGuestSession(context.session, event.message);
                                return result.session;
                            } catch (error) {
                                console.error('Failed to add message:', error);
                                return context.session;
                            }
                        },
                        lastAddedMessage: ({ context, event }) => {
                            if (!context.session) return null;

                            try {
                                const result = addMessageToGuestSession(context.session, event.message);
                                return result.message;
                            } catch (error) {
                                console.error('Failed to add message:', error);
                                return null;
                            }
                        },
                        error: () => null,
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
    },
});

// Hook interface
interface useGuestSessionReturn {
    session: GuestSession | null;
    isLoading: boolean;
    error: string | null;

    // Session management
    initializeSession: () => void;
    clearSession: () => void;
    migrateSession: () => ReturnType<typeof migrateGuestSession>;

    // Message management
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

    const { session, error, lastAddedMessage } = state.context;
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

    // Message management functions
    const addMessage = (message: Omit<Message, 'id' | 'createdAt'>): Message | null => {
        if (!session) {
            console.error('No active session to add message to');
            return null;
        }

        // Use a closure variable to capture the added message, similar to the original implementation
        let addedMessage: Message | null = null;

        try {
            // Call addMessageToGuestSession directly to get the result 
            const result = addMessageToGuestSession(session, message);
            addedMessage = result.message;

            // Send the message to XState machine to update the context
            send({ type: 'ADD_MESSAGE', message });

            // Return the message that was actually created
            return addedMessage;
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
        error,

        // Session management
        initializeSession,
        clearSession,
        migrateSession,

        // Message management
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
// Guest session management for ELI5 application
import { z } from 'zod';
import type { GuestSession, Message, EducationLevel } from './types';

// Zod schemas for validation
const messageSchema = z.object({
    id: z.string(),
    content: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    level: z.enum(['preschool', 'elementary', 'middle', 'high', 'college', 'phd']).optional(),
    status: z.enum(['pending', 'complete', 'error']),
    createdAt: z.number(),
    isExpansion: z.boolean().optional(),
    parentMessageId: z.string().optional(),
    errorMessage: z.string().optional(),
    metadata: z.object({
        tokenCount: z.number().optional(),
        processingTime: z.number().optional(),
        model: z.string().optional(),
        confidence: z.number().optional(),
    }).optional(),
});

const guestSessionSchema = z.object({
    sessionId: z.string(),
    messages: z.array(messageSchema),
    currentLevel: z.enum(['preschool', 'elementary', 'middle', 'high', 'college', 'phd']),
    startedAt: z.number(),
    messageCount: z.number(),
    lastActivityAt: z.number(),
});

const GUEST_SESSION_KEY = 'eli5-guest-session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
    return `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new guest session
 */
export function createGuestSession(): GuestSession {
    const session: GuestSession = {
        sessionId: generateSessionId(),
        messages: [],
        currentLevel: 'elementary',
        startedAt: Date.now(),
        messageCount: 0,
        lastActivityAt: Date.now(),
    };

    saveGuestSession(session);
    return session;
}

/**
 * Save guest session to localStorage with validation
 */
export function saveGuestSession(session: GuestSession): void {
    try {
        // Validate session data
        guestSessionSchema.parse(session);

        // Update last activity
        session.lastActivityAt = Date.now();

        // Save to localStorage
        localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
        console.error('Failed to save guest session:', error);
    }
}

/**
 * Load guest session from localStorage with validation
 */
export function loadGuestSession(): GuestSession | null {
    try {
        const sessionData = localStorage.getItem(GUEST_SESSION_KEY);
        if (!sessionData) return null;

        const parsed = JSON.parse(sessionData);
        const session = guestSessionSchema.parse(parsed);

        // Check if session has expired
        if (Date.now() - session.lastActivityAt > SESSION_TIMEOUT) {
            clearGuestSession();
            return null;
        }

        return session;
    } catch (error) {
        console.error('Failed to load guest session:', error);
        // Clear corrupted session data
        clearGuestSession();
        return null;
    }
}

/**
 * Clear guest session from localStorage
 */
export function clearGuestSession(): void {
    localStorage.removeItem(GUEST_SESSION_KEY);
}

/**
 * Add a message to the guest session
 */
export function addMessageToGuestSession(
    session: GuestSession,
    message: Omit<Message, 'id' | 'createdAt'>
): GuestSession {
    const newMessage: Message = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
    };

    const updatedSession: GuestSession = {
        ...session,
        messages: [...session.messages, newMessage],
        messageCount: session.messageCount + 1,
        lastActivityAt: Date.now(),
    };

    saveGuestSession(updatedSession);
    return updatedSession;
}

/**
 * Update a message in the guest session
 */
export function updateMessageInGuestSession(
    session: GuestSession,
    messageId: string,
    updates: Partial<Message>
): GuestSession {
    const updatedSession: GuestSession = {
        ...session,
        messages: session.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
        ),
        lastActivityAt: Date.now(),
    };

    saveGuestSession(updatedSession);
    return updatedSession;
}

/**
 * Update the current level in the guest session
 */
export function updateGuestSessionLevel(
    session: GuestSession,
    level: EducationLevel
): GuestSession {
    const updatedSession: GuestSession = {
        ...session,
        currentLevel: level,
        lastActivityAt: Date.now(),
    };

    saveGuestSession(updatedSession);
    return updatedSession;
}

/**
 * Check if user is in guest mode
 */
export function isGuestMode(): boolean {
    return loadGuestSession() !== null;
}

/**
 * Get or create guest session
 */
export function getOrCreateGuestSession(): GuestSession {
    const existingSession = loadGuestSession();
    return existingSession || createGuestSession();
}

/**
 * Export guest session data for account conversion
 */
export function exportGuestSessionData(): {
    messages: Message[];
    preferences: {
        currentLevel: EducationLevel;
        messageCount: number;
        sessionDuration: number;
    };
} | null {
    const session = loadGuestSession();
    if (!session) return null;

    return {
        messages: session.messages,
        preferences: {
            currentLevel: session.currentLevel,
            messageCount: session.messageCount,
            sessionDuration: Date.now() - session.startedAt,
        },
    };
}

/**
 * Migrate guest session to authenticated user (called after account creation)
 */
export function migrateGuestSession(): {
    messages: Message[];
    preferences: {
        currentLevel: EducationLevel;
        messageCount: number;
    };
} | null {
    const sessionData = exportGuestSessionData();
    if (sessionData) {
        // Clear guest session after successful migration
        clearGuestSession();
    }
    return sessionData;
} 
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
        console.log('session saved', GUEST_SESSION_KEY, session);
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
): { session: GuestSession; message: Message } {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    const newMessageId = `msg-${timestamp}-${randomPart}`;

    console.log('addMessageToGuestSession called:');
    console.log('- Input message:', { ...message, content: message.content.substring(0, 50) + '...' });
    console.log('- Generated ID parts:', { timestamp, randomPart });
    console.log('- Final message ID:', newMessageId);
    console.log('- Current session messages before add:', session.messages.map(m => ({ id: m.id, role: m.role, status: m.status })));

    const newMessage: Message = {
        ...message,
        id: newMessageId,
        createdAt: timestamp,
    };

    console.log('- Complete new message:', { ...newMessage, content: newMessage.content.substring(0, 50) + '...' });

    const updatedSession: GuestSession = {
        ...session,
        messages: [...session.messages, newMessage],
        messageCount: session.messageCount + 1,
        lastActivityAt: timestamp,
    };

    console.log('- Session messages after add:', updatedSession.messages.map(m => ({ id: m.id, role: m.role, status: m.status })));

    saveGuestSession(updatedSession);

    console.log('- Returning message with ID:', newMessage.id);
    return { session: updatedSession, message: newMessage };
}

/**
 * Update a message in the guest session
 */
export function updateMessageInGuestSession(
    session: GuestSession,
    messageId: string,
    updates: Partial<Message>
): GuestSession {
    console.log('updateMessageInGuestSession called with:');
    console.log('- messageId:', messageId);
    console.log('- updates:', updates);
    console.log('- session message IDs:', session.messages.map(m => m.id));

    // Check if message exists
    const messageExists = session.messages.some(msg => msg.id === messageId);
    if (!messageExists) {
        console.error(`Message with ID ${messageId} not found in session!`);
        console.error('Available message IDs:', session.messages.map(m => ({ id: m.id, role: m.role, status: m.status })));

        // Use debug helper to understand the mismatch
        debugFindMessage(session, messageId);

        return session; // Return unchanged session if message not found
    }

    const updatedSession: GuestSession = {
        ...session,
        messages: session.messages.map(msg => {
            if (msg.id === messageId) {
                const updatedMessage = { ...msg, ...updates };
                console.log('Updating message:', {
                    before: { id: msg.id, status: msg.status, content: msg.content.substring(0, 50) + '...' },
                    after: { id: updatedMessage.id, status: updatedMessage.status, content: updatedMessage.content.substring(0, 50) + '...' }
                });
                return updatedMessage;
            }
            return msg;
        }),
        lastActivityAt: Date.now(),
    };

    console.log('Final updated session messages:', updatedSession.messages.map(m => ({
        id: m.id,
        role: m.role,
        status: m.status,
        contentLength: m.content.length
    })));

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

/**
 * Debug helper to find message by ID and report mismatches
 */
export function debugFindMessage(session: GuestSession, targetId: string): void {
    console.log('=== DEBUG MESSAGE LOOKUP ===');
    console.log('Target ID:', targetId);
    console.log('All message IDs in session:', session.messages.map(m => m.id));

    // Check for exact match
    const exactMatch = session.messages.find(m => m.id === targetId);
    console.log('Exact match found:', !!exactMatch);

    if (!exactMatch) {
        // Look for similar IDs (same timestamp part)
        const targetParts = targetId.split('-');
        const targetTimestamp = targetParts[1];

        console.log('Target timestamp part:', targetTimestamp);

        const similarIds = session.messages
            .map(m => ({
                id: m.id,
                timestamp: m.id.split('-')[1],
                random: m.id.split('-')[2],
                role: m.role,
                status: m.status
            }))
            .filter(m => m.timestamp === targetTimestamp);

        console.log('Messages with same timestamp:', similarIds);

        // Character-by-character comparison of closest match
        if (similarIds.length > 0) {
            const closest = similarIds[0];
            console.log('Character comparison with closest:');
            console.log('Target:  ', targetId);
            console.log('Closest: ', closest.id);
            console.log('Match:   ', targetId.split('').map((char, i) =>
                char === closest.id[i] ? char : '✗'
            ).join(''));
        }
    }
    console.log('=== END DEBUG MESSAGE LOOKUP ===');
} 
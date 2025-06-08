// React hook for guest session management
import { useState, useEffect, useCallback } from 'react';
import type { GuestSession, Message, EducationLevel } from '../types';
import {
    getOrCreateGuestSession,
    addMessageToGuestSession,
    updateMessageInGuestSession,
    updateGuestSessionLevel,
    clearGuestSession,
    migrateGuestSession,
} from '../guest-session';

interface UseGuestSessionReturn {
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
    canConvert: boolean; // Has enough activity to suggest account creation
}

export function useGuestSession(): UseGuestSessionReturn {
    const [session, setSession] = useState<GuestSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize session on mount
    useEffect(() => {
        try {
            const guestSession = getOrCreateGuestSession();
            setSession(guestSession);
            setError(null);
        } catch (err) {
            console.error('Failed to initialize guest session:', err);
            setError('Failed to initialize session');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initialize or reset session
    const initializeSession = useCallback(() => {
        try {
            setIsLoading(true);
            const newSession = getOrCreateGuestSession();
            setSession(newSession);
            setError(null);
        } catch (err) {
            console.error('Failed to initialize session:', err);
            setError('Failed to initialize session');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Clear session
    const clearSession = useCallback(() => {
        try {
            clearGuestSession();
            setSession(null);
            setError(null);
        } catch (err) {
            console.error('Failed to clear session:', err);
            setError('Failed to clear session');
        }
    }, []);

    // Migrate session data for account conversion
    const migrateSession = useCallback(() => {
        try {
            const migrationData = migrateGuestSession();
            setSession(null); // Clear local session after migration
            return migrationData;
        } catch (err) {
            console.error('Failed to migrate session:', err);
            setError('Failed to migrate session');
            return null;
        }
    }, []);

    // Add message to session
    const addMessage = useCallback((message: Omit<Message, 'id' | 'createdAt'>) => {
        let addedMessage: Message | null = null;

        setSession(currentSession => {
            if (!currentSession) {
                console.error('No active session to add message to');
                return currentSession;
            }

            try {
                const result = addMessageToGuestSession(currentSession, message);
                addedMessage = result.message;
                setError(null);
                return result.session;
            } catch (err) {
                console.error('Failed to add message:', err);
                setError('Failed to add message');
                return currentSession;
            }
        });

        return addedMessage;
    }, []);

    // Update message in session
    const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
        setSession(currentSession => {
            if (!currentSession) {
                console.error('No active session to update message in');
                return currentSession;
            }

            try {
                const updatedSession = updateMessageInGuestSession(currentSession, messageId, updates);
                setError(null);
                return updatedSession;
            } catch (err) {
                console.error('Failed to update message:', err);
                setError('Failed to update message');
                return currentSession;
            }
        });
    }, []);

    // Update current level
    const updateLevel = useCallback((level: EducationLevel) => {
        setSession(currentSession => {
            if (!currentSession) {
                console.error('No active session to update level in');
                return currentSession;
            }

            try {
                const updatedSession = updateGuestSessionLevel(currentSession, level);
                setError(null);
                return updatedSession;
            } catch (err) {
                console.error('Failed to update level:', err);
                setError('Failed to update level');
                return currentSession;
            }
        });
    }, []);

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
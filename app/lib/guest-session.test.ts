import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    generateSessionId,
    createGuestSession,
    saveGuestSession,
    loadGuestSession,
    clearGuestSession,
    addMessageToGuestSession,
    updateMessageInGuestSession,
    updateGuestSessionLevel,
    isGuestMode,
    getOrCreateGuestSession,
    exportGuestSessionData,
    migrateGuestSession,
} from './guest-session';
import type { GuestSession, Message, EducationLevel } from './types';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('guest-session utilities', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('generateSessionId', () => {
        it('should generate a unique session ID with guest prefix', () => {
            const id1 = generateSessionId();
            const id2 = generateSessionId();

            expect(id1).toMatch(/^guest-\d+-[a-z0-9]+$/);
            expect(id2).toMatch(/^guest-\d+-[a-z0-9]+$/);
            expect(id1).not.toBe(id2);
        });
    });

    describe('createGuestSession', () => {
        it('should create a new guest session with default values', () => {
            const session = createGuestSession();

            expect(session.sessionId).toMatch(/^guest-/);
            expect(session.messages).toEqual([]);
            expect(session.currentLevel).toBe('elementary');
            expect(session.messageCount).toBe(0);
            expect(typeof session.startedAt).toBe('number');
            expect(typeof session.lastActivityAt).toBe('number');
        });

        it('should save the session to localStorage', () => {
            createGuestSession();
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'eli5-guest-session',
                expect.any(String)
            );
        });
    });

    describe('saveGuestSession', () => {
        it('should save a valid session to localStorage', () => {
            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 0,
                lastActivityAt: Date.now(),
            };

            saveGuestSession(session);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'eli5-guest-session',
                expect.any(String)
            );
        });

        it('should update lastActivityAt when saving', () => {
            const originalTime = Date.now() - 1000;
            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [],
                currentLevel: 'elementary',
                startedAt: originalTime,
                messageCount: 0,
                lastActivityAt: originalTime,
            };

            saveGuestSession(session);

            expect(session.lastActivityAt).toBeGreaterThan(originalTime);
        });

        it('should handle invalid session data gracefully', () => {
            const invalidSession = {
                sessionId: 'test',
                // Missing required fields
            } as GuestSession;

            // Should not throw
            expect(() => saveGuestSession(invalidSession)).not.toThrow();
        });
    });

    describe('loadGuestSession', () => {
        it('should return null when no session exists', () => {
            const session = loadGuestSession();
            expect(session).toBeNull();
        });

        it('should load a valid session from localStorage', () => {
            const validSession: GuestSession = {
                sessionId: 'test-session',
                messages: [],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 0,
                lastActivityAt: Date.now(),
            };

            localStorageMock.setItem('eli5-guest-session', JSON.stringify(validSession));

            const loadedSession = loadGuestSession();
            expect(loadedSession).toEqual(validSession);
        });

        it('should return null and clear session if expired', () => {
            const expiredSession: GuestSession = {
                sessionId: 'expired-session',
                messages: [],
                currentLevel: 'elementary',
                startedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
                messageCount: 0,
                lastActivityAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
            };

            localStorageMock.setItem('eli5-guest-session', JSON.stringify(expiredSession));

            const session = loadGuestSession();
            expect(session).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('eli5-guest-session');
        });

        it('should handle corrupted session data gracefully', () => {
            localStorageMock.setItem('eli5-guest-session', 'invalid-json');

            const session = loadGuestSession();
            expect(session).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('eli5-guest-session');
        });
    });

    describe('addMessageToGuestSession', () => {
        it('should add a message to the session', () => {
            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 0,
                lastActivityAt: Date.now(),
            };

            const messageData: Omit<Message, 'id' | 'createdAt'> = {
                content: 'Hello world',
                role: 'user',
                status: 'complete',
            };

            const result = addMessageToGuestSession(session, messageData);

            expect(result.session.messages).toHaveLength(1);
            expect(result.session.messages[0]).toMatchObject(messageData);
            expect(result.session.messages[0].id).toBeDefined();
            expect(result.session.messages[0].createdAt).toBeDefined();
            expect(result.session.messageCount).toBe(1);
            expect(result.message).toMatchObject(messageData);
            expect(result.message.id).toBeDefined();
        });

        it('should generate unique IDs for messages', () => {
            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 0,
                lastActivityAt: Date.now(),
            };

            const messageData: Omit<Message, 'id' | 'createdAt'> = {
                content: 'Hello world',
                role: 'user',
                status: 'complete',
            };

            const result1 = addMessageToGuestSession(session, messageData);
            const result2 = addMessageToGuestSession(result1.session, messageData);

            expect(result2.session.messages[0].id).not.toBe(result2.session.messages[1].id);
        });
    });

    describe('updateMessageInGuestSession', () => {
        it('should update an existing message', () => {
            const message: Message = {
                id: 'msg-1',
                content: 'Original content',
                role: 'user',
                status: 'pending',
                createdAt: Date.now(),
            };

            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [message],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 1,
                lastActivityAt: Date.now(),
            };

            const updates: Partial<Message> = {
                content: 'Updated content',
                status: 'complete',
            };

            const updatedSession = updateMessageInGuestSession(session, 'msg-1', updates);

            expect(updatedSession.messages[0].content).toBe('Updated content');
            expect(updatedSession.messages[0].status).toBe('complete');
            expect(updatedSession.messages[0].id).toBe('msg-1'); // Should preserve ID
        });

        it('should not update non-existent messages', () => {
            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 0,
                lastActivityAt: Date.now(),
            };

            const updatedSession = updateMessageInGuestSession(session, 'non-existent', {
                content: 'Updated content',
            });

            expect(updatedSession.messages).toHaveLength(0);
        });
    });

    describe('updateGuestSessionLevel', () => {
        it('should update the current level', () => {
            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 0,
                lastActivityAt: Date.now(),
            };

            const updatedSession = updateGuestSessionLevel(session, 'college');

            expect(updatedSession.currentLevel).toBe('college');
        });
    });

    describe('isGuestMode', () => {
        it('should return false when no session exists', () => {
            expect(isGuestMode()).toBe(false);
        });

        it('should return true when a valid session exists', () => {
            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 0,
                lastActivityAt: Date.now(),
            };

            localStorageMock.setItem('eli5-guest-session', JSON.stringify(session));

            expect(isGuestMode()).toBe(true);
        });
    });

    describe('getOrCreateGuestSession', () => {
        it('should return existing session if available', () => {
            const existingSession: GuestSession = {
                sessionId: 'existing-session',
                messages: [],
                currentLevel: 'college',
                startedAt: Date.now(),
                messageCount: 5,
                lastActivityAt: Date.now(),
            };

            localStorageMock.setItem('eli5-guest-session', JSON.stringify(existingSession));

            const session = getOrCreateGuestSession();

            expect(session.sessionId).toBe('existing-session');
            expect(session.currentLevel).toBe('college');
            expect(session.messageCount).toBe(5);
        });

        it('should create new session if none exists', () => {
            const session = getOrCreateGuestSession();

            expect(session.sessionId).toMatch(/^guest-/);
            expect(session.currentLevel).toBe('elementary');
            expect(session.messageCount).toBe(0);
        });
    });

    describe('exportGuestSessionData', () => {
        it('should export session data correctly', () => {
            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [
                    {
                        id: 'msg-1',
                        content: 'Hello',
                        role: 'user',
                        status: 'complete',
                        createdAt: Date.now(),
                    },
                ],
                currentLevel: 'college',
                startedAt: Date.now() - 1000,
                messageCount: 1,
                lastActivityAt: Date.now(),
            };

            localStorageMock.setItem('eli5-guest-session', JSON.stringify(session));

            const exportedData = exportGuestSessionData();

            expect(exportedData).toEqual({
                messages: session.messages,
                preferences: {
                    currentLevel: 'college',
                    messageCount: 1,
                    sessionDuration: expect.any(Number),
                },
            });
        });

        it('should return null when no session exists', () => {
            const exportedData = exportGuestSessionData();
            expect(exportedData).toBeNull();
        });
    });

    describe('migrateGuestSession', () => {
        it('should migrate session and clear it', () => {
            const session: GuestSession = {
                sessionId: 'test-session',
                messages: [
                    {
                        id: 'msg-1',
                        content: 'Hello',
                        role: 'user',
                        status: 'complete',
                        createdAt: Date.now(),
                    },
                ],
                currentLevel: 'college',
                startedAt: Date.now(),
                messageCount: 1,
                lastActivityAt: Date.now(),
            };

            localStorageMock.setItem('eli5-guest-session', JSON.stringify(session));

            const migrationData = migrateGuestSession();

            expect(migrationData).toEqual({
                messages: session.messages,
                preferences: {
                    currentLevel: 'college',
                    messageCount: 1,
                    sessionDuration: expect.any(Number),
                },
            });

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('eli5-guest-session');
        });

        it('should return null when no session to migrate', () => {
            const migrationData = migrateGuestSession();
            expect(migrationData).toBeNull();
        });
    });
}); 
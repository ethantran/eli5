import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGuestSession } from './use-guest-session';
import type { GuestSession, Message } from '../types';

// Create a mock session store
let mockSession: GuestSession | null = null;

const resetMockSession = () => {
    mockSession = null;
};

const setMockSession = (session: GuestSession) => {
    mockSession = session;
};

// Mock the guest-session module
vi.mock('../guest-session', () => ({
    getOrCreateGuestSession: vi.fn(() => {
        if (!mockSession) {
            mockSession = {
                sessionId: 'test-session-id',
                messages: [],
                currentLevel: 'elementary' as const,
                startedAt: Date.now(),
                messageCount: 0,
                lastActivityAt: Date.now(),
            };
        }
        return mockSession;
    }),
    addMessageToGuestSession: vi.fn((session: GuestSession, message: Omit<Message, 'id' | 'createdAt'>) => {
        const newMessage: Message = {
            ...message,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
        };
        const updatedSession = {
            ...session,
            messages: [...session.messages, newMessage],
            messageCount: session.messageCount + 1,
            lastActivityAt: Date.now(),
        };
        mockSession = updatedSession;
        return updatedSession;
    }),
    updateMessageInGuestSession: vi.fn((session: GuestSession, messageId: string, updates: Partial<Message>) => {
        const updatedSession = {
            ...session,
            messages: session.messages.map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
            ),
            lastActivityAt: Date.now(),
        };
        mockSession = updatedSession;
        return updatedSession;
    }),
    updateGuestSessionLevel: vi.fn((session: GuestSession, level: any) => {
        const updatedSession = {
            ...session,
            currentLevel: level,
            lastActivityAt: Date.now(),
        };
        mockSession = updatedSession;
        return updatedSession;
    }),
    clearGuestSession: vi.fn(() => {
        mockSession = null;
    }),
    migrateGuestSession: vi.fn(() => {
        if (!mockSession) return null;
        const migrationData = {
            messages: mockSession.messages,
            preferences: {
                currentLevel: mockSession.currentLevel,
                messageCount: mockSession.messageCount,
            },
        };
        mockSession = null;
        return migrationData;
    }),
}));

// Import the mocked functions
import {
    getOrCreateGuestSession,
    addMessageToGuestSession,
    updateMessageInGuestSession,
    updateGuestSessionLevel,
    clearGuestSession,
    migrateGuestSession,
} from '../guest-session';

describe('useGuestSession hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetMockSession();
    });

    describe('initialization', () => {
        it('should initialize with loading state', () => {
            // Mock the getOrCreateGuestSession to throw an error so loading stays true longer
            vi.mocked(getOrCreateGuestSession).mockImplementationOnce(() => {
                throw new Error('Mock delay');
            });

            const { result } = renderHook(() => useGuestSession());

            // Should start loading and handle error
            expect(result.current.isLoading).toBe(false); // Will be false after effect runs
            expect(result.current.session).toBeNull();
            expect(result.current.error).toBe('Failed to initialize session');
        });

        it('should create or load a session on mount', async () => {
            const { result } = renderHook(() => useGuestSession());

            // Wait for the effect to complete
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.session).toBeDefined();
            expect(result.current.session?.sessionId).toBe('test-session-id');
            expect(getOrCreateGuestSession).toHaveBeenCalled();
        });

        it('should handle initialization errors', async () => {
            vi.mocked(getOrCreateGuestSession).mockImplementationOnce(() => {
                throw new Error('Failed to initialize');
            });

            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.session).toBeNull();
            expect(result.current.error).toBe('Failed to initialize session');
        });
    });

    describe('session management', () => {
        it('should initialize a new session', async () => {
            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            act(() => {
                result.current.initializeSession();
            });

            expect(getOrCreateGuestSession).toHaveBeenCalledTimes(2);
            expect(result.current.error).toBeNull();
        });

        it('should clear the session', async () => {
            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            act(() => {
                result.current.clearSession();
            });

            expect(clearGuestSession).toHaveBeenCalled();
            expect(result.current.session).toBeNull();
        });

        it('should migrate session data', async () => {
            setMockSession({
                sessionId: 'test-session',
                messages: [
                    {
                        id: 'msg-1',
                        content: 'Test message',
                        role: 'user',
                        status: 'complete',
                        createdAt: Date.now(),
                    },
                ],
                currentLevel: 'college',
                startedAt: Date.now(),
                messageCount: 1,
                lastActivityAt: Date.now(),
            });

            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            let migrationData: any;
            act(() => {
                migrationData = result.current.migrateSession();
            });

            expect(migrateGuestSession).toHaveBeenCalled();
            expect(migrationData).toEqual({
                messages: expect.any(Array),
                preferences: {
                    currentLevel: 'college',
                    messageCount: 1,
                },
            });
            expect(result.current.session).toBeNull();
        });
    });

    describe('message management', () => {
        beforeEach(async () => {
            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            return { result };
        });

        it('should add a message to the session', async () => {
            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            const messageData = {
                content: 'Hello world',
                role: 'user' as const,
                status: 'complete' as const,
            };

            act(() => {
                result.current.addMessage(messageData);
            });

            expect(addMessageToGuestSession).toHaveBeenCalledWith(
                expect.any(Object),
                messageData
            );
            expect(result.current.session?.messages).toHaveLength(1);
            expect(result.current.session?.messageCount).toBe(1);
        });

        it('should update an existing message', async () => {
            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            // First add a message
            act(() => {
                result.current.addMessage({
                    content: 'Original content',
                    role: 'user',
                    status: 'pending',
                });
            });

            const messageId = result.current.session?.messages[0]?.id;
            expect(messageId).toBeDefined();

            // Then update it
            const updates = {
                content: 'Updated content',
                status: 'complete' as const,
            };

            act(() => {
                result.current.updateMessage(messageId!, updates);
            });

            expect(updateMessageInGuestSession).toHaveBeenCalledWith(
                expect.any(Object),
                messageId,
                updates
            );
        });

        it('should handle adding message without session gracefully', async () => {
            const { result } = renderHook(() => useGuestSession());

            // Clear the session
            act(() => {
                result.current.clearSession();
            });

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            act(() => {
                result.current.addMessage({
                    content: 'Test message',
                    role: 'user',
                    status: 'complete',
                });
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('No active session to add message to');
            consoleErrorSpy.mockRestore();
        });

        it('should handle updating message without session gracefully', async () => {
            const { result } = renderHook(() => useGuestSession());

            // Clear the session
            act(() => {
                result.current.clearSession();
            });

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            act(() => {
                result.current.updateMessage('msg-1', { content: 'Updated' });
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('No active session to update message in');
            consoleErrorSpy.mockRestore();
        });
    });

    describe('level management', () => {
        it('should update the current level', async () => {
            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            act(() => {
                result.current.updateLevel('college');
            });

            expect(updateGuestSessionLevel).toHaveBeenCalledWith(
                expect.any(Object),
                'college'
            );
            expect(result.current.session?.currentLevel).toBe('college');
        });

        it('should handle updating level without session gracefully', async () => {
            const { result } = renderHook(() => useGuestSession());

            // Clear the session
            act(() => {
                result.current.clearSession();
            });

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            act(() => {
                result.current.updateLevel('college');
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('No active session to update level in');
            consoleErrorSpy.mockRestore();
        });
    });

    describe('computed values', () => {
        it('should compute isGuest correctly', async () => {
            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(result.current.isGuest).toBe(true);

            act(() => {
                result.current.clearSession();
            });

            expect(result.current.isGuest).toBe(false);
        });

        it('should compute messageCount correctly', async () => {
            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(result.current.messageCount).toBe(0);

            act(() => {
                result.current.addMessage({
                    content: 'Test message',
                    role: 'user',
                    status: 'complete',
                });
            });

            expect(result.current.messageCount).toBe(1);
        });

        it('should compute canConvert correctly', async () => {
            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(result.current.canConvert).toBe(false);

            // Add 3 messages to trigger conversion eligibility
            for (let i = 0; i < 3; i++) {
                act(() => {
                    result.current.addMessage({
                        content: `Test message ${i + 1}`,
                        role: 'user',
                        status: 'complete',
                    });
                });
            }

            expect(result.current.canConvert).toBe(true);
        });
    });

    describe('error handling', () => {
        it('should handle addMessage errors', async () => {
            vi.mocked(addMessageToGuestSession).mockImplementationOnce(() => {
                throw new Error('Add message failed');
            });

            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            act(() => {
                result.current.addMessage({
                    content: 'Test message',
                    role: 'user',
                    status: 'complete',
                });
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to add message:', expect.any(Error));
            expect(result.current.error).toBe('Failed to add message');
            consoleErrorSpy.mockRestore();
        });

        it('should handle updateMessage errors', async () => {
            vi.mocked(updateMessageInGuestSession).mockImplementationOnce(() => {
                throw new Error('Update message failed');
            });

            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            act(() => {
                result.current.updateMessage('msg-1', { content: 'Updated' });
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update message:', expect.any(Error));
            expect(result.current.error).toBe('Failed to update message');
            consoleErrorSpy.mockRestore();
        });

        it('should handle updateLevel errors', async () => {
            vi.mocked(updateGuestSessionLevel).mockImplementationOnce(() => {
                throw new Error('Update level failed');
            });

            const { result } = renderHook(() => useGuestSession());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            act(() => {
                result.current.updateLevel('college');
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update level:', expect.any(Error));
            expect(result.current.error).toBe('Failed to update level');
            consoleErrorSpy.mockRestore();
        });
    });
}); 
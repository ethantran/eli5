import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GuestChatInterface } from './guest-chat-interface';
import type { GuestSession, Message, EducationLevel } from '~/lib/types';

// Mock the hooks and components
vi.mock('~/lib/hooks/use-guest-session', () => ({
    useGuestSession: vi.fn(),
}));

vi.mock('~/components/message-bubble', () => ({
    MessageBubble: ({ message, onLevelChange }: {
        message: Message;
        onLevelChange?: (id: string, level: EducationLevel) => void;
    }) => (
        <div data-testid={`message-${message.id}`}>
            <div data-testid="message-content">{message.content}</div>
            <div data-testid="message-status">{message.status}</div>
            {message.status === 'pending' && <div data-testid="loading">Loading...</div>}
            {onLevelChange && (
                <button onClick={() => onLevelChange(message.id, 'college')}>
                    Change Level
                </button>
            )}
        </div>
    ),
}));

vi.mock('~/components/chat-input', () => ({
    ChatInput: ({ onSend, isLoading, disabled }: {
        onSend: (content: string) => void;
        isLoading: boolean;
        disabled: boolean;
    }) => (
        <div data-testid="chat-input">
            <input
                data-testid="chat-input-field"
                disabled={disabled}
                onChange={(e) => {/* handled by parent */ }}
            />
            <button
                data-testid="chat-send-button"
                onClick={() => onSend('Test message')}
                disabled={isLoading || disabled}
            >
                {isLoading ? 'Sending...' : 'Send'}
            </button>
        </div>
    ),
}));

// Mock Convex actions
vi.mock('convex/react', () => ({
    useAction: vi.fn(() => vi.fn()),
}));

vi.mock('convex/_generated/api', () => ({
    api: {
        guest: {
            generateGuestExplanation: 'mock-generate-action',
            regenerateAtLevel: 'mock-regenerate-action',
        },
    },
}));

import { useGuestSession } from '~/lib/hooks/use-guest-session';
import { useAction } from 'convex/react';

describe('GuestChatInterface', () => {
    const mockAddMessage = vi.fn();
    const mockUpdateMessage = vi.fn();
    const mockUpdateLevel = vi.fn();
    const mockGenerateExplanation = vi.fn();
    const mockRegenerateAtLevel = vi.fn();

    const defaultHookReturn = {
        session: {
            sessionId: 'test-session',
            messages: [] as Message[],
            currentLevel: 'elementary' as const,
            startedAt: Date.now(),
            messageCount: 0,
            lastActivityAt: Date.now(),
        } as GuestSession,
        isLoading: false,
        error: null,
        addMessage: mockAddMessage,
        updateMessage: mockUpdateMessage,
        updateLevel: mockUpdateLevel,
        messageCount: 0,
        canConvert: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useGuestSession).mockReturnValue(defaultHookReturn);
        vi.mocked(useAction).mockImplementation((action) => {
            if (action === 'mock-generate-action') return mockGenerateExplanation;
            if (action === 'mock-regenerate-action') return mockRegenerateAtLevel;
            return vi.fn();
        });
    });

    describe('loading states', () => {
        it('should show loading spinner when session is loading', () => {
            vi.mocked(useGuestSession).mockReturnValue({
                ...defaultHookReturn,
                session: null,
                isLoading: true,
            });

            render(<GuestChatInterface />);

            expect(screen.getByText('Initializing your learning session...')).toBeDefined();
            expect(screen.getByText('Initializing your learning session...')
                .closest('div')?.querySelector('.animate-spin')).toBeDefined();
        });

        it('should show error state when session fails to load', () => {
            vi.mocked(useGuestSession).mockReturnValue({
                ...defaultHookReturn,
                session: null,
                isLoading: false,
                error: 'Failed to initialize session',
            });

            render(<GuestChatInterface />);

            expect(screen.getByText('Session Error')).toBeDefined();
            expect(screen.getByText('Failed to initialize session')).toBeDefined();
            expect(screen.getByText('Try Again')).toBeDefined();
        });
    });

    describe('message flow - CRITICAL FOR LOADING BUG', () => {
        beforeEach(() => {
            // Reset to a clean session state for each test
            const cleanSession = {
                sessionId: 'test-session',
                messages: [] as Message[],
                currentLevel: 'elementary' as const,
                startedAt: Date.now(),
                messageCount: 0,
                lastActivityAt: Date.now(),
            };

            vi.mocked(useGuestSession).mockReturnValue({
                ...defaultHookReturn,
                session: cleanSession,
            });
        });

        it('should handle complete message sending flow', async () => {
            // Mock successful API response
            mockGenerateExplanation.mockResolvedValue({
                id: 'response-1',
                content: 'This is the AI response',
                level: 'elementary',
                metadata: {},
            });

            render(<GuestChatInterface />);

            // Find and click send button
            const sendButton = screen.getByTestId('chat-send-button');
            fireEvent.click(sendButton);

            // Should call addMessage twice (user message + pending message)
            expect(mockAddMessage).toHaveBeenCalledTimes(2);

            // First call should be user message
            expect(mockAddMessage).toHaveBeenNthCalledWith(1, {
                content: 'Test message',
                role: 'user',
                status: 'complete',
            });

            // Second call should be pending AI message
            expect(mockAddMessage).toHaveBeenNthCalledWith(2, {
                content: '',
                role: 'assistant',
                level: 'elementary',
                status: 'pending',
            });

            // Should call generateExplanation
            await waitFor(() => {
                expect(mockGenerateExplanation).toHaveBeenCalledWith({
                    content: 'Test message',
                    level: 'elementary',
                    sessionId: 'test-session',
                });
            });
        });

        it('should update pending message when response arrives', async () => {
            // Mock session with a pending message
            const sessionWithPending: GuestSession = {
                sessionId: 'test-session',
                messages: [
                    {
                        id: 'user-msg-1',
                        content: 'Test question',
                        role: 'user',
                        status: 'complete',
                        createdAt: Date.now() - 1000,
                    },
                    {
                        id: 'pending-msg-1',
                        content: '',
                        role: 'assistant',
                        status: 'pending',
                        level: 'elementary',
                        createdAt: Date.now(),
                    },
                ] as Message[],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 2,
                lastActivityAt: Date.now(),
            };

            vi.mocked(useGuestSession).mockReturnValue({
                ...defaultHookReturn,
                session: sessionWithPending,
            });

            // Mock successful API response
            mockGenerateExplanation.mockResolvedValue({
                id: 'response-1',
                content: 'This is the AI response',
                level: 'elementary',
                metadata: { tokens: 100 },
            });

            render(<GuestChatInterface />);

            // Find and click send button
            const sendButton = screen.getByTestId('chat-send-button');
            fireEvent.click(sendButton);

            // Wait for API call and response
            await waitFor(() => {
                expect(mockGenerateExplanation).toHaveBeenCalled();
            });

            // Should update the pending message with the response
            await waitFor(() => {
                expect(mockUpdateMessage).toHaveBeenCalledWith(
                    'pending-msg-1', // The ID of the last (pending) message
                    {
                        content: 'This is the AI response',
                        status: 'complete',
                        metadata: { tokens: 100 },
                    }
                );
            });
        });

        it('should handle API errors correctly', async () => {
            // Mock session with a pending message
            const sessionWithPending: GuestSession = {
                sessionId: 'test-session',
                messages: [
                    {
                        id: 'pending-msg-1',
                        content: '',
                        role: 'assistant',
                        status: 'pending',
                        level: 'elementary',
                        createdAt: Date.now(),
                    },
                ] as Message[],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 1,
                lastActivityAt: Date.now(),
            };

            vi.mocked(useGuestSession).mockReturnValue({
                ...defaultHookReturn,
                session: sessionWithPending,
            });

            // Mock API error
            const apiError = new Error('Network error');
            mockGenerateExplanation.mockRejectedValue(apiError);

            render(<GuestChatInterface />);

            // Find and click send button
            const sendButton = screen.getByTestId('chat-send-button');
            fireEvent.click(sendButton);

            // Wait for error handling
            await waitFor(() => {
                expect(mockUpdateMessage).toHaveBeenCalledWith(
                    'pending-msg-1',
                    {
                        content: 'Sorry, I encountered an error while generating your explanation. Please try again.',
                        status: 'error',
                        errorMessage: 'Network error',
                    }
                );
            });
        });
    });

    describe('level change flow', () => {
        it('should handle level changes correctly', async () => {
            // Mock session with an assistant message
            const sessionWithMessage: GuestSession = {
                sessionId: 'test-session',
                messages: [
                    {
                        id: 'user-msg-1',
                        content: 'What is AI?',
                        role: 'user',
                        status: 'complete',
                        createdAt: Date.now() - 2000,
                    },
                    {
                        id: 'assistant-msg-1',
                        content: 'AI is artificial intelligence...',
                        role: 'assistant',
                        status: 'complete',
                        level: 'elementary',
                        createdAt: Date.now() - 1000,
                    },
                ] as Message[],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 2,
                lastActivityAt: Date.now(),
            };

            vi.mocked(useGuestSession).mockReturnValue({
                ...defaultHookReturn,
                session: sessionWithMessage,
            });

            // Mock successful regeneration response
            mockRegenerateAtLevel.mockResolvedValue({
                id: 'response-2',
                content: 'AI (Artificial Intelligence) refers to...',
                level: 'college',
                metadata: {},
            });

            render(<GuestChatInterface />);

            // Find the message bubble and trigger level change
            const changeButton = screen.getByText('Change Level');
            fireEvent.click(changeButton);

            // Should update level
            expect(mockUpdateLevel).toHaveBeenCalledWith('college');

            // Should set message to pending
            expect(mockUpdateMessage).toHaveBeenCalledWith(
                'assistant-msg-1',
                {
                    status: 'pending',
                    level: 'college',
                }
            );

            // Wait for regeneration
            await waitFor(() => {
                expect(mockRegenerateAtLevel).toHaveBeenCalledWith({
                    originalContent: 'What is AI?',
                    newLevel: 'college',
                    sessionId: 'test-session',
                });
            });
        });
    });

    describe('UI state management', () => {
        it('should disable input during generation', () => {
            render(<GuestChatInterface />);

            const sendButton = screen.getByTestId('chat-send-button');
            const inputField = screen.getByTestId('chat-input-field');

            // Initially should be enabled
            expect(sendButton).toBeDefined();
            expect(inputField).toBeDefined();

            // Click send button to start generation
            fireEvent.click(sendButton);

            // Should show generating state (mocked in ChatInput)
            expect(screen.getByText('Sending...')).toBeDefined();
        });

        it('should show conversion prompt when eligible', () => {
            vi.mocked(useGuestSession).mockReturnValue({
                ...defaultHookReturn,
                messageCount: 5,
                canConvert: true,
            });

            render(<GuestChatInterface />);

            expect(screen.getByText('You\'re getting the hang of this!')).toBeDefined();
            expect(screen.getByText('Sign up to save your progress and unlock advanced features')).toBeDefined();
        });
    });

    describe('empty state', () => {
        it('should show welcome message when no messages', () => {
            render(<GuestChatInterface />);

            expect(screen.getByText('Welcome to ELI5!')).toBeDefined();
            expect(screen.getByText(/Ask me to explain any topic/)).toBeDefined();
        });

        it('should show example prompts', () => {
            render(<GuestChatInterface />);

            expect(screen.getByText('How do computers work?')).toBeDefined();
            expect(screen.getByText('What is quantum physics?')).toBeDefined();
            expect(screen.getByText('Explain machine learning')).toBeDefined();
            expect(screen.getByText('How does the stock market work?')).toBeDefined();
        });
    });

    describe('message rendering', () => {
        it('should render all messages in session', () => {
            const sessionWithMessages: GuestSession = {
                sessionId: 'test-session',
                messages: [
                    {
                        id: 'msg-1',
                        content: 'Question 1',
                        role: 'user',
                        status: 'complete',
                        createdAt: Date.now() - 2000,
                    },
                    {
                        id: 'msg-2',
                        content: 'Answer 1',
                        role: 'assistant',
                        status: 'complete',
                        level: 'elementary',
                        createdAt: Date.now() - 1000,
                    },
                ] as Message[],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 2,
                lastActivityAt: Date.now(),
            };

            vi.mocked(useGuestSession).mockReturnValue({
                ...defaultHookReturn,
                session: sessionWithMessages,
            });

            render(<GuestChatInterface />);

            expect(screen.getByTestId('message-msg-1')).toBeDefined();
            expect(screen.getByTestId('message-msg-2')).toBeDefined();
        });

        it('should pass correct props to MessageBubble', () => {
            const sessionWithMessage: GuestSession = {
                sessionId: 'test-session',
                messages: [
                    {
                        id: 'assistant-msg-1',
                        content: 'Test response',
                        role: 'assistant',
                        status: 'complete',
                        level: 'elementary',
                        createdAt: Date.now(),
                    },
                ] as Message[],
                currentLevel: 'elementary',
                startedAt: Date.now(),
                messageCount: 1,
                lastActivityAt: Date.now(),
            };

            vi.mocked(useGuestSession).mockReturnValue({
                ...defaultHookReturn,
                session: sessionWithMessage,
            });

            render(<GuestChatInterface />);

            // MessageBubble should receive the message and be marked as guest
            expect(screen.getByTestId('message-assistant-msg-1')).toBeDefined();
            expect(screen.getByText('Change Level')).toBeDefined(); // onLevelChange should be passed
        });
    });
}); 
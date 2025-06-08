import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from './message-bubble';
import type { Message, EducationLevel } from '~/lib/types';

// Mock the level dropdown component
vi.mock('~/components/level-dropdown', () => ({
    LevelDropdown: ({ currentLevel, onSelect, onClose }: {
        currentLevel: EducationLevel;
        onSelect: (level: EducationLevel) => void;
        onClose: () => void;
    }) => (
        <div data-testid="level-dropdown">
            <button onClick={() => onSelect('college')}>College</button>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

describe('MessageBubble', () => {
    const mockOnLevelChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('user messages', () => {
        const userMessage: Message = {
            id: 'user-msg-1',
            content: 'What is quantum physics?',
            role: 'user',
            status: 'complete',
            createdAt: Date.now(),
        };

        it('should render user message correctly', () => {
            render(<MessageBubble message={userMessage} />);

            expect(screen.getByText('What is quantum physics?')).toBeDefined();
            expect(screen.queryByTestId('level-dropdown')).toBeNull();
        });

        it('should show blue styling for user messages', () => {
            const { container } = render(<MessageBubble message={userMessage} />);

            const messageCard = container.querySelector('.bg-blue-500');
            expect(messageCard).toBeDefined();
        });
    });

    describe('assistant messages', () => {
        const assistantMessage: Message = {
            id: 'assistant-msg-1',
            content: 'Quantum physics is the study of very small particles...',
            role: 'assistant',
            status: 'complete',
            level: 'elementary',
            createdAt: Date.now(),
        };

        it('should render assistant message correctly', () => {
            render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            expect(screen.getByText(/Quantum physics is the study/)).toBeDefined();
            expect(screen.getByText('Elementary')).toBeDefined();
            expect(screen.getByText('Change level')).toBeDefined();
        });

        it('should display level badge', () => {
            render(<MessageBubble message={assistantMessage} />);

            expect(screen.getByText('Elementary')).toBeDefined();
        });

        it('should display timestamp', () => {
            render(<MessageBubble message={assistantMessage} />);

            // Should show time in HH:MM format
            const timeElement = screen.getByText(/\d{1,2}:\d{2}/);
            expect(timeElement).toBeDefined();
        });
    });

    describe('pending state - CRITICAL FOR LOADING BUG', () => {
        const pendingMessage: Message = {
            id: 'pending-msg-1',
            content: '',
            role: 'assistant',
            status: 'pending',
            level: 'elementary',
            createdAt: Date.now(),
        };

        it('should show loading indicator for pending messages', () => {
            render(<MessageBubble message={pendingMessage} />);

            expect(screen.getByText('Generating explanation...')).toBeDefined();

            // Check for loading spinner
            const { container } = render(<MessageBubble message={pendingMessage} />);
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toBeDefined();
        });

        it('should apply opacity styling to pending messages', () => {
            const { container } = render(<MessageBubble message={pendingMessage} />);

            const messageCard = container.querySelector('.opacity-70');
            expect(messageCard).toBeDefined();
        });

        it('should not allow level changes on pending messages', () => {
            render(
                <MessageBubble
                    message={pendingMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            // Pending messages should not have cursor-pointer when no level can be changed
            const messageCard = screen.getByText('Generating explanation...').closest('.p-4');
            expect(messageCard).toBeDefined();

            // Try to click - should not open dropdown
            if (messageCard) {
                fireEvent.click(messageCard);
            }

            expect(screen.queryByTestId('level-dropdown')).toBeNull();
        });
    });

    describe('error state', () => {
        const errorMessage: Message = {
            id: 'error-msg-1',
            content: 'Failed response',
            role: 'assistant',
            status: 'error',
            level: 'elementary',
            errorMessage: 'Network error occurred',
            createdAt: Date.now(),
        };

        it('should show error styling for error messages', () => {
            const { container } = render(<MessageBubble message={errorMessage} />);

            const messageCard = container.querySelector('.border-red-300');
            expect(messageCard).toBeDefined();
        });

        it('should display error message', () => {
            render(<MessageBubble message={errorMessage} />);

            expect(screen.getByText('⚠️ Network error occurred')).toBeDefined();
        });

        it('should show content even in error state', () => {
            render(<MessageBubble message={errorMessage} />);

            expect(screen.getByText('Failed response')).toBeDefined();
        });
    });

    describe('level changes', () => {
        const assistantMessage: Message = {
            id: 'assistant-msg-1',
            content: 'Quantum physics explanation',
            role: 'assistant',
            status: 'complete',
            level: 'elementary',
            createdAt: Date.now(),
        };

        it('should open level dropdown when clicking on assistant message', () => {
            render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            const messageCard = screen.getByText('Quantum physics explanation').closest('.cursor-pointer');
            expect(messageCard).toBeDefined();

            fireEvent.click(messageCard!);

            expect(screen.getByTestId('level-dropdown')).toBeDefined();
        });

        it('should call onLevelChange when level is selected', () => {
            render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            // Open dropdown
            const messageCard = screen.getByText('Quantum physics explanation').closest('.cursor-pointer');
            fireEvent.click(messageCard!);

            // Select new level
            const collegeButton = screen.getByText('College');
            fireEvent.click(collegeButton);

            expect(mockOnLevelChange).toHaveBeenCalledWith('assistant-msg-1', 'college');
        });

        it('should not show level change options for user messages', () => {
            const userMessage: Message = {
                id: 'user-msg-1',
                content: 'User question',
                role: 'user',
                status: 'complete',
                createdAt: Date.now(),
            };

            render(
                <MessageBubble
                    message={userMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            expect(screen.queryByText('Change level')).toBeNull();
        });
    });

    describe('message state transitions - KEY FOR DEBUGGING LOADING ISSUE', () => {
        it('should handle pending to complete transition', () => {
            const pendingMessage: Message = {
                id: 'msg-1',
                content: '',
                role: 'assistant',
                status: 'pending',
                level: 'elementary',
                createdAt: Date.now(),
            };

            const { rerender } = render(<MessageBubble message={pendingMessage} />);

            // Should show loading state
            expect(screen.getByText('Generating explanation...')).toBeDefined();

            // Update to complete
            const completeMessage: Message = {
                ...pendingMessage,
                content: 'This is the explanation',
                status: 'complete',
            };

            rerender(<MessageBubble message={completeMessage} />);

            // Should show content and not loading
            expect(screen.getByText('This is the explanation')).toBeDefined();
            expect(screen.queryByText('Generating explanation...')).toBeNull();
        });

        it('should handle pending to error transition', () => {
            const pendingMessage: Message = {
                id: 'msg-1',
                content: '',
                role: 'assistant',
                status: 'pending',
                level: 'elementary',
                createdAt: Date.now(),
            };

            const { rerender } = render(<MessageBubble message={pendingMessage} />);

            // Should show loading state
            expect(screen.getByText('Generating explanation...')).toBeDefined();

            // Update to error
            const errorMessage: Message = {
                ...pendingMessage,
                content: 'Error response',
                status: 'error',
                errorMessage: 'Failed to generate',
            };

            rerender(<MessageBubble message={errorMessage} />);

            // Should show error and not loading
            expect(screen.getByText('⚠️ Failed to generate')).toBeDefined();
            expect(screen.queryByText('Generating explanation...')).toBeNull();
        });
    });
}); 
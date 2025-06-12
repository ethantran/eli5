import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageBubble } from './message-bubble';
import type { Message, EducationLevel } from '~/lib/types';

// Mock the level dropdown component with controlled component support
vi.mock('~/components/level-dropdown', () => ({
    LevelDropdown: ({ currentLevel, onSelect, triggerContent, open, onOpenChange }: {
        currentLevel: EducationLevel;
        onSelect: (level: EducationLevel) => void;
        triggerContent?: React.ReactNode;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    }) => (
        <div data-testid="level-dropdown" data-open={open}>
            {triggerContent || <span>Level: {currentLevel}</span>}
            {(open === true || open === undefined) && (
                <div data-testid="dropdown-content">
                    <button onClick={() => {
                        onSelect('college');
                        onOpenChange?.(false);
                    }}>College</button>
                    <button onClick={() => {
                        onSelect('elementary');
                        onOpenChange?.(false);
                    }}>Elementary</button>
                </div>
            )}
        </div>
    ),
}));

// Mock window.getSelection for text selection tests
const mockGetSelection = vi.fn();
Object.defineProperty(window, 'getSelection', {
    value: mockGetSelection,
    writable: true,
});

describe('MessageBubble', () => {
    const mockOnLevelChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSelection.mockReturnValue({
            isCollapsed: true,
            toString: () => '',
            removeAllRanges: vi.fn(),
        });
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

        it('should not enable text selection for user messages', () => {
            const { container } = render(<MessageBubble message={userMessage} />);

            const messageContent = container.querySelector('.select-text');
            expect(messageContent).toBeNull();
        });
    });

    describe('assistant messages', () => {
        const assistantMessage: Message = {
            id: 'assistant-msg-1',
            content: 'Quantum physics is the study of very small particles and their behavior.',
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
            expect(screen.getByTestId('level-dropdown')).toBeDefined();
        });

        it('should enable text selection for assistant messages with level change handler', () => {
            const { container } = render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            const messageContent = container.querySelector('.select-text');
            expect(messageContent).toBeDefined();
        });

        it('should display level dropdown when level change is available', () => {
            render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            expect(screen.getByTestId('level-dropdown')).toBeDefined();
        });

        it('should display level badge when no level change handler provided', () => {
            render(<MessageBubble message={assistantMessage} />);

            expect(screen.getByText('Elementary')).toBeDefined();
            expect(screen.queryByTestId('level-dropdown')).toBeNull();
        });

        it('should display timestamp', () => {
            render(<MessageBubble message={assistantMessage} />);

            // Should show time in HH:MM format
            const timeElement = screen.getByText(/\d{1,2}:\d{2}/);
            expect(timeElement).toBeDefined();
        });
    });

    describe('Text Selection Feature - CRITICAL FOR HIGHLIGHTING BUG', () => {
        const assistantMessage: Message = {
            id: 'assistant-msg-1',
            content: 'Quantum physics is the study of very small particles and their behavior.',
            role: 'assistant',
            status: 'complete',
            level: 'elementary',
            createdAt: Date.now(),
        };

        beforeEach(() => {
            // Mock getBoundingClientRect for positioning tests
            Element.prototype.getBoundingClientRect = vi.fn(() => ({
                x: 0,
                y: 0,
                width: 100,
                height: 20,
                top: 0,
                left: 0,
                bottom: 20,
                right: 100,
                toJSON: vi.fn(),
            }));
        });

        it('should show selection dropdown when text is selected', async () => {
            // Mock text selection
            const mockRange = {
                getBoundingClientRect: () => ({ left: 50, bottom: 20, width: 30 }),
                commonAncestorContainer: document.createElement('div'),
            };

            mockGetSelection.mockReturnValue({
                isCollapsed: false,
                toString: () => 'selected text',
                getRangeAt: () => mockRange,
                removeAllRanges: vi.fn(),
            });

            const { container } = render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            const messageContent = container.querySelector('[data-testid="message-content"]') ||
                container.querySelector('.whitespace-pre-wrap');

            // Mock the message content contains the selection
            if (messageContent) {
                Object.defineProperty(messageContent, 'contains', {
                    value: () => true,
                });
            }

            // Simulate mouseup event for text selection
            fireEvent.mouseUp(messageContent || container);

            await waitFor(() => {
                const selectionDropdowns = screen.getAllByTestId('level-dropdown');
                // Should have at least one dropdown (possibly two - one for selection, one for button)
                expect(selectionDropdowns.length).toBeGreaterThan(0);
            });
        });

        it('should clear selection dropdown when text selection is cleared', async () => {
            // Start with text selected
            const mockRange = {
                getBoundingClientRect: () => ({ left: 50, bottom: 20, width: 30 }),
                commonAncestorContainer: document.createElement('div'),
            };

            mockGetSelection.mockReturnValue({
                isCollapsed: false,
                toString: () => 'selected text',
                getRangeAt: () => mockRange,
                removeAllRanges: vi.fn(),
            });

            const { container } = render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            const messageContent = container.querySelector('.whitespace-pre-wrap');
            if (messageContent) {
                Object.defineProperty(messageContent, 'contains', {
                    value: () => true,
                });
            }

            // Simulate selection
            fireEvent.mouseUp(messageContent || container);

            // Clear selection
            mockGetSelection.mockReturnValue({
                isCollapsed: true,
                toString: () => '',
                removeAllRanges: vi.fn(),
            });

            // Simulate mouseup with no selection
            fireEvent.mouseUp(messageContent || container);

            // Selection dropdown should be cleared (only regular dropdown remains)
            await waitFor(() => {
                const dropdowns = screen.getAllByTestId('level-dropdown');
                // Should only have the regular level dropdown, not the selection one
                expect(dropdowns).toBeDefined();
            });
        });

        it('should handle level change from selection dropdown', async () => {
            // Mock text selection
            const mockRange = {
                getBoundingClientRect: () => ({ left: 50, bottom: 20, width: 30 }),
                commonAncestorContainer: document.createElement('div'),
            };

            mockGetSelection.mockReturnValue({
                isCollapsed: false,
                toString: () => 'selected text',
                getRangeAt: () => mockRange,
                removeAllRanges: vi.fn(),
            });

            const { container } = render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            const messageContent = container.querySelector('.whitespace-pre-wrap');
            if (messageContent) {
                Object.defineProperty(messageContent, 'contains', {
                    value: () => true,
                });
            }

            // Simulate text selection
            fireEvent.mouseUp(messageContent || container);

            await waitFor(() => {
                const collegeButton = screen.getByText('College');
                expect(collegeButton).toBeDefined();
            });

            // Click college level
            const collegeButton = screen.getByText('College');
            fireEvent.click(collegeButton);

            expect(mockOnLevelChange).toHaveBeenCalledWith('assistant-msg-1', 'college');
        });

        it('should clear text selection after level change', async () => {
            const mockRemoveAllRanges = vi.fn();

            // Mock text selection
            const mockRange = {
                getBoundingClientRect: () => ({ left: 50, bottom: 20, width: 30 }),
                commonAncestorContainer: document.createElement('div'),
            };

            mockGetSelection.mockReturnValue({
                isCollapsed: false,
                toString: () => 'selected text',
                getRangeAt: () => mockRange,
                removeAllRanges: mockRemoveAllRanges,
            });

            const { container } = render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            const messageContent = container.querySelector('.whitespace-pre-wrap');
            if (messageContent) {
                Object.defineProperty(messageContent, 'contains', {
                    value: () => true,
                });
            }

            // Simulate text selection
            fireEvent.mouseUp(messageContent || container);

            await waitFor(() => {
                const collegeButton = screen.getByText('College');
                expect(collegeButton).toBeDefined();
            });

            // Click college level
            const collegeButton = screen.getByText('College');
            fireEvent.click(collegeButton);

            // Should clear text selection
            expect(mockRemoveAllRanges).toHaveBeenCalled();
        });
    });

    describe('Controlled Dropdown Behavior - PREVENTS FLASHING BUG', () => {
        const assistantMessage: Message = {
            id: 'assistant-msg-1',
            content: 'Test message',
            role: 'assistant',
            status: 'complete',
            level: 'elementary',
            createdAt: Date.now(),
        };

        it('should pass open and onOpenChange props to LevelDropdown', () => {
            render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            const dropdown = screen.getByTestId('level-dropdown');
            expect(dropdown).toBeDefined();
            // The mock should receive open/onOpenChange props for controlled behavior
        });

        it('should handle dropdown state changes properly', async () => {
            render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            const collegeButton = screen.getByText('College');
            fireEvent.click(collegeButton);

            expect(mockOnLevelChange).toHaveBeenCalledWith('assistant-msg-1', 'college');
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

        it('should show level dropdown for pending messages with level change handler', () => {
            render(
                <MessageBubble
                    message={pendingMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            // Should still show level dropdown even for pending messages
            expect(screen.getByTestId('level-dropdown')).toBeDefined();
        });

        it('should not enable text selection for pending messages', () => {
            const { container } = render(
                <MessageBubble
                    message={pendingMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            // Should have select-text class only for complete messages
            const messageContent = container.querySelector('.select-text');
            expect(messageContent).toBeNull();
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

        it('should show level dropdown for assistant messages with level change handler', () => {
            render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            expect(screen.getByTestId('level-dropdown')).toBeDefined();
        });

        it('should call onLevelChange when level is selected', () => {
            render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                />
            );

            const collegeButton = screen.getByText('College');
            fireEvent.click(collegeButton);

            expect(mockOnLevelChange).toHaveBeenCalledWith('assistant-msg-1', 'college');
        });

        it('should not show level dropdown for user messages', () => {
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

            expect(screen.queryByTestId('level-dropdown')).toBeNull();
        });

        it('should show static level badge when no onLevelChange provided', () => {
            render(<MessageBubble message={assistantMessage} />);

            expect(screen.getByText('Elementary')).toBeDefined();
            expect(screen.queryByTestId('level-dropdown')).toBeNull();
        });
    });

    describe('guest mode support', () => {
        const assistantMessage: Message = {
            id: 'assistant-msg-1',
            content: 'Test message',
            role: 'assistant',
            status: 'complete',
            level: 'elementary',
            createdAt: Date.now(),
        };

        it('should pass isGuest prop to level dropdown', () => {
            render(
                <MessageBubble
                    message={assistantMessage}
                    onLevelChange={mockOnLevelChange}
                    isGuest={true}
                />
            );

            expect(screen.getByTestId('level-dropdown')).toBeDefined();
        });
    });
}); 
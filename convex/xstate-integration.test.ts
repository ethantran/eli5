import { expect, test, describe, vi, beforeEach, afterEach } from "vitest";

// Mock localStorage for the test environment
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Import after setting up localStorage mock
import { useGuestSession } from '../app/lib/hooks/use-guest-session';
import { renderHook, act } from '@testing-library/react';

describe("XState Integration - addMessage Bug Fix", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("addMessage should return message with correct ID", async () => {
        const { result } = renderHook(() => useGuestSession());

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.session).toBeTruthy();

        // Add a message and check that we get a valid message back
        let addedMessage: any = null;

        act(() => {
            addedMessage = result.current.addMessage({
                content: 'Test message',
                role: 'user',
                status: 'complete',
            });
        });

        console.log('Added message result:', addedMessage);

        // Verify the message was returned with an ID
        expect(addedMessage).toBeTruthy();
        expect(addedMessage?.id).toBeTruthy();
        expect(addedMessage?.content).toBe('Test message');
        expect(addedMessage?.role).toBe('user');

        // Verify the message is in the session
        expect(result.current.session?.messages).toHaveLength(1);
        expect(result.current.session?.messages[0]?.id).toBe(addedMessage?.id);

        console.log('✅ Message ID correctly returned and stored');
    });

    test("addMessage should return null when no session", async () => {
        const { result } = renderHook(() => useGuestSession());

        // Clear the session first
        act(() => {
            result.current.clearSession();
        });

        expect(result.current.session).toBeNull();

        // Try to add a message without a session
        let addedMessage: any = null;

        act(() => {
            addedMessage = result.current.addMessage({
                content: 'Test message',
                role: 'user',
                status: 'complete',
            });
        });

        console.log('Added message result (no session):', addedMessage);

        // Should return null
        expect(addedMessage).toBeNull();

        console.log('✅ Correctly returns null when no session');
    });

    test("multiple addMessage calls should return unique IDs", async () => {
        const { result } = renderHook(() => useGuestSession());

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.session).toBeTruthy();

        // Add multiple messages
        const messages: any[] = [];

        act(() => {
            messages.push(result.current.addMessage({
                content: 'Message 1',
                role: 'user',
                status: 'complete',
            }));

            messages.push(result.current.addMessage({
                content: 'Message 2',
                role: 'assistant',
                status: 'complete',
                level: 'elementary',
            }));

            messages.push(result.current.addMessage({
                content: '',
                role: 'assistant',
                status: 'pending',
                level: 'elementary',
            }));
        });

        console.log('Multiple messages:', messages.map(m => ({ id: m?.id, content: m?.content })));

        // All should have unique IDs
        expect(messages[0]?.id).toBeTruthy();
        expect(messages[1]?.id).toBeTruthy();
        expect(messages[2]?.id).toBeTruthy();

        expect(messages[0]?.id).not.toBe(messages[1]?.id);
        expect(messages[1]?.id).not.toBe(messages[2]?.id);
        expect(messages[0]?.id).not.toBe(messages[2]?.id);

        // Session should have all messages
        expect(result.current.session?.messages).toHaveLength(3);

        console.log('✅ Multiple messages have unique IDs');
    });

    test("simulate exact frontend workflow", async () => {
        const { result } = renderHook(() => useGuestSession());

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.session).toBeTruthy();

        // Simulate the exact workflow from guest-chat-interface.tsx
        let userMessage: any = null;
        let pendingMessage: any = null;

        act(() => {
            // Add user message (like line 77 in guest-chat-interface.tsx)
            userMessage = result.current.addMessage({
                content: 'How do computers work?',
                role: 'user',
                status: 'complete',
            });

            // Add pending AI message (like line 85 in guest-chat-interface.tsx)  
            pendingMessage = result.current.addMessage({
                content: '',
                role: 'assistant',
                level: result.current.session?.currentLevel,
                status: 'pending',
            });
        });

        console.log('Frontend workflow results:', {
            userMessage: { id: userMessage?.id, content: userMessage?.content },
            pendingMessage: { id: pendingMessage?.id, status: pendingMessage?.status }
        });

        // Both messages should have valid IDs
        expect(userMessage?.id).toBeTruthy();
        expect(pendingMessage?.id).toBeTruthy();

        // IDs should be different
        expect(userMessage?.id).not.toBe(pendingMessage?.id);

        // pendingMessage.id should be usable for updateMessage
        expect(typeof pendingMessage?.id).toBe('string');
        expect(pendingMessage?.id.length).toBeGreaterThan(0);

        // Simulate updating the pending message (like line 124 in guest-chat-interface.tsx)
        act(() => {
            result.current.updateMessage(pendingMessage?.id, {
                content: 'This is the AI response',
                status: 'complete',
                metadata: { tokenCount: 100 },
            });
        });

        // Verify the message was updated
        const updatedMessage = result.current.session?.messages.find(m => m.id === pendingMessage?.id);
        expect(updatedMessage?.content).toBe('This is the AI response');
        expect(updatedMessage?.status).toBe('complete');

        console.log('✅ Complete frontend workflow simulation successful');
    });
}); 
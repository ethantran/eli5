import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Sparkles, ArrowRight, X } from 'lucide-react';
import { useGuestSession } from '~/lib/hooks/use-guest-session';
import { MessageBubble } from '~/components/message-bubble';
import { ChatInput } from '~/components/chat-input';
import type { EducationLevel } from '~/lib/types';
import { cn } from '~/lib/utils';
import { useAction } from 'convex/react';
import { api } from 'convex/_generated/api';

interface GuestChatInterfaceProps {
    onSignUp?: () => void;
    onBack?: () => void;
}

export function GuestChatInterface({ onSignUp, onBack }: GuestChatInterfaceProps) {
    const {
        session,
        isLoading: sessionLoading,
        error: sessionError,
        addMessage,
        updateMessage,
        updateLevel,
        messageCount,
        canConvert,
    } = useGuestSession();

    const [isGenerating, setIsGenerating] = useState(false);
    const [showConversionPrompt, setShowConversionPrompt] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const generateExplanation = useAction(api.guest.generateGuestExplanation);
    const regenerateAtLevel = useAction(api.guest.regenerateAtLevel);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session?.messages]);

    // Show conversion prompt after enough interaction
    useEffect(() => {
        if (canConvert && !showConversionPrompt) {
            setShowConversionPrompt(true);
        }
    }, [canConvert, showConversionPrompt]);

    const handleSendMessage = async (content: string) => {
        console.log('=== handleSendMessage called ===');
        console.log('Input:', { content: content.substring(0, 100), contentLength: content.length });
        console.log('Current state:', {
            hasSession: !!session,
            isGenerating,
            sessionId: session?.sessionId,
            currentLevel: session?.currentLevel,
            messageCount: session?.messages?.length
        });

        if (!session || isGenerating) {
            console.log('Early return - no session or already generating');
            return;
        }

        try {
            console.log('Setting isGenerating to true');
            setIsGenerating(true);

            console.log('Adding user message...');
            // Add user message
            const userMessage = {
                content,
                role: 'user' as const,
                status: 'complete' as const,
            };
            console.log('User message to add:', userMessage);
            addMessage(userMessage);

            console.log('Adding pending AI message...');
            // Add pending AI message
            const pendingMessage = {
                content: '',
                role: 'assistant' as const,
                level: session.currentLevel,
                status: 'pending' as const,
            };
            console.log('Pending message to add:', pendingMessage);
            addMessage(pendingMessage);

            console.log('Current messages after adding:', session.messages.length);

            console.log('Calling generateExplanation...');
            // Generate AI response
            const response = await generateExplanation({
                content,
                level: session.currentLevel,
                sessionId: session.sessionId,
            });

            console.log('Generated response received:', {
                id: response.id,
                contentLength: response.content.length,
                level: response.level,
                metadata: response.metadata
            });

            // Update the pending message with the response
            const messages = session.messages;
            console.log('Current messages before update:', messages.length);
            const pendingMessageId = messages[messages.length - 1]?.id;
            console.log('Pending message ID to update:', pendingMessageId);

            if (pendingMessageId) {
                console.log('Updating pending message with response...');
                const updateData = {
                    content: response.content,
                    status: 'complete' as const,
                    metadata: response.metadata,
                };
                console.log('Update data:', updateData);
                updateMessage(pendingMessageId, updateData);
                console.log('Message update completed');
            } else {
                console.error('No pending message ID found to update!');
            }
        } catch (error) {
            console.error('=== Error in handleSendMessage ===');
            console.error('Error details:', {
                error: error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                type: typeof error
            });

            // Update with error state
            const messages = session?.messages || [];
            console.log('Messages for error handling:', messages.length);
            const pendingMessageId = messages[messages.length - 1]?.id;
            console.log('Pending message ID for error update:', pendingMessageId);

            if (pendingMessageId) {
                console.log('Updating message with error state...');
                const errorUpdate = {
                    content: 'Sorry, I encountered an error while generating your explanation. Please try again.',
                    status: 'error' as const,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                };
                console.log('Error update data:', errorUpdate);
                updateMessage(pendingMessageId, errorUpdate);
                console.log('Error update completed');
            } else {
                console.error('No pending message ID found for error update!');
            }
        } finally {
            console.log('Setting isGenerating to false');
            setIsGenerating(false);
            console.log('handleSendMessage completed');
        }
    };

    const handleLevelChange = async (messageId: string, newLevel: EducationLevel) => {
        console.log('=== handleLevelChange called ===');
        console.log('Input:', { messageId, newLevel });
        console.log('Current state:', {
            hasSession: !!session,
            isGenerating,
            sessionId: session?.sessionId,
            currentLevel: session?.currentLevel,
            messageCount: session?.messages?.length
        });

        if (!session || isGenerating) {
            console.log('Early return - no session or already generating');
            return;
        }

        try {
            console.log('Setting isGenerating to true');
            setIsGenerating(true);

            console.log('Updating level...');
            updateLevel(newLevel);

            // Find the original user message for this response
            console.log('Finding original user message...');
            const messageIndex = session.messages.findIndex(m => m.id === messageId);
            console.log('Message index:', messageIndex);

            const userMessage = session.messages
                .slice(0, messageIndex)
                .reverse()
                .find(m => m.role === 'user');

            console.log('Found user message:', userMessage ? {
                id: userMessage.id,
                content: userMessage.content.substring(0, 100),
                role: userMessage.role
            } : 'NOT FOUND');

            if (!userMessage) {
                console.error('No user message found for regeneration');
                return;
            }

            // Update current message to pending
            console.log('Updating message to pending state...');
            updateMessage(messageId, {
                status: 'pending' as const,
                level: newLevel,
            });

            console.log('Calling regenerateAtLevel...');
            // Regenerate at new level
            const response = await regenerateAtLevel({
                originalContent: userMessage.content,
                newLevel,
                sessionId: session.sessionId,
            });

            console.log('Regeneration response received:', {
                id: response.id,
                contentLength: response.content.length,
                level: response.level,
                metadata: response.metadata
            });

            // Update with new response
            console.log('Updating message with new response...');
            const finalUpdate = {
                content: response.content,
                level: newLevel,
                status: 'complete' as const,
                metadata: response.metadata,
            };
            console.log('Final update data:', finalUpdate);
            updateMessage(messageId, finalUpdate);
            console.log('Level change update completed');
        } catch (error) {
            console.error('=== Error in handleLevelChange ===');
            console.error('Error details:', {
                error: error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                type: typeof error
            });

            console.log('Updating message with error state...');
            updateMessage(messageId, {
                status: 'error' as const,
                errorMessage: error instanceof Error ? error.message : 'Failed to regenerate explanation',
            });
            console.log('Error update completed');
        } finally {
            console.log('Setting isGenerating to false');
            setIsGenerating(false);
            console.log('handleLevelChange completed');
        }
    };

    if (sessionLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing your learning session...</p>
                </div>
            </div>
        );
    }

    if (sessionError || !session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="p-6 max-w-md">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">⚠️</div>
                        <h3 className="font-semibold mb-2">Session Error</h3>
                        <p className="text-gray-600 mb-4">
                            {sessionError || 'Failed to initialize session'}
                        </p>
                        <Button onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const hasMessages = session.messages.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {onBack && (
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            ← Back
                        </Button>
                    )}
                    <div className="flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold">ELI5 Chat</span>
                        <Badge variant="secondary" className="text-xs">
                            Guest Mode
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Badge className="bg-blue-100 text-blue-800">
                        Level: {session.currentLevel}
                    </Badge>
                    {onSignUp && (
                        <Button size="sm" onClick={onSignUp}>
                            Sign Up
                        </Button>
                    )}
                </div>
            </header>

            {/* Conversion Prompt */}
            {showConversionPrompt && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center space-x-3">
                            <Sparkles className="w-5 h-5" />
                            <div>
                                <p className="font-medium">You're getting the hang of this!</p>
                                <p className="text-sm opacity-90">
                                    Sign up to save your progress and unlock advanced features
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {onSignUp && (
                                <Button
                                    size="sm"
                                    onClick={onSignUp}
                                    className="bg-white text-blue-600 hover:bg-gray-100"
                                >
                                    Sign Up Now
                                    <ArrowRight className="ml-1 w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowConversionPrompt(false)}
                                className="text-white hover:bg-white/20"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {!hasMessages ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Welcome to ELI5!</h2>
                            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                                Ask me to explain any topic, and I'll break it down at exactly the right level for you.
                                You can always click on my responses to change the complexity level.
                            </p>

                            {/* Example prompts */}
                            <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                                {[
                                    "How do computers work?",
                                    "What is quantum physics?",
                                    "Explain machine learning",
                                    "How does the stock market work?"
                                ].map((prompt) => (
                                    <Button
                                        key={prompt}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSendMessage(prompt)}
                                        disabled={isGenerating}
                                        className="text-left justify-start"
                                    >
                                        {prompt}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {session.messages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    onLevelChange={handleLevelChange}
                                    isGuest={true}
                                />
                            ))}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <ChatInput
                    onSend={handleSendMessage}
                    isLoading={isGenerating}
                    disabled={isGenerating}
                    placeholder="Ask me anything to explain..."
                />
            </div>

            {/* Guest Mode Info */}
            <div className="bg-gray-100 border-t px-4 py-2">
                <div className="flex items-center justify-between max-w-4xl mx-auto text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Guest Mode - {messageCount} messages
                        </span>
                        <span>Conversations are not saved</span>
                    </div>
                    {onSignUp && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={onSignUp}
                            className="text-blue-600 p-0 h-auto"
                        >
                            Sign up to save progress →
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
} 
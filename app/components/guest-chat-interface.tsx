import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Sparkles, ArrowRight, X } from 'lucide-react';
import { useGuestSessionWithConvex } from '~/lib/hooks/use-guest-session-with-convex';
import { MessageBubble } from '~/components/message-bubble';
import { ChatInput } from '~/components/chat-input';
import type { EducationLevel } from '~/lib/types';
import { cn } from '~/lib/utils';

interface GuestChatInterfaceProps {
    onSignUp?: () => void;
    onBack?: () => void;
}

export function GuestChatInterface({ onSignUp, onBack }: GuestChatInterfaceProps) {
    const {
        session,
        isLoading: sessionLoading,
        isGenerating,
        error: sessionError,
        sendMessage,
        regenerateMessage,
        messageCount,
        canConvert,
    } = useGuestSessionWithConvex();

    const [showConversionPrompt, setShowConversionPrompt] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Simplified handlers - just dispatch events!
    const handleSendMessage = (content: string) => {
        console.log('Sending message:', content);
        sendMessage(content);
    };

    const handleLevelChange = (messageId: string, newLevel: EducationLevel) => {
        console.log('Changing level:', { messageId, newLevel });
        regenerateMessage(messageId, newLevel);
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

    console.log('session', session);

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
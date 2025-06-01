import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, Clock, User, Bot } from 'lucide-react';
import { LEVEL_DEFINITIONS, type Message, type EducationLevel } from '../lib/types';
import { LevelDropdown } from './level-dropdown';
import { cn } from '../lib/utils';

interface MessageBubbleProps {
    message: Message;
    onLevelChange?: (messageId: string, newLevel: EducationLevel) => void;
    isGuest?: boolean;
    className?: string;
}

export function MessageBubble({
    message,
    onLevelChange,
    isGuest = false,
    className
}: MessageBubbleProps) {
    const [showLevelDropdown, setShowLevelDropdown] = useState(false);
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const canChangeLevel = isAssistant && onLevelChange && message.level;

    const handleLevelChange = (newLevel: EducationLevel) => {
        if (onLevelChange && message.level) {
            onLevelChange(message.id, newLevel);
        }
        setShowLevelDropdown(false);
    };

    return (
        <div className={cn(
            "flex w-full mb-4",
            isUser ? "justify-end" : "justify-start",
            className
        )}>
            <div className={cn(
                "flex max-w-[80%] space-x-3",
                isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isUser
                        ? "bg-blue-500 text-white"
                        : "bg-gradient-to-br from-purple-500 to-blue-600 text-white"
                )}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                    <Card className={cn(
                        "relative",
                        isUser
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white border-gray-200 hover:shadow-md transition-shadow",
                        message.status === 'pending' && "opacity-70",
                        message.status === 'error' && "border-red-300 bg-red-50"
                    )}>
                        <div
                            className={cn(
                                "p-4 cursor-pointer",
                                canChangeLevel && "hover:bg-gray-50"
                            )}
                            onClick={() => canChangeLevel && setShowLevelDropdown(true)}
                        >
                            {/* Message Content */}
                            <div className={cn(
                                "whitespace-pre-wrap break-words",
                                isUser ? "text-white" : "text-gray-900"
                            )}>
                                {message.content}
                            </div>

                            {/* Error Message */}
                            {message.status === 'error' && message.errorMessage && (
                                <div className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">
                                    ⚠️ {message.errorMessage}
                                </div>
                            )}

                            {/* Loading State */}
                            {message.status === 'pending' && (
                                <div className="flex items-center mt-2 text-sm text-gray-500">
                                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                                    Generating explanation...
                                </div>
                            )}

                            {/* Message Metadata */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center space-x-2">
                                    {/* Level Badge */}
                                    {message.level && (
                                        <Badge className={cn(
                                            LEVEL_DEFINITIONS[message.level].color,
                                            "text-xs"
                                        )}>
                                            {LEVEL_DEFINITIONS[message.level].label}
                                        </Badge>
                                    )}

                                    {/* Timestamp */}
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(message.createdAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>

                                {/* Level Change Hint */}
                                {canChangeLevel && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-gray-400 hover:text-gray-600 h-auto p-1"
                                    >
                                        <ChevronDown className="w-3 h-3 mr-1" />
                                        Change level
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Level Dropdown */}
                        {showLevelDropdown && canChangeLevel && (
                            <LevelDropdown
                                currentLevel={message.level!}
                                onSelect={handleLevelChange}
                                onClose={() => setShowLevelDropdown(false)}
                                isGuest={isGuest}
                            />
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
} 
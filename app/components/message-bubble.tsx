import { useRef, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, Clock, User, Bot } from 'lucide-react';
import { LEVEL_DEFINITIONS, type Message, type EducationLevel } from '~/lib/types';
import { LevelDropdown } from '~/components/level-dropdown';
import { cn } from '~/lib/utils';

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
    const messageContentRef = useRef<HTMLDivElement>(null);
    const [selectionDropdown, setSelectionDropdown] = useState<{
        show: boolean;
        position: { x: number; y: number };
        isOpen: boolean;
    }>({ show: false, position: { x: 0, y: 0 }, isOpen: false });

    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const canChangeLevel = isAssistant && onLevelChange && message.level;

    const handleLevelChange = (newLevel: EducationLevel) => {
        if (onLevelChange && message.level) {
            onLevelChange(message.id, newLevel);
        }
    };

    const handleSelectionDropdownLevelChange = (newLevel: EducationLevel) => {
        if (onLevelChange) {
            onLevelChange(message.id, newLevel);
        }
        // Clear the selection and hide dropdown
        setSelectionDropdown({ show: false, position: { x: 0, y: 0 }, isOpen: false });
        window.getSelection()?.removeAllRanges();
    };

    const handleSelectionDropdownOpenChange = (open: boolean) => {
        setSelectionDropdown(prev => ({ ...prev, isOpen: open }));

        // If closing and no longer open, hide the entire selection dropdown
        if (!open) {
            setSelectionDropdown({ show: false, position: { x: 0, y: 0 }, isOpen: false });
            window.getSelection()?.removeAllRanges();
        }
    };

    // Handle text selection in assistant messages
    useEffect(() => {
        if (!canChangeLevel) return;

        const handleTextSelection = () => {
            if (!messageContentRef.current) return;

            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
                setSelectionDropdown({ show: false, position: { x: 0, y: 0 }, isOpen: false });
                return;
            }

            // Check if selection is within this message
            const range = selection.getRangeAt(0);
            if (!messageContentRef.current.contains(range.commonAncestorContainer)) {
                return;
            }

            // Get selection position
            const rect = range.getBoundingClientRect();
            const messageRect = messageContentRef.current.getBoundingClientRect();

            const position = {
                x: rect.left + rect.width / 2 - messageRect.left,
                y: rect.bottom - messageRect.top + 8
            };

            setSelectionDropdown({ show: true, position, isOpen: true });
        };

        const handleClickOutside = (event: MouseEvent) => {
            // Don't clear selection if clicking on the dropdown
            const target = event.target as Element;
            if (target?.closest('[data-radix-dropdown-menu-content]') ||
                target?.closest('[data-radix-dropdown-menu-trigger]')) {
                return;
            }

            // Clear if clicking outside message content
            if (!messageContentRef.current?.contains(event.target as Node)) {
                setSelectionDropdown({ show: false, position: { x: 0, y: 0 }, isOpen: false });
            }
        };

        document.addEventListener('mouseup', handleTextSelection);
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('mouseup', handleTextSelection);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [canChangeLevel]);

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
                        <div className="p-4">
                            {/* Message Content */}
                            <div
                                ref={messageContentRef}
                                className={cn(
                                    "whitespace-pre-wrap break-words relative",
                                    isUser ? "text-white" : "text-gray-900",
                                    canChangeLevel && "select-text cursor-text"
                                )}
                            >
                                {message.content}

                                {/* Text Selection Dropdown */}
                                {selectionDropdown.show && canChangeLevel && (
                                    <div
                                        className="absolute z-50"
                                        style={{
                                            left: `${selectionDropdown.position.x}px`,
                                            top: `${selectionDropdown.position.y}px`,
                                            transform: 'translateX(-50%)'
                                        }}
                                    >
                                        <LevelDropdown
                                            currentLevel={message.level!}
                                            onSelect={handleSelectionDropdownLevelChange}
                                            isGuest={isGuest}
                                            open={selectionDropdown.isOpen}
                                            onOpenChange={handleSelectionDropdownOpenChange}
                                            triggerContent={
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-500 text-white shadow-lg hover:bg-blue-600"
                                                >
                                                    <ChevronDown className="w-3 h-3 mr-1" />
                                                    Change level
                                                </Button>
                                            }
                                        />
                                    </div>
                                )}
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
                                    {/* Static Level Badge - shows what level this message was generated at */}
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

                                {/* Change Level Dropdown - separate button for changing level */}
                                {canChangeLevel && (
                                    <LevelDropdown
                                        currentLevel={message.level!}
                                        onSelect={handleLevelChange}
                                        isGuest={isGuest}
                                        triggerContent={
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-gray-400 hover:text-gray-600 h-auto p-1"
                                            >
                                                <ChevronDown className="w-3 h-3 mr-1" />
                                                Change level
                                            </Button>
                                        }
                                    />
                                )}

                                {/* Set Level hint for messages without level */}
                                {!message.level && onLevelChange && (
                                    <LevelDropdown
                                        currentLevel="elementary" // default starting point
                                        onSelect={handleLevelChange}
                                        isGuest={isGuest}
                                        triggerContent={
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-gray-400 hover:text-gray-600 h-auto p-1"
                                            >
                                                <ChevronDown className="w-3 h-3 mr-1" />
                                                Set level
                                            </Button>
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
} 
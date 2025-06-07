import { useState, useRef, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '~/lib/utils';

interface ChatInputProps {
    onSend: (content: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function ChatInput({
    onSend,
    isLoading = false,
    disabled = false,
    placeholder = "Ask me anything to explain...",
    className
}: ChatInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading || disabled) return;

        onSend(trimmedInput);
        setInput('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);

        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    };

    const canSend = input.trim().length > 0 && !isLoading && !disabled;

    return (
        <div className={cn("border-t bg-white p-4", className)}>
            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            "w-full resize-none rounded-lg border border-gray-300 px-4 py-3",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            "disabled:bg-gray-50 disabled:text-gray-500",
                            "placeholder:text-gray-500 text-gray-900",
                            "max-h-[200px] overflow-y-auto"
                        )}
                        style={{ minHeight: '48px' }}
                    />

                    {/* Character limit indicator */}
                    {input.length > 4000 && (
                        <div className={cn(
                            "absolute bottom-2 right-2 text-xs",
                            input.length > 5000 ? "text-red-500" : "text-yellow-500"
                        )}>
                            {input.length}/5000
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={!canSend}
                    className={cn(
                        "shrink-0 h-12 w-12 p-0",
                        "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300",
                        "transition-colors duration-200"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </form>

            {/* Input hints */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
                <div className="flex items-center space-x-2">
                    {input.length > 0 && (
                        <span className={cn(
                            input.length > 5000 ? "text-red-500" : "text-gray-400"
                        )}>
                            {input.length} characters
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
} 
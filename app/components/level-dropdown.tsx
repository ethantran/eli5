import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EDUCATION_LEVELS, LEVEL_DEFINITIONS, type EducationLevel } from '~/lib/types';
import { cn } from '~/lib/utils';

interface LevelDropdownProps {
    currentLevel: EducationLevel;
    onSelect: (level: EducationLevel) => void;
    triggerContent?: React.ReactNode;
    isGuest?: boolean;
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function LevelDropdown({
    currentLevel,
    onSelect,
    triggerContent,
    isGuest = false,
    className,
    open,
    onOpenChange
}: LevelDropdownProps) {
    const handleLevelSelect = (level: EducationLevel) => {
        onSelect(level);
        // Close the dropdown after selection
        onOpenChange?.(false);
    };

    return (
        <div className={className}>
            <DropdownMenu open={open} onOpenChange={onOpenChange}>
                <DropdownMenuTrigger>
                    {triggerContent || (
                        <Button variant="outline" size="sm">
                            {LEVEL_DEFINITIONS[currentLevel].label}
                        </Button>
                    )}
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    className="w-56 bg-white border shadow-lg"
                    sideOffset={4}
                >
                    <DropdownMenuLabel>Choose level</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {isGuest && (
                        <>
                            <div className="px-2 py-2">
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                                    💡 You're in guest mode. Sign up to save your level preferences!
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {EDUCATION_LEVELS.map((level) => (
                        <DropdownMenuItem
                            key={level}
                            onClick={() => handleLevelSelect(level)}
                            className="flex items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-center space-x-2">
                                <span>{LEVEL_DEFINITIONS[level].label}</span>
                                <span className="text-xs text-gray-500">
                                    ({LEVEL_DEFINITIONS[level].ageRange})
                                </span>
                            </div>
                            {level === currentLevel && (
                                <Check className="w-4 h-4 text-blue-500" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
} 
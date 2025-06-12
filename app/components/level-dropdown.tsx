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
}

export function LevelDropdown({
    currentLevel,
    onSelect,
    triggerContent,
    isGuest = false,
    className
}: LevelDropdownProps) {
    const handleLevelSelect = (level: EducationLevel) => {
        console.log('Level selected:', level);
        if (level !== currentLevel) {
            onSelect(level);
        }
    };

    const handleOpenChange = (open: boolean) => {
        console.log('Dropdown open state changed:', open);
    };

    console.log('LevelDropdown rendering with triggerContent:', !!triggerContent);

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger>
                {triggerContent || (
                    <Button variant="outline" size="sm">
                        Level: {currentLevel}
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

                {EDUCATION_LEVELS.map((level) => {
                    const definition = LEVEL_DEFINITIONS[level];
                    const isSelected = level === currentLevel;

                    return (
                        <DropdownMenuItem
                            key={level}
                            onClick={() => handleLevelSelect(level)}
                        >
                            {isSelected && <Check className="mr-2 h-4 w-4" />}
                            <div className="flex flex-col">
                                <span className="font-medium">{definition.label}</span>
                                <span className="text-xs text-gray-500">{definition.ageRange}</span>
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 
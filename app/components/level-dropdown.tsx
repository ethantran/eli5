import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { EDUCATION_LEVELS, LEVEL_DEFINITIONS, type EducationLevel } from '~/lib/types';
import { cn } from '~/lib/utils';

interface LevelDropdownProps {
    currentLevel: EducationLevel;
    onSelect: (level: EducationLevel) => void;
    onClose: () => void;
    isGuest?: boolean;
    className?: string;
}

export function LevelDropdown({
    currentLevel,
    onSelect,
    onClose,
    isGuest = false,
    className
}: LevelDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close dropdown on escape key
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleLevelSelect = (level: EducationLevel) => {
        if (level !== currentLevel) {
            onSelect(level);
        } else {
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

            {/* Dropdown */}
            <Card
                ref={dropdownRef}
                className={cn(
                    "absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-gray-200",
                    "bg-white max-h-[400px] overflow-y-auto",
                    className
                )}
            >
                <div className="p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <h3 className="font-medium text-gray-900">Choose explanation level</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Guest Notice */}
                    {isGuest && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                            💡 You're in guest mode. Sign up to save your level preferences!
                        </div>
                    )}

                    {/* Level Options */}
                    <div className="space-y-2">
                        {EDUCATION_LEVELS.map((level) => {
                            const definition = LEVEL_DEFINITIONS[level];
                            const isSelected = level === currentLevel;

                            return (
                                <Button
                                    key={level}
                                    variant={isSelected ? "default" : "ghost"}
                                    className={cn(
                                        "w-full justify-start p-3 h-auto",
                                        isSelected && "bg-blue-500 text-white hover:bg-blue-600"
                                    )}
                                    onClick={() => handleLevelSelect(level)}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center space-x-3">
                                            {isSelected && <Check className="h-4 w-4 shrink-0" />}
                                            <div className="text-left">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{definition.label}</span>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-xs",
                                                            isSelected ? "bg-white/20 text-white" : ""
                                                        )}
                                                    >
                                                        {definition.ageRange}
                                                    </Badge>
                                                </div>
                                                <div className={cn(
                                                    "text-xs mt-1 opacity-80",
                                                    isSelected ? "text-white" : "text-gray-500"
                                                )}>
                                                    {definition.description}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-2 border-t text-xs text-gray-500 text-center">
                        Click any level to regenerate the explanation
                    </div>
                </div>
            </Card>
        </>
    );
} 
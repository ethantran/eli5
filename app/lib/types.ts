// Core types for ELI5 Learning Application

export const EDUCATION_LEVELS = [
    'preschool',
    'elementary',
    'middle',
    'high',
    'college',
    'phd'
] as const;

export type EducationLevel = typeof EDUCATION_LEVELS[number];

export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type MessageRole = typeof MESSAGE_ROLES[number];

export const MESSAGE_STATUS = ['pending', 'complete', 'error'] as const;
export type MessageStatus = typeof MESSAGE_STATUS[number];

export interface Message {
    id: string;
    content: string;
    role: MessageRole;
    level?: EducationLevel;
    status: MessageStatus;
    createdAt: number;
    isExpansion?: boolean;
    parentMessageId?: string;
    errorMessage?: string;
    metadata?: {
        tokenCount?: number;
        processingTime?: number;
        model?: string;
        confidence?: number;
    };
}

export interface GuestSession {
    sessionId: string;
    messages: Message[];
    currentLevel: EducationLevel;
    startedAt: number;
    messageCount: number;
    lastActivityAt: number;
}

export interface ExplanationRequest {
    content: string;
    level: EducationLevel;
    sessionId?: string;
    context?: string;
}

export interface ExplanationResponse {
    id: string;
    content: string;
    level: EducationLevel;
    metadata?: {
        tokenCount?: number;
        processingTime?: number;
        model?: string;
    };
}

// Level definitions for UI display
export const LEVEL_DEFINITIONS: Record<EducationLevel, {
    label: string;
    description: string;
    ageRange: string;
    color: string;
}> = {
    preschool: {
        label: 'Preschool',
        description: 'Very simple concepts with basic analogies',
        ageRange: 'Ages 3-5',
        color: 'bg-pink-100 text-pink-800'
    },
    elementary: {
        label: 'Elementary',
        description: 'Fundamental understanding with examples',
        ageRange: 'Ages 6-11',
        color: 'bg-blue-100 text-blue-800'
    },
    middle: {
        label: 'Middle School',
        description: 'Structured explanations with context',
        ageRange: 'Ages 12-14',
        color: 'bg-green-100 text-green-800'
    },
    high: {
        label: 'High School',
        description: 'Detailed analysis with applications',
        ageRange: 'Ages 15-18',
        color: 'bg-yellow-100 text-yellow-800'
    },
    college: {
        label: 'College',
        description: 'Comprehensive understanding with nuance',
        ageRange: 'Ages 18+',
        color: 'bg-purple-100 text-purple-800'
    },
    phd: {
        label: 'PhD',
        description: 'Technical depth with research implications',
        ageRange: 'Expert',
        color: 'bg-red-100 text-red-800'
    }
};

export interface LevelInteraction {
    id: string;
    messageId: string;
    fromLevel: EducationLevel;
    toLevel: EducationLevel;
    triggerType: 'dropdown' | 'auto_advance' | 'suggestion';
    createdAt: number;
    sessionId?: string;
}

export interface TextExpansion {
    id: string;
    messageId: string;
    selectedText: string;
    expansionLevel: EducationLevel;
    expansion: string;
    startIndex: number;
    endIndex: number;
    createdAt: number;
} 
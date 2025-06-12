import type { EducationLevel } from '../types';

// Service functions that can be called from state machines
export interface ConvexGuestService {
    generateExplanation: (params: {
        content: string;
        level: EducationLevel;
        sessionId: string;
    }) => Promise<{
        id: string;
        content: string;
        level: EducationLevel;
        metadata?: any;
    }>;

    regenerateAtLevel: (params: {
        originalContent: string;
        newLevel: EducationLevel;
        sessionId: string;
    }) => Promise<{
        id: string;
        content: string;
        level: EducationLevel;
        metadata?: any;
    }>;
}

// Implementation that will be injected by the component
let convexService: ConvexGuestService | null = null;

export function setConvexGuestService(service: ConvexGuestService) {
    convexService = service;
}

export function getConvexGuestService(): ConvexGuestService {
    if (!convexService) {
        throw new Error('ConvexGuestService not initialized. Call setConvexGuestService first.');
    }
    return convexService;
}

// Service functions that can be called from state machines
export async function generateGuestExplanation(params: {
    content: string;
    level: EducationLevel;
    sessionId: string;
}) {
    const service = getConvexGuestService();
    return service.generateExplanation(params);
}

export async function regenerateGuestAtLevel(params: {
    originalContent: string;
    newLevel: EducationLevel;
    sessionId: string;
}) {
    const service = getConvexGuestService();
    return service.regenerateAtLevel(params);
} 
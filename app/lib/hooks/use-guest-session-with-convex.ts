import { useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from 'convex/_generated/api';
import { setConvexGuestService, type ConvexGuestService } from '../services/guest-convex-service';
import { useGuestSession } from './use-guest-session';

export function useGuestSessionWithConvex() {
    const generateExplanation = useAction(api.guest.generateGuestExplanation);
    const regenerateAtLevel = useAction(api.guest.regenerateAtLevel);

    // Initialize the Convex service with React hooks
    useEffect(() => {
        const convexService: ConvexGuestService = {
            generateExplanation: async (params) => {
                return generateExplanation(params);
            },
            regenerateAtLevel: async (params) => {
                return regenerateAtLevel(params);
            },
        };

        setConvexGuestService(convexService);

        // Cleanup on unmount
        return () => {
            setConvexGuestService({
                generateExplanation: async () => {
                    throw new Error('ConvexGuestService not available');
                },
                regenerateAtLevel: async () => {
                    throw new Error('ConvexGuestService not available');
                },
            });
        };
    }, [generateExplanation, regenerateAtLevel]);

    return useGuestSession();
} 
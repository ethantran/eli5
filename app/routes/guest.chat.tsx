import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GuestChatInterface } from '~/components/guest-chat-interface';

export const Route = createFileRoute('/guest/chat')({
    component: GuestChat,
});

function GuestChat() {
    const navigate = useNavigate();

    const handleSignUp = () => {
        // TODO: Implement actual signup flow with Clerk
        console.log('Sign up clicked - will implement with Clerk');
        // For now, just navigate back to home
        navigate({ to: '/' });
    };

    const handleBackToLanding = () => {
        navigate({ to: '/' });
    };

    return (
        <GuestChatInterface
            onSignUp={handleSignUp}
            onBack={handleBackToLanding}
        />
    );
} 